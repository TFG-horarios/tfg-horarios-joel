import type { IClassroomReservationScheduleProvider } from '../../domain/providers/classroom-reservation-schedule.provider';
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
      const conflict = slots.some((s) => {
        if (
          s.classroomId !== classroomId ||
          s.dayOfWeek !== dayOfWeek ||
          s.slotIndex === null
        ) {
          return false;
        }
        const startSlot = s.slotIndex;
        const endSlot = s.slotIndex + Math.ceil(s.duration) - 1;
        return slotIndex >= startSlot && slotIndex <= endSlot;
      });
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

  async getClassroomScheduleSlots(
    organizationId: string,
    academicYearId: string,
    classroomId: string
  ): Promise<
    { dayOfWeek: number; slotIndex: number; duration: number; period: number }[]
  > {
    const schedules = await this.scheduleRepository.findAll(organizationId);
    const yearSchedules = schedules.filter(
      (s) => s.academicYearId === academicYearId
    );

    const scheduleSlots = [];
    for (const schedule of yearSchedules) {
      const slots = await this.scheduleSlotRepository.findByScheduleId(
        schedule.id
      );
      const classroomSlots = slots.filter(
        (s) =>
          s.classroomId === classroomId &&
          s.slotIndex !== null &&
          s.dayOfWeek !== null
      );
      for (const slot of classroomSlots) {
        scheduleSlots.push({
          dayOfWeek: slot.dayOfWeek as number,
          slotIndex: slot.slotIndex as number,
          duration: slot.duration,
          period: schedule.period,
        });
      }
    }
    return scheduleSlots;
  }
}
