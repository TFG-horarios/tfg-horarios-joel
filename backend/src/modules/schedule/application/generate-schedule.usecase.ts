import type {
  ScheduleDTO,
  GenerationScopeDTO,
  Shift,
} from '@tfg-horarios/shared';
import {
  buildScheduleTimeGrid,
  projectAssignmentInterval,
  type ScheduleTimeGrid,
} from '@tfg-horarios/shared';
import { Schedule } from '../domain/schedule.entity';
import type { IScheduleRepository } from '../domain/schedule.repository';
import type { IScheduleDataProvider } from '../domain/providers/schedule-data.provider';
import type { IScheduleMemberProvider } from '../domain/providers/schedule-member.provider';
import { ForbiddenError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import { ScheduleMapper } from './schedule.mapper';
// TODO: DESACOPLAR
import { getUnassignedDiagnostics } from '../../schedule-slot/domain/unassigned-diagnostics';
// TODO: DESACOPLAR
import {
  countSchedulingConflicts,
  isUnassignedPlacement,
} from '../../schedule-slot/domain/schedule-issues';
import type { AppRole } from '@/core/permissions/roles';
import type {
  IScheduleEngineProvider,
  ScheduleEngineClassroomMap,
} from '../domain/providers/schedule-engine.provider';

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
        floor: c.floor,
      };
    }

    type PersistedScheduleItem = Omit<
      Parameters<IScheduleRepository['createSchedulesWithSlots']>[0][number],
      'inclusions'
    > & {
      inclusions: NonNullable<
        Parameters<
          IScheduleRepository['createSchedulesWithSlots']
        >[0][number]['inclusions']
      >;
      baseKey: string;
      itineraryId: string | null;
    };
    type ScheduleSlotInclusion = NonNullable<
      Parameters<IScheduleRepository['createSchedulesWithSlots']>[1]
    >[number];
    type ReservationSlot = {
      classroomId: string;
      dayOfWeek: number;
      slotIndex: number;
      duration: number;
      period: number;
      timeConfigId: string;
      startTimeMinutes: number;
      endTimeMinutes: number;
    };
    type PeriodGenerationResult = {
      schedulesToPersist: PersistedScheduleItem[];
      additionalInclusions: ScheduleSlotInclusion[];
      generatedSchedules: Schedule[];
      reservationSlots: ReservationSlot[];
    };

    const emptyPeriodResult = (): PeriodGenerationResult => ({
      schedulesToPersist: [],
      additionalInclusions: [],
      generatedSchedules: [],
      reservationSlots: [],
    });

    const generateForPeriod = async (
      period: number
    ): Promise<PeriodGenerationResult> => {
      const groupsData = await this.dataProvider.getGroupsInScope(
        organizationId,
        period,
        targetDegreeIds,
        scope.itineraryIds,
        scope.courseYears
      );

      if (groupsData.length === 0) return emptyPeriodResult();

      const academicYearConstraints =
        await this.dataProvider.getAcademicYearConstraints(
          scope.academicYearId
        );
      if (!academicYearConstraints) {
        throw new Error('Academic Year not found');
      }

      const timeConfigs =
        (await this.dataProvider.getScheduleTimeConfigs?.(
          organizationId,
          scope.academicYearId
        )) ?? [];
      const timeConfigKey = (
        degreeId: string,
        courseYear: number,
        configPeriod: number,
        shift: Shift,
        itineraryId: string | null
      ) =>
        [
          degreeId,
          courseYear,
          configPeriod,
          shift,
          itineraryId ?? 'common',
        ].join(':');
      const timeConfigByScope = new Map(
        timeConfigs.map((config) => [
          timeConfigKey(
            config.degreeId,
            config.courseYear,
            config.period,
            config.shift,
            config.itineraryId
          ),
          config,
        ])
      );
      const resolveTimeConfigId = (
        degreeId: string,
        courseYear: number,
        shift: Shift,
        itineraryId: string | null
      ) => {
        const specific = itineraryId
          ? timeConfigByScope.get(
              timeConfigKey(degreeId, courseYear, period, shift, itineraryId)
            )
          : null;
        const base = timeConfigByScope.get(
          timeConfigKey(degreeId, courseYear, period, shift, null)
        );
        const effective = specific ?? base;
        if (!effective) {
          throw new Error(
            `Missing schedule time configuration for degree=${degreeId}, courseYear=${courseYear}, period=${period}, shift=${shift}, itinerary=${itineraryId ?? 'common'}`
          );
        }
        return effective.id;
      };

      const slotDuration = academicYearConstraints.slotDurationMinutes;
      const timeGrids: Record<string, ScheduleTimeGrid> = Object.fromEntries(
        timeConfigs.map((config) => [
          config.id,
          buildScheduleTimeGrid(
            {
              slotDurationMinutes: academicYearConstraints.slotDurationMinutes,
              breakDurationMinutes:
                academicYearConstraints.breakDurationMinutes,
            },
            {
              startTime: config.startTime,
              endTime: config.endTime,
              hasBreak: config.hasBreak,
              breakAfterSlot: config.breakAfterSlot,
            }
          ),
        ])
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
            scopeKeysToGenerate.add(`${baseKey}_common`);
          }

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

      const commonSubjectGroupIdsInScope = new Set(
        groupsData
          .filter((group) => group.isCommon)
          .map((group) => group.subjectGroupId)
      );

      const effectiveLockedAssignments = lockedAssignments.filter(
        (assignment) =>
          !commonSubjectGroupIdsInScope.has(assignment.subjectGroupId)
      );

      const uniqueLockedAssignments = [
        ...new Map(
          effectiveLockedAssignments.map((assignment) => {
            const key = [
              assignment.subjectGroupId,
              assignment.classroomId ?? 'none',
              assignment.dayOfWeek ?? 'none',
              assignment.slotIndex ?? 'none',
              assignment.duration,
            ].join(':');

            return [key, assignment];
          })
        ).values(),
      ];

      const alreadyLockedGroupIds = new Set(
        uniqueLockedAssignments.map((l) => l.subjectGroupId)
      );

      const groupsToGenerate = groupsData
        .filter((g) => !alreadyLockedGroupIds.has(g.subjectGroupId))
        .map((group) => ({
          ...group,
          timeConfigId: resolveTimeConfigId(
            group.degreeId,
            group.courseYear,
            group.shift,
            group.itineraryId ?? null
          ),
        }));

      const uniqueLockedAssignmentsWithTimeConfig = uniqueLockedAssignments.map(
        (assignment) => ({
          ...assignment,
          timeConfigId:
            assignment.timeConfigId ??
            resolveTimeConfigId(
              assignment.degreeId,
              assignment.courseYear,
              assignment.shift,
              assignment.itineraryId ?? null
            ),
        })
      );

      const solution = await this.engineProvider.runGeneration(
        groupsToGenerate,
        classroomsCache,
        availableClassrooms,
        timeGrids,
        slotDuration,
        uniqueLockedAssignmentsWithTimeConfig,
        scope.optimizations
      );

      const inheritedAssignments = uniqueLockedAssignmentsWithTimeConfig.filter(
        (l) => groupsData.some((g) => g.subjectGroupId === l.subjectGroupId)
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

      for (const scopeKey of scopeKeysToGenerate) {
        const parts = scopeKey.split('_');
        const degreeId = parts[0] || '';
        const courseYear = parseInt(parts[1] || '0', 10);
        const shift = (parts[2] || 'morning') as Shift;
        const itineraryId =
          parts[3] === 'common' ? null : parts.slice(3).join('_');

        scopeAssignments.set(scopeKey, {
          degreeId,
          itineraryId,
          courseYear,
          shift,
          assignments: [],
        });
      }

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

      const schedulesToPersist: PersistedScheduleItem[] = [];
      const generatedSchedules: Schedule[] = [];
      const commonSlotIdsByAssignmentId = new Map<string, string>();

      const filterAssignmentConflicts = (
        asm: (typeof solution.assignments)[number],
        scopeSubjectGroupIds: Set<string>
      ) =>
        asm.conflicts?.filter((c) => {
          if (c.type.startsWith('COURSE_OVERLAP') && c.relatedSubjectGroupIds) {
            return c.relatedSubjectGroupIds.some((id) =>
              scopeSubjectGroupIds.has(id)
            );
          }
          return true;
        }) || [];

      const buildAssignmentConflicts = (
        asm: (typeof solution.assignments)[number],
        scopeSubjectGroupIds: Set<string>,
        persistedSlotId: string
      ) => {
        const conflicts = filterAssignmentConflicts(asm, scopeSubjectGroupIds);

        if (isUnassignedPlacement(asm)) {
          const diag = getUnassignedDiagnostics(
            {
              needsComputerLab: asm.needsComputerLab,
              groupType: asm.groupType,
              numberOfStudents: asm.numberOfStudents,
            },
            classroomsCache,
            availableClassrooms
          );
          conflicts.push({
            type: diag.type,
            message: diag.message,
            subjectGroupId: asm.subjectGroupId,
            assignmentId: persistedSlotId,
          });
        }

        return conflicts;
      };

      const orderedScopeEntries = [...scopeAssignments.entries()].sort(
        ([keyA], [keyB]) => {
          const aIsCommon = keyA.endsWith('_common');
          const bIsCommon = keyB.endsWith('_common');
          if (aIsCommon !== bIsCommon) return aIsCommon ? -1 : 1;
          return keyA.localeCompare(keyB);
        }
      );

      for (const [, sData] of orderedScopeEntries) {
        const baseKey = `${sData.degreeId}_${sData.courseYear}_${sData.shift}`;
        const isCanonicalCommon =
          sData.itineraryId === null &&
          (itinerariesPerDegreeYearShift.get(baseKey)?.size ?? 0) > 0;
        const commonAssignments =
          sData.itineraryId !== null
            ? (scopeAssignments.get(`${baseKey}_common`)?.assignments ?? [])
            : [];
        const compositeAssignments = [
          ...sData.assignments,
          ...commonAssignments,
        ];
        const scopeSubjectGroupIds = new Set(
          compositeAssignments.map((a) => a.subjectGroupId)
        );

        const existingSchedule = await this.scheduleRepository.findByScope(
          organizationId,
          sData.degreeId,
          sData.itineraryId,
          scope.academicYearId,
          sData.courseYear,
          period,
          sData.shift
        );

        const scopeAssignmentsWithFilteredConflicts = sData.assignments.map(
          (asm) => {
            const filteredConflicts = filterAssignmentConflicts(
              asm,
              scopeSubjectGroupIds
            );
            return { ...asm, conflicts: filteredConflicts };
          }
        );

        const schedule =
          existingSchedule ||
          Schedule.create({
            organizationId,
            degreeId: sData.degreeId,
            itineraryId: sData.itineraryId,
            academicYearId: scope.academicYearId,
            timeConfigId: resolveTimeConfigId(
              sData.degreeId,
              sData.courseYear,
              sData.shift,
              sData.itineraryId
            ),
            courseYear: sData.courseYear,
            period: period,
            shift: sData.shift,
            isCanonicalCommon,
            status: 'draft',
            conflicts: 0,
          });

        schedule.setCanonicalCommon(isCanonicalCommon);
        schedule.setTimeConfigId(
          resolveTimeConfigId(
            sData.degreeId,
            sData.courseYear,
            sData.shift,
            sData.itineraryId
          )
        );
        if (existingSchedule) {
          schedule.markAsDraft();
          schedule.updateConflictsAndUnassigned(0, 0);
        }

        const slots = scopeAssignmentsWithFilteredConflicts.map((asm) => {
          const id = crypto.randomUUID();
          if (asm.isCommon) {
            commonSlotIdsByAssignmentId.set(asm.id, id);
          }

          const conflicts = buildAssignmentConflicts(
            asm,
            scopeSubjectGroupIds,
            id
          );

          return {
            id,
            scheduleId: schedule.id,
            subjectGroupId: asm.subjectGroupId,
            classroomId: asm.classroomId,
            dayOfWeek: asm.dayOfWeek,
            slotIndex: asm.slotIndex,
            duration: asm.duration,
            conflicts,
          };
        });

        schedulesToPersist.push({
          schedule,
          slots,
          inclusions: [],
          baseKey,
          itineraryId: sData.itineraryId,
        });
        if (!isCanonicalCommon) {
          generatedSchedules.push(schedule);
        }
      }

      for (const item of schedulesToPersist) {
        if (item.itineraryId === null) continue;

        const commonAssignments =
          scopeAssignments.get(`${item.baseKey}_common`)?.assignments ?? [];
        if (commonAssignments.length === 0) continue;

        const ownAssignments =
          scopeAssignments.get(`${item.baseKey}_${item.itineraryId}`)
            ?.assignments ?? [];
        const scopeSubjectGroupIds = new Set(
          [...ownAssignments, ...commonAssignments].map(
            (assignment) => assignment.subjectGroupId
          )
        );

        for (const commonAssignment of commonAssignments) {
          const slotId = commonSlotIdsByAssignmentId.get(commonAssignment.id);
          if (!slotId) continue;

          item.inclusions.push({
            scheduleId: item.schedule.id,
            slotId,
            conflicts: buildAssignmentConflicts(
              commonAssignment,
              scopeSubjectGroupIds,
              slotId
            ),
          });
        }
      }

      const slotsById = new Map(
        schedulesToPersist
          .flatMap((item) => item.slots)
          .map((slot) => [slot.id, slot])
      );

      for (const item of schedulesToPersist) {
        const conflictsCount =
          item.slots.reduce(
            (acc, slot) => acc + countSchedulingConflicts(slot.conflicts),
            0
          ) +
          item.inclusions.reduce(
            (acc, inclusion) =>
              acc + countSchedulingConflicts(inclusion.conflicts),
            0
          );
        const unassignedCount =
          item.slots.filter(isUnassignedPlacement).length +
          item.inclusions.filter((inclusion) => {
            const includedSlot = slotsById.get(inclusion.slotId);
            return includedSlot ? isUnassignedPlacement(includedSlot) : false;
          }).length;

        item.schedule.updateConflictsAndUnassigned(
          conflictsCount,
          unassignedCount
        );
      }

      const persistedScheduleIds = new Set(
        schedulesToPersist.map((item) => item.schedule.id)
      );
      const additionalInclusions: ScheduleSlotInclusion[] = [];
      const existingSchedules =
        (await this.scheduleRepository.findAll(organizationId)) ?? [];

      for (const existingSchedule of existingSchedules) {
        if (
          existingSchedule.itineraryId === null ||
          existingSchedule.academicYearId !== scope.academicYearId ||
          existingSchedule.period !== period ||
          persistedScheduleIds.has(existingSchedule.id)
        ) {
          continue;
        }

        const baseKey = `${existingSchedule.degreeId}_${existingSchedule.courseYear}_${existingSchedule.shift}`;
        const commonAssignments =
          scopeAssignments.get(`${baseKey}_common`)?.assignments ?? [];
        if (commonAssignments.length === 0) continue;

        const scopeSubjectGroupIds = new Set([
          ...commonAssignments.map((assignment) => assignment.subjectGroupId),
          ...uniqueLockedAssignmentsWithTimeConfig
            .filter(
              (assignment) =>
                assignment.degreeId === existingSchedule.degreeId &&
                assignment.courseYear === existingSchedule.courseYear &&
                assignment.shift === existingSchedule.shift &&
                assignment.itineraryId === existingSchedule.itineraryId
            )
            .map((assignment) => assignment.subjectGroupId),
        ]);

        for (const commonAssignment of commonAssignments) {
          const slotId = commonSlotIdsByAssignmentId.get(commonAssignment.id);
          if (!slotId) continue;

          additionalInclusions.push({
            scheduleId: existingSchedule.id,
            slotId,
            conflicts: buildAssignmentConflicts(
              commonAssignment,
              scopeSubjectGroupIds,
              slotId
            ),
          });
        }
      }

      const reservationSlots = schedulesToPersist
        .flatMap((schedule) => schedule.slots)
        .filter(
          (slot) =>
            slot.classroomId !== null &&
            slot.dayOfWeek !== null &&
            slot.slotIndex !== null
        )
        .flatMap((slot) => {
          const schedule = schedulesToPersist.find(
            (item) => item.schedule.id === slot.scheduleId
          )?.schedule;
          const timeConfigId = schedule?.timeConfigId;
          const grid = timeConfigId ? timeGrids[timeConfigId] : undefined;
          const interval =
            grid && slot.slotIndex !== null
              ? projectAssignmentInterval(grid, slot.slotIndex, slot.duration)
              : null;
          if (!timeConfigId || !interval) return [];
          return [
            {
              classroomId: slot.classroomId as string,
              dayOfWeek: slot.dayOfWeek as number,
              slotIndex: slot.slotIndex as number,
              duration: slot.duration,
              period,
              timeConfigId,
              startTimeMinutes: interval.startMinutes,
              endTimeMinutes: interval.endMinutes,
            },
          ];
        });

      return {
        schedulesToPersist,
        additionalInclusions,
        generatedSchedules,
        reservationSlots,
      };
    };

    const results = await Promise.all(
      scope.periods.map((period) => generateForPeriod(period))
    );

    const schedulesToPersist = results.flatMap(
      (result) => result.schedulesToPersist
    );
    const additionalInclusions = results.flatMap(
      (result) => result.additionalInclusions
    );

    if (schedulesToPersist.length > 0) {
      await this.scheduleRepository.createSchedulesWithSlots(
        schedulesToPersist,
        additionalInclusions
      );
    }

    const reservationSlots = results.flatMap(
      (result) => result.reservationSlots
    );
    if (reservationSlots.length > 0) {
      try {
        await this.dataProvider.rejectConflictingReservationsBatch(
          organizationId,
          scope.academicYearId,
          reservationSlots
        );
      } catch (error) {
        console.error(
          'Schedules were generated, but conflicting reservations could not be rejected.',
          error
        );
      }
    }

    return results
      .flatMap((result) => result.generatedSchedules)
      .map((schedule) => ScheduleMapper.toDTO(schedule));
  }
}
