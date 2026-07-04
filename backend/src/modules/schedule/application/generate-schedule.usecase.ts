import type { GenerationScopeDTO, ScheduleDTO } from '@tfg-horarios/shared';
import { ForbiddenError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import type { AppRole } from '@/core/permissions/roles';
import type { IScheduleDataProvider } from '../domain/providers/schedule-data.provider';
import type {
  IScheduleEngineProvider,
  ScheduleEngineClassroomMap,
} from '../domain/providers/schedule-engine.provider';
import type { IScheduleIssueProvider } from '../domain/providers/schedule-issue.provider';
import type { IMemberProvider } from '../domain/providers/member.provider';
import type { IScheduleRepository } from '../domain/schedule.repository';
import { generateSchedulePeriod } from './generation/period-schedule-generator';
import { ScheduleMapper } from './schedule.mapper';

export class GenerateScheduleUseCase {
  constructor(
    private readonly scheduleRepository: IScheduleRepository,
    private readonly dataProvider: IScheduleDataProvider,
    private readonly memberProvider: IMemberProvider,
    private readonly engineProvider: IScheduleEngineProvider,
    private readonly issueProvider: IScheduleIssueProvider
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

    const { availableClassrooms, classroomsCache } =
      await this.buildClassroomContext(organizationId);
    const results = await Promise.all(
      scope.periods.map((period) =>
        generateSchedulePeriod({
          organizationId,
          targetDegreeIds,
          availableClassrooms,
          classroomsCache,
          scope,
          period,
          scheduleRepository: this.scheduleRepository,
          dataProvider: this.dataProvider,
          engineProvider: this.engineProvider,
          issueProvider: this.issueProvider,
        })
      )
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

    await this.rejectConflictingReservations(organizationId, scope, results);

    return results
      .flatMap((result) => result.generatedSchedules)
      .map((schedule) => ScheduleMapper.toDTO(schedule));
  }

  private async buildClassroomContext(organizationId: string) {
    const classrooms =
      await this.dataProvider.getAvailableClassrooms(organizationId);
    const classroomsCache: ScheduleEngineClassroomMap = {};
    const availableClassrooms: string[] = [];

    for (const classroom of classrooms) {
      availableClassrooms.push(classroom.id);
      classroomsCache[classroom.id] = {
        capacity: classroom.capacity,
        type: classroom.type,
        floor: classroom.floor,
      };
    }

    return { availableClassrooms, classroomsCache };
  }

  private async rejectConflictingReservations(
    organizationId: string,
    scope: GenerationScopeDTO,
    results: Awaited<ReturnType<typeof generateSchedulePeriod>>[]
  ) {
    const reservationSlots = results.flatMap(
      (result) => result.reservationSlots
    );
    if (reservationSlots.length === 0) return;

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
}
