import type { IClassroomReservationScheduleProvider } from '../../domain/classroom-reservation-schedule.provider';
import type { IScheduleRepository } from '@/modules/schedule/domain/schedule.repository';
import type { IScheduleSlotRepository } from '@/modules/schedule-slot/domain/schedule-slot.repository';

export class ClassroomReservationScheduleAdapter implements IClassroomReservationScheduleProvider {
  constructor(
    private readonly scheduleRepository: IScheduleRepository,
    private readonly scheduleSlotRepository: IScheduleSlotRepository
  ) {}

  async hasSubjectInSlot(
    organizationId: string,
    academicYearId: string,
    periods: number[],
    classroomId: string,
    dayOfWeek: number,
    slotIndex: number
  ): Promise<boolean> {
    const schedules = await this.scheduleRepository.findAll(organizationId);
    const yearSchedules = schedules.filter(
      (s) => s.academicYearId === academicYearId && periods.includes(s.period)
    );
    const scheduleIds = yearSchedules.map((s) => s.id);
    if (scheduleIds.length === 0) return false;
    for (const scheduleId of scheduleIds) {
      const slots =
        await this.scheduleSlotRepository.findByScheduleId(scheduleId);
      const conflict = slots.some(
        (s) =>
          s.classroomId === classroomId &&
          s.dayOfWeek === dayOfWeek &&
          s.slotIndex === slotIndex
      );
      if (conflict) return true;
    }

    return false;
  }

  async areAllSchedulesPublished(
    organizationId: string,
    academicYearId: string
  ): Promise<boolean> {
    const schedules = await this.scheduleRepository.findAll(organizationId);
    const yearSchedules = schedules.filter(
      (s) => s.academicYearId === academicYearId
    );

    if (yearSchedules.length === 0) return false;

    return yearSchedules.every((s) => s.status === 'published');
  }
}
