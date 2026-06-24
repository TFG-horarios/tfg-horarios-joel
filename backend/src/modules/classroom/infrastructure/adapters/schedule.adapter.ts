import type { IClassroomReservationRepository } from '@/modules/classroom-reservation/domain/classroom-reservation.repository';
import type { IScheduleRepository } from '@/modules/schedule/domain/schedule.repository';
import type { IScheduleProvider } from '../../domain/providers/schedule.provider';

export class ScheduleAdapter implements IScheduleProvider {
  constructor(
    private readonly scheduleRepository: IScheduleRepository,
    private readonly reservationRepository: IClassroomReservationRepository
  ) {}

  async handleClassroomsDeletion(
    classroomIds: string[],
    organizationId: string,
    activeAndFutureYearIds: string[],
    tx: any
  ): Promise<string[]> {
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
    return scheduleIds;
  }
}
