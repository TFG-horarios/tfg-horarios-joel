import type {
  ClassroomAvailabilityQueryDTO,
  ClassroomAvailabilityResponseDTO,
  OccupiedSlotDTO,
} from '@tfg-horarios/shared';
import type { IClassroomReservationRepository } from '../domain/classroom-reservation.repository';
import type { IScheduleProvider } from '../domain/providers/schedule.provider';
import type { IAcademicYearProvider } from '../domain/providers/academic-year.provider';
import { NotFoundError, ValidationError } from '@/core/errors/app.error';

export class GetClassroomAvailabilityUseCase {
  constructor(
    private readonly repository: IClassroomReservationRepository,
    private readonly scheduleProvider: IScheduleProvider,
    private readonly academicYearProvider: IAcademicYearProvider
  ) {}

  async execute(
    organizationId: string,
    query: ClassroomAvailabilityQueryDTO
  ): Promise<ClassroomAvailabilityResponseDTO> {
    const { classroomId, academicYearId, startDate, endDate } = query;

    const academicYear = await this.academicYearProvider.getAcademicYear(
      organizationId,
      academicYearId
    );

    if (!academicYear) {
      throw new NotFoundError('AcademicYear', academicYearId);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      throw new ValidationError(
        'Start date must be before or equal to end date'
      );
    }

    const regularSlots = await this.scheduleProvider.getClassroomScheduleSlots(
      organizationId,
      academicYearId,
      classroomId
    );

    const reservations = await this.repository.findReservationsInDateRange(
      organizationId,
      classroomId,
      startDate,
      endDate
    );

    const occupiedSlots: OccupiedSlotDTO[] = [];

    for (
      let current = new Date(start);
      current <= end;
      current.setUTCDate(current.getUTCDate() + 1)
    ) {
      const dateStr = current.toISOString().split('T')[0]!;
      const jsDay = current.getUTCDay();
      const systemDayOfWeek = jsDay === 0 ? 7 : jsDay;

      const activePeriods = academicYear.getMatchingPeriods(current) || [];

      if (activePeriods.length > 0) {
        const slotsForDay = regularSlots.filter(
          (s) =>
            s.dayOfWeek === systemDayOfWeek && activePeriods.includes(s.period)
        );

        for (const slot of slotsForDay) {
          occupiedSlots.push({
            date: dateStr,
            slotIndex: slot.slotIndex,
            startTimeMinutes: slot.startTimeMinutes,
            endTimeMinutes: slot.endTimeMinutes,
            reason: 'Ocupado por clase',
          });
        }
      }

      const dateReservations = reservations.filter(
        (r) =>
          r.date === dateStr &&
          r.status !== 'REJECTED' &&
          r.status !== 'CANCELLED'
      );

      for (const res of dateReservations) {
        if (res.startTimeMinutes === null || res.endTimeMinutes === null) {
          continue;
        }

        occupiedSlots.push({
          date: dateStr,
          slotIndex: res.slotIndex,
          startTimeMinutes: res.startTimeMinutes,
          endTimeMinutes: res.endTimeMinutes,
          reason: res.status === 'ACCEPTED' ? 'Reservado' : 'Reserva pendiente',
        });
      }
    }

    return {
      occupiedSlots,
    };
  }
}
