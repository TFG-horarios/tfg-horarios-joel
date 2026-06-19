import type {
  IScheduleSlotDataProvider,
  IScheduleSlotContext,
} from '../../domain/schedule-slot-data.provider';
import type { IScheduleRepository } from '@/modules/schedule/domain/schedule.repository';
import type { IScheduleDataProvider } from '@/modules/schedule/domain/schedule-data.provider';
import type { IClassroomReservationRepository } from '@/modules/classroom-reservation/domain/classroom-reservation.repository';

export class ScheduleSlotDataAdapter implements IScheduleSlotDataProvider {
  constructor(
    private readonly scheduleRepository: IScheduleRepository,
    private readonly scheduleDataProvider: IScheduleDataProvider,
    private readonly reservationRepository: IClassroomReservationRepository
  ) {}

  async getScheduleContext(
    scheduleId: string,
    organizationId: string
  ): Promise<IScheduleSlotContext | null> {
    const schedule = await this.scheduleRepository.findById(
      scheduleId,
      organizationId
    );
    if (!schedule) return null;

    return {
      academicYearId: schedule.academicYearId,
      shift: schedule.shift,
    };
  }

  async isGroupCommon(
    subjectGroupId: string,
    scheduleId: string,
    organizationId: string
  ): Promise<boolean> {
    const schedule = await this.scheduleRepository.findById(
      scheduleId,
      organizationId
    );
    if (!schedule) return false;

    const groupsData = await this.scheduleDataProvider.getGroupsInScope(
      organizationId,
      schedule.period,
      [schedule.degreeId],
      undefined,
      [schedule.courseYear]
    );

    const group = groupsData.find((g) => g.subjectGroupId === subjectGroupId);
    return group ? group.isCommon : false;
  }

  async unpublishSchedule(
    scheduleId: string,
    organizationId: string
  ): Promise<void> {
    const schedule = await this.scheduleRepository.findById(
      scheduleId,
      organizationId
    );
    if (!schedule) return;

    if (schedule.status === 'published') {
      schedule.markAsDraft();
      await this.scheduleRepository.update(schedule);
    }
  }

  async rejectConflictingReservations(
    organizationId: string,
    classroomId: string,
    dayOfWeek: number,
    slotIndex: number,
    duration: number
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0]!;
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 2);
    const endStr = endDate.toISOString().split('T')[0]!;

    const allFutureReservations =
      await this.reservationRepository.findReservationsInDateRange(
        organizationId,
        classroomId,
        today,
        endStr
      );

    for (const res of allFutureReservations) {
      if (res.status === 'REJECTED') continue;

      const resDate = new Date(res.date);
      const resDow = resDate.getUTCDay();

      if (resDow === dayOfWeek) {
        const startSlot = slotIndex;
        const endSlot = slotIndex + Math.ceil(duration) - 1;

        if (res.slotIndex >= startSlot && res.slotIndex <= endSlot) {
          res.reject(
            'Cancelada automáticamente por solapamiento con clase regular'
          );
          await this.reservationRepository.update(res);
        }
      }
    }
  }
}
