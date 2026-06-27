import {
  buildScheduleTimeGrid,
  type SaveScheduleTimeConfigBodyDTO,
  type ScheduleTimeConfigDTO,
  type ScheduleTimeConfigListQueryDTO,
  type Shift,
  type UpdateScheduleTimeConfigBodyDTO,
} from '@tfg-horarios/shared';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
// TODO: Desacoplar
import type { IAcademicYearRepository } from '@/modules/academic-year/domain/academic-year.repository';
// TODO: Desacoplar
import type { IMemberProvider } from '@/modules/academic-year/domain/providers/member.provider';
import { ScheduleTimeConfig } from '../domain/schedule-time-config.entity';
import type { IScheduleTimeConfigRepository } from '../domain/schedule-time-config.repository';
import { toScheduleTimeConfigDTO } from './schedule-time-config.mapper';
// TODO: Desacoplar
import type { IAcademicYearTimingChangeProvider } from '@/modules/academic-year/domain/providers/timing-change.provider';
import type { TransactionRunner } from '@/core/db/transaction-runner';
// TODO: Desacoplar
import type { CreateNotificationUseCase } from '@/modules/notification/application/create-notification.usecase';
import { SseService } from '@/core/services/sse.service';

type NormalizedScheduleTimeConfigInput = {
  startTime: string;
  endTime: string;
  hasBreak: boolean;
  breakAfterSlot: number | null;
};

type NormalizedScheduleTimeConfigCreateInput =
  NormalizedScheduleTimeConfigInput & {
    degreeId: string;
    itineraryId: string | null;
    courseYear: number;
    period: number;
    shift: Shift;
  };

export class ManageScheduleTimeConfigUseCases {
  constructor(
    private readonly repository: IScheduleTimeConfigRepository,
    private readonly academicYearRepository: IAcademicYearRepository,
    private readonly memberProvider: IMemberProvider,
    private readonly timingChangeProvider?: IAcademicYearTimingChangeProvider,
    private readonly runInTransaction?: TransactionRunner,
    private readonly createNotificationUseCase?: CreateNotificationUseCase
  ) {}

  private async authorize(
    organizationId: string,
    userId: string,
    write = false
  ) {
    const role = await this.memberProvider.getMemberRole(
      userId,
      organizationId
    );
    if (
      !role ||
      (write && !hasPermission(role, 'UPDATE_ORGANIZATION_COMPONENTS'))
    ) {
      throw new ForbiddenError();
    }
  }

  async list(
    organizationId: string,
    academicYearId: string,
    userId: string,
    filters: ScheduleTimeConfigListQueryDTO
  ): Promise<ScheduleTimeConfigDTO[]> {
    await this.authorize(organizationId, userId);
    return (
      await this.repository.findAll(organizationId, academicYearId, filters)
    ).map(toScheduleTimeConfigDTO);
  }

  async getPossibilities(
    organizationId: string,
    academicYearId: string,
    userId: string
  ): Promise<
    import('@tfg-horarios/shared').ScheduleTimeConfigPossibilityDTO[]
  > {
    await this.authorize(organizationId, userId);
    return this.repository.findPossibilities(organizationId);
  }

  async create(
    organizationId: string,
    academicYearId: string,
    userId: string,
    data: SaveScheduleTimeConfigBodyDTO
  ): Promise<ScheduleTimeConfigDTO> {
    await this.authorize(organizationId, userId, true);
    const normalizedData: NormalizedScheduleTimeConfigCreateInput = {
      ...data,
      itineraryId: data.itineraryId ?? null,
      breakAfterSlot: data.breakAfterSlot ?? null,
    };
    const scope = { organizationId, academicYearId, ...normalizedData };
    if (!(await this.repository.validateScope(scope))) {
      throw new ValidationError(
        'Invalid degree, itinerary, or academic year scope.'
      );
    }
    const sameScope = await this.repository.findAll(
      organizationId,
      academicYearId,
      {
        degreeId: normalizedData.degreeId,
        courseYear: normalizedData.courseYear,
        period: normalizedData.period,
        shift: normalizedData.shift,
      }
    );
    if (
      sameScope.some((item) => item.itineraryId === normalizedData.itineraryId)
    ) {
      throw new ConflictError(
        'A time configuration already exists for this scope.'
      );
    }
    await this.validateGrid(organizationId, academicYearId, normalizedData);
    const config = ScheduleTimeConfig.create({
      organizationId,
      academicYearId,
      ...normalizedData,
    });
    await this.repository.save(config);
    return toScheduleTimeConfigDTO(config);
  }

