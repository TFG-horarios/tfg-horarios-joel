import type {
  ScheduleDTO,
  GenerationScopeDTO,
  Shift,
} from '@tfg-horarios/shared';
import { Schedule } from '../domain/schedule.entity';
import type { IScheduleRepository } from '../domain/schedule.repository';
import type { IScheduleDataProvider } from '../domain/schedule-data.provider';
import type { IScheduleMemberProvider } from '../domain/schedule-member.provider';
import { ForbiddenError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import { ScheduleMapper } from './schedule.mapper';
import type { AppRole } from '@/core/permissions/roles';
import type {
  IScheduleEngineProvider,
  ScheduleEngineClassroomMap,
} from '../domain/schedule-engine.provider';

export class GenerateScheduleUseCase {
  constructor(
    private readonly scheduleRepository: IScheduleRepository,
    private readonly dataProvider: IScheduleDataProvider,
    private readonly memberProvider: IScheduleMemberProvider,
    private readonly engineProvider: IScheduleEngineProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    scope: GenerationScopeDTO
  ): Promise<ScheduleDTO[]> {
    const role: AppRole | null = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role || !hasPermission(role, 'UPDATE_ORGANIZATION_COMPONENTS')) {
      throw new ForbiddenError(
        'You do not have permission to generate schedules in this organization.'
      );
    }

    const targetDegreeIds =
      scope.degreeIds && scope.degreeIds.length > 0
        ? scope.degreeIds
        : await this.dataProvider.getTargetDegreeIds(organizationId);

    if (targetDegreeIds.length === 0) return [];

    const classrooms =
      await this.dataProvider.getAvailableClassrooms(organizationId);
    const classroomsCache: ScheduleEngineClassroomMap = {};
    const availableClassrooms: string[] = [];

    for (const c of classrooms) {
      availableClassrooms.push(c.id);
      classroomsCache[c.id] = {
        capacity: c.capacity,
        type: c.type,
      };
    }

    const generateForPeriod = async (period: number) => {
      const groupsData = await this.dataProvider.getGroupsInScope(
        organizationId,
        period,
        targetDegreeIds,
        scope.itineraryIds,
        scope.courseYears
      );

      if (groupsData.length === 0) return [];

      const academicYearConstraints =
        await this.dataProvider.getAcademicYearConstraints(
          scope.academicYearId
        );
      if (!academicYearConstraints) {
        throw new Error('Academic Year not found');
      }

      const parseTime = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return (hours || 0) * 60 + (minutes || 0);
      };

      const morningStart = parseTime(academicYearConstraints.morningStart);
      const morningEnd = parseTime(academicYearConstraints.morningEnd);
      const afternoonStart = parseTime(academicYearConstraints.afternoonStart);
      const afternoonEnd = parseTime(academicYearConstraints.afternoonEnd);

      const slotDuration = academicYearConstraints.slotDurationMinutes;
      const maxMorningSlots = Math.floor(
        (morningEnd - morningStart) / slotDuration
      );
      const maxAfternoonSlots = Math.floor(
        (afternoonEnd - afternoonStart) / slotDuration
      );

      const itinerariesPerDegreeYearShift = new Map<string, Set<string>>();

      for (const group of groupsData) {
        if (!group.isCommon && group.itineraryId) {
          const key = `${group.degreeId}_${group.courseYear}_${group.shift}`;
          if (!itinerariesPerDegreeYearShift.has(key)) {
            itinerariesPerDegreeYearShift.set(key, new Set());
          }
          itinerariesPerDegreeYearShift.get(key)!.add(group.itineraryId);
        }
      }

      const scopeKeysToGenerate = new Set<string>();
      for (const group of groupsData) {
        const baseKey = `${group.degreeId}_${group.courseYear}_${group.shift}`;
        const itineraries = itinerariesPerDegreeYearShift.get(baseKey);

        if (!itineraries || itineraries.size === 0) {
          scopeKeysToGenerate.add(`${baseKey}_common`);
        } else {
          if (group.isCommon) {
            for (const itinId of itineraries) {
              scopeKeysToGenerate.add(`${baseKey}_${itinId}`);
            }
          } else if (group.itineraryId) {
            scopeKeysToGenerate.add(`${baseKey}_${group.itineraryId}`);
          }
        }
      }

      const existingScheduleIdsToOverwrite: string[] = [];
      for (const scopeKey of scopeKeysToGenerate) {
        const parts = scopeKey.split('_');
        const degreeId = parts[0] || '';
        const courseYear = parseInt(parts[1] || '0', 10);
        const shift = (parts[2] || 'morning') as Shift;
        const itineraryId =
          parts[3] === 'common' ? null : parts.slice(3).join('_');

        const existing = await this.scheduleRepository.findByScope(
          organizationId,
          degreeId,
          itineraryId,
          scope.academicYearId,
          courseYear,
          period,
          shift
        );
        if (existing) {
          existingScheduleIdsToOverwrite.push(existing.id);
        }
      }

      const lockedAssignments =
        await this.scheduleRepository.findLockedAssignments(
          organizationId,
          scope.academicYearId,
          period,
          existingScheduleIdsToOverwrite
        );

      for (const locked of lockedAssignments) {
        if (locked.shift === 'afternoon' && locked.slotIndex !== null) {
          locked.slotIndex += maxMorningSlots;
        }
      }

      const alreadyLockedGroupIds = new Set(
        lockedAssignments.map((l) => l.subjectGroupId)
      );

      const groupsToGenerate = groupsData.filter(
        (g) => !alreadyLockedGroupIds.has(g.subjectGroupId)
      );

      const solution = await this.engineProvider.runGeneration(
        groupsToGenerate,
        classroomsCache,
        availableClassrooms,
        maxMorningSlots,
        maxAfternoonSlots,
        slotDuration,
        lockedAssignments
      );

      const inheritedAssignments = lockedAssignments.filter((l) =>
        groupsData.some((g) => g.subjectGroupId === l.subjectGroupId)
      );

      for (const inh of inheritedAssignments) {
        solution.assignments.push(inh);
      }

      type ScopeKey = string;
      const scopeAssignments = new Map<
        ScopeKey,
        {
          degreeId: string;
          itineraryId: string | null;
          courseYear: number;
          shift: Shift;
          assignments: typeof solution.assignments;
        }
      >();

      for (const assignment of solution.assignments) {
        const group = groupsData.find(
          (r) => r.subjectGroupId === assignment.subjectGroupId
        );
        if (!group) continue;

        const baseKey = `${assignment.degreeId}_${assignment.courseYear}_${assignment.shift}`;
        const itineraries = itinerariesPerDegreeYearShift.get(baseKey);

        if (!itineraries || itineraries.size === 0) {
          const key = `${baseKey}_common`;
          if (!scopeAssignments.has(key)) {
            scopeAssignments.set(key, {
              degreeId: assignment.degreeId,
              itineraryId: null,
              courseYear: assignment.courseYear,
              shift: assignment.shift,
              assignments: [],
            });
          }
          scopeAssignments.get(key)!.assignments.push(assignment);
        } else {
          if (group.isCommon) {
            for (const itinId of itineraries) {
              const key = `${baseKey}_${itinId}`;
              if (!scopeAssignments.has(key)) {
                scopeAssignments.set(key, {
                  degreeId: assignment.degreeId,
                  itineraryId: itinId,
                  courseYear: assignment.courseYear,
                  shift: assignment.shift,
                  assignments: [],
                });
              }
              scopeAssignments.get(key)!.assignments.push(assignment);
            }
          } else if (group.itineraryId) {
            const key = `${baseKey}_${group.itineraryId}`;
            if (!scopeAssignments.has(key)) {
              scopeAssignments.set(key, {
                degreeId: assignment.degreeId,
                itineraryId: group.itineraryId,
                courseYear: assignment.courseYear,
                shift: assignment.shift,
                assignments: [],
              });
            }
            scopeAssignments.get(key)!.assignments.push(assignment);
          }
        }
      }

      const schedulesToPersist: {
        schedule: Schedule;
        slots: Parameters<
          IScheduleRepository['createSchedulesWithSlots']
        >[0][0]['slots'];
      }[] = [];
      const generatedSchedules: Schedule[] = [];

      for (const [, sData] of scopeAssignments.entries()) {
        const existingSchedule = await this.scheduleRepository.findByScope(
          organizationId,
          sData.degreeId,
          sData.itineraryId,
          scope.academicYearId,
          sData.courseYear,
          period,
          sData.shift
        );

        const scopeSubjectGroupIds = new Set(
          sData.assignments.map((a) => a.subjectGroupId)
        );
        const scopeAssignmentsWithFilteredConflicts = sData.assignments.map(
          (asm) => {
            const filteredConflicts =
              asm.conflicts?.filter((c) => {
                if (c.type === 'COURSE_OVERLAP' && c.relatedSubjectGroupIds) {
                  return c.relatedSubjectGroupIds.some((id) =>
                    scopeSubjectGroupIds.has(id)
                  );
                }
                return true;
              }) || [];
            return { ...asm, conflicts: filteredConflicts };
          }
        );

        const scheduleConflictsCount =
          scopeAssignmentsWithFilteredConflicts.reduce(
            (acc, asm) => acc + asm.conflicts.length,
            0
          );

        const schedule =
          existingSchedule ||
          Schedule.create({
            organizationId,
            degreeId: sData.degreeId,
            itineraryId: sData.itineraryId,
            academicYearId: scope.academicYearId,
            courseYear: sData.courseYear,
            period: period,
            shift: sData.shift,
            status: 'draft',
            conflicts: scheduleConflictsCount,
          });

        if (existingSchedule) {
          schedule.markAsDraft();
          schedule.updateConflicts(scheduleConflictsCount);
        }

        const slots = scopeAssignmentsWithFilteredConflicts.map((asm) => ({
          scheduleId: schedule.id,
          subjectGroupId: asm.subjectGroupId,
          classroomId: asm.classroomId,
          dayOfWeek: asm.dayOfWeek,
          slotIndex: asm.slotIndex,
          duration: asm.duration,
          conflicts: asm.conflicts,
        }));

        schedulesToPersist.push({ schedule, slots });
        generatedSchedules.push(schedule);
      }

      if (schedulesToPersist.length > 0) {
        await this.scheduleRepository.createSchedulesWithSlots(
          schedulesToPersist
        );
      }

      return generatedSchedules;
    };

    const results = await Promise.all(
      scope.periods.map((period) => generateForPeriod(period))
    );

    const allSchedules = results.flat();
    return allSchedules.map((s) => ScheduleMapper.toDTO(s));
  }
}
