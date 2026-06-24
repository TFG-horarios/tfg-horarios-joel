import type {
  ScheduleDTO,
  GenerationScopeDTO,
  Shift,
} from '@tfg-horarios/shared';
import type { IScheduleRepository } from '../domain/schedule.repository';
import type { IScheduleDataProvider } from '../domain/providers/schedule-data.provider';
import type { IScheduleMemberProvider } from '../domain/providers/schedule-member.provider';
import { ForbiddenError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import { ScheduleMapper } from './schedule.mapper';
import type { AppRole } from '@/core/permissions/roles';

export class CheckScheduleOverwriteUseCase {
  constructor(
    private readonly scheduleRepository: IScheduleRepository,
    private readonly dataProvider: IScheduleDataProvider,
    private readonly memberProvider: IScheduleMemberProvider
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
        'You do not have permission to check schedule overwrites in this organization.'
      );
    }

    const targetDegreeIds =
      scope.degreeIds && scope.degreeIds.length > 0
        ? scope.degreeIds
        : await this.dataProvider.getTargetDegreeIds(organizationId);

    if (targetDegreeIds.length === 0) return [];

    const overwrittenSchedules: ScheduleDTO[] = [];

    for (const period of scope.periods) {
      const groupsData = await this.dataProvider.getGroupsInScope(
        organizationId,
        period,
        targetDegreeIds,
        scope.itineraryIds,
        scope.courseYears
      );

      if (groupsData.length === 0) continue;

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

      type ScopeKey = string;
      const scopeAssignments = new Map<
        ScopeKey,
        {
          degreeId: string;
          itineraryId: string | null;
          courseYear: number;
          shift: Shift;
        }
      >();

      for (const group of groupsData) {
        const baseKey = `${group.degreeId}_${group.courseYear}_${group.shift}`;
        const itineraries = itinerariesPerDegreeYearShift.get(baseKey);

        if (!itineraries || itineraries.size === 0) {
          const key = `${baseKey}_common`;
          if (!scopeAssignments.has(key)) {
            scopeAssignments.set(key, {
              degreeId: group.degreeId,
              itineraryId: null,
              courseYear: group.courseYear,
              shift: group.shift,
            });
          }
        } else {
          if (group.isCommon) {
            for (const itinId of itineraries) {
              const key = `${baseKey}_${itinId}`;
              if (!scopeAssignments.has(key)) {
                scopeAssignments.set(key, {
                  degreeId: group.degreeId,
                  itineraryId: itinId,
                  courseYear: group.courseYear,
                  shift: group.shift,
                });
              }
            }
          } else if (group.itineraryId) {
            const key = `${baseKey}_${group.itineraryId}`;
            if (!scopeAssignments.has(key)) {
              scopeAssignments.set(key, {
                degreeId: group.degreeId,
                itineraryId: group.itineraryId,
                courseYear: group.courseYear,
                shift: group.shift,
              });
            }
          }
        }
      }

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

        if (existingSchedule) {
          const dto = ScheduleMapper.toDTO(existingSchedule);
          if (!overwrittenSchedules.some((s) => s.id === dto.id)) {
            overwrittenSchedules.push(dto);
          }
        }
      }
    }

    return overwrittenSchedules;
  }
}