  async update(
    organizationId: string,
    academicYearId: string,
    id: string,
    userId: string,
    data: UpdateScheduleTimeConfigBodyDTO
  ): Promise<ScheduleTimeConfigDTO> {
    await this.authorize(organizationId, userId, true);
    const config = await this.repository.findById(id);
    if (
      !config ||
      config.organizationId !== organizationId ||
      config.academicYearId !== academicYearId
    ) {
      throw new NotFoundError('ScheduleTimeConfig', id);
    }
    const normalizedData: NormalizedScheduleTimeConfigInput = {
      ...data,
      breakAfterSlot: data.breakAfterSlot ?? null,
    };
    await this.validateGrid(organizationId, academicYearId, {
      ...normalizedData,
      degreeId: config.degreeId,
      courseYear: config.courseYear,
      period: config.period,
      shift: config.shift,
      itineraryId: config.itineraryId,
    });
    const timingChanged =
      config.startTime !== normalizedData.startTime ||
      config.endTime !== normalizedData.endTime ||
      config.hasBreak !== normalizedData.hasBreak ||
      config.breakAfterSlot !== normalizedData.breakAfterSlot;
    config.updateTiming(normalizedData);
    const invalidation =
      timingChanged && this.timingChangeProvider && this.runInTransaction
        ? await this.runInTransaction(async (tx) => {
            await this.repository.update(config, tx);
            return this.timingChangeProvider!.invalidateForTimingChange(
              organizationId,
              academicYearId,
              tx,
              id
            );
          })
        : undefined;
    if (!invalidation) await this.repository.update(config);
    if (invalidation) {
      if (this.createNotificationUseCase) {
        await Promise.allSettled(
          invalidation.affectedUsers.map(({ userId, reservationCount }) =>
            this.createNotificationUseCase!.execute({
              userId,
              organizationId,
              title: 'Reservas canceladas',
              message: `${reservationCount} reserva${reservationCount === 1 ? '' : 's'} cancelada${reservationCount === 1 ? '' : 's'} por un cambio de configuración horaria.`,
              type: 'WARNING',
            })
          )
        );
      }
      const sse = SseService.getInstance();
      for (const scheduleId of invalidation.scheduleIds) {
        sse.broadcast(`schedule_${scheduleId}`, 'schedule_updated', {
          scheduleId,
          invalidated: true,
        });
      }
      for (const classroomId of invalidation.classroomIds) {
        sse.broadcast(`classroom_${classroomId}`, 'reservation_updated', {
          classroomId,
          invalidated: true,
        });
      }
    }
    return toScheduleTimeConfigDTO(config);
  }

  async delete(
    organizationId: string,
    academicYearId: string,
    id: string,
    userId: string
  ): Promise<void> {
    await this.authorize(organizationId, userId, true);
    const config = await this.repository.findById(id);
    if (
      !config ||
      config.organizationId !== organizationId ||
      config.academicYearId !== academicYearId
    ) {
      throw new NotFoundError('ScheduleTimeConfig', id);
    }
    if (await this.repository.isReferenced(id)) {
      throw new ConflictError(
        'Delete the schedules that use this configuration first.'
      );
    }
    await this.repository.delete(id);
  }

  private async validateGrid(
    organizationId: string,
    academicYearId: string,
    data: NormalizedScheduleTimeConfigInput & {
      degreeId: string;
      courseYear: number;
      period: number;
      shift: Shift;
      itineraryId: string | null;
    }
  ) {
    const academicYear =
      await this.academicYearRepository.findById(academicYearId);
    if (!academicYear || academicYear.organizationId !== organizationId) {
      throw new NotFoundError('AcademicYear', academicYearId);
    }

    if (data.shift === 'morning') {
      const startMinutes = data.startTime.split(':')[1];
      const centerOpeningMinutes = academicYear.centerOpeningTime.split(':')[1];
      if (startMinutes !== centerOpeningMinutes) {
        throw new ValidationError(
          `Morning shift start time minutes (${startMinutes}) must match center opening time minutes (${centerOpeningMinutes}).`
        );
      }
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
      (c) => c.itineraryId === data.itineraryId
    );

    if (oppositeConfig) {
      if (
        data.shift === 'morning' &&
        data.endTime >= oppositeConfig.startTime
      ) {
        throw new ValidationError(
          'Morning shift end time must be earlier than afternoon shift start time.'
        );
      }
      if (
        data.shift === 'afternoon' &&
        data.startTime < oppositeConfig.endTime
      ) {
        throw new ValidationError(
          'Afternoon shift start time must be later than morning shift end time.'
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
