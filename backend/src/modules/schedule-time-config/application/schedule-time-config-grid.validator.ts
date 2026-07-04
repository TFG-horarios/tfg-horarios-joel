import { buildScheduleTimeGrid, type Shift } from '@tfg-horarios/shared';
import { NotFoundError, ValidationError } from '@/core/errors/app.error';
import type { IAcademicYearProvider } from '../domain/providers/academic-year.provider';
import type { IScheduleTimeConfigRepository } from '../domain/schedule-time-config.repository';
import type { NormalizedScheduleTimeConfigInput } from './schedule-time-config-input';

type ValidationInput = NormalizedScheduleTimeConfigInput & {
  degreeId: string;
  itineraryId: string | null;
  courseYear: number;
  period: number;
  shift: Shift;
};

export class ScheduleTimeConfigGridValidator {
  constructor(
    private readonly repository: IScheduleTimeConfigRepository,
    private readonly academicYearProvider: IAcademicYearProvider
  ) {}

  async validate(
    organizationId: string,
    academicYearId: string,
    data: ValidationInput
  ): Promise<void> {
    const academicYear =
      await this.academicYearProvider.getTiming(academicYearId);
    if (!academicYear || academicYear.organizationId !== organizationId) {
      throw new NotFoundError('AcademicYear', academicYearId);
    }

    if (data.startTime < academicYear.centerOpeningTime) {
      throw new ValidationError(
        'The configuration start time cannot be earlier than the center opening time.'
      );
    }

    if (data.endTime > academicYear.centerClosingTime) {
      throw new ValidationError(
        'The configuration end time cannot exceed the center closing time.'
      );
    }

    const oppositeShift = data.shift === 'morning' ? 'afternoon' : 'morning';
    const sameScopeOppositeShift = await this.repository.findAll(
      organizationId,
      academicYearId,
      {
        degreeId: data.degreeId,
        courseYear: data.courseYear,
        period: data.period,
        shift: oppositeShift,
      }
    );
    const oppositeConfig = sameScopeOppositeShift.find(
      (config) => config.itineraryId === data.itineraryId
    );

    if (oppositeConfig) {
      if (data.shift === 'morning' && data.endTime > oppositeConfig.startTime) {
        throw new ValidationError(
          'Morning shift end time must be earlier than or equal to afternoon shift start time.'
        );
      }
      if (
        data.shift === 'afternoon' &&
        data.startTime < oppositeConfig.endTime
      ) {
        throw new ValidationError(
          'Afternoon shift start time must be later than or equal to morning shift end time.'
        );
      }
    }

    if (data.hasBreak && academicYear.breakDurationMinutes === 0) {
      throw new ValidationError(
        'The academic year long break duration must be greater than zero.'
      );
    }

    const grid = buildScheduleTimeGrid(
      {
        slotDurationMinutes: academicYear.slotDurationMinutes,
        breakDurationMinutes: academicYear.breakDurationMinutes,
      },
      data
    );
    if (grid.slots.length === 0) {
      throw new ValidationError(
        'The configuration must contain at least one slot.'
      );
    }
    if (data.hasBreak && grid.breaks.length !== 1) {
      throw new ValidationError(
        'The long break must leave room for a complete slot afterwards.'
      );
    }
  }
}
