import type { IClassroomReservationRepository } from '@/modules/classroom-reservation/domain/classroom-reservation.repository';
import type { ReevaluateSchedulesUseCase } from '@/modules/schedule/application/reevaluate-schedules.usecase';
import type { IScheduleRepository } from '@/modules/schedule/domain/schedule.repository';
import type { IScheduleProvider } from '../../domain/providers/schedule.provider';

export class ScheduleAdapter implements IScheduleProvider {
  constructor(
    private readonly scheduleRepository: IScheduleRepository,
    private readonly reservationRepository: IClassroomReservationRepository,
    private readonly reevaluateSchedules: ReevaluateSchedulesUseCase
  ) {}

  async handleClassroomsDeletion(
    classroomIds: string[],
    organizationId: string,
    activeAndFutureYearIds: string[],
    tx: any
  ): Promise<void> {
    const scheduleIds = await this.scheduleRepository
      .unassignClassroomsFromSlots!(
        classroomIds,
        organizationId,
        activeAndFutureYearIds,
        tx
      );
    await this.reservationRepository.rejectFutureReservationsForClassrooms!(
      classroomIds,
      organizationId,
      activeAndFutureYearIds,
      tx
    );
    await this.reevaluateSchedules.execute(scheduleIds, organizationId, tx);
  }
}
