import type { IAcademicYearRepository } from '../domain/academic-year.repository';
import { AcademicYearMapper } from './academic-year.mapper';
import type {
  AcademicYearDTO,
  SaveAcademicYearBodyDTO,
} from '@tfg-horarios/shared';
import { NotFoundError, ForbiddenError } from '@/core/errors/app.error';
import type { IMemberProvider } from '../domain/providers/member.provider';
import { hasPermission } from '@/core/permissions/authorization';
import type { IAcademicYearTimingChangeProvider } from '../domain/providers/timing-change.provider';
import type { TransactionRunner } from '@/core/db/transaction-runner';
import type { IAcademicYearNotificationProvider } from '../domain/providers/academic-year-notification.provider';
import { SseService } from '@/core/services/sse.service';

export class UpdateAcademicYearUseCase {
  constructor(
    private readonly academicYearRepository: IAcademicYearRepository,
    private readonly memberProvider: IMemberProvider,
    private readonly notificationProvider: IAcademicYearNotificationProvider,
    private readonly timingChangeProvider?: IAcademicYearTimingChangeProvider,
    private readonly runInTransaction?: TransactionRunner,
  ) {}

  async execute(
    organizationId: string,
    academicYearId: string,
    requesterUserId: string,
    data: SaveAcademicYearBodyDTO
  ): Promise<AcademicYearDTO> {
    const role = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role || !hasPermission(role, 'UPDATE_ORGANIZATION_COMPONENTS')) {
      throw new ForbiddenError(
        'You do not have permission to update an academic year in this organization'
      );
    }

    const academicYear =
      await this.academicYearRepository.findById(academicYearId);
    if (!academicYear || academicYear.organizationId !== organizationId) {
      throw new NotFoundError('Academic Year', academicYearId);
    }

    const timingChanged =
      academicYear.slotDurationMinutes !== data.slotDurationMinutes ||
      academicYear.breakDurationMinutes !== data.breakDurationMinutes ||
      academicYear.centerOpeningTime !== data.centerOpeningTime ||
      academicYear.centerClosingTime !== data.centerClosingTime;

    academicYear.update({
      name: data.name,
      period0Start: data.period0Start ?? null,
      period0End: data.period0End ?? null,
      period1Start: data.period1Start ?? null,
      period1End: data.period1End ?? null,
      period2Start: data.period2Start ?? null,
      period2End: data.period2End ?? null,
      periodType: data.periodType,
      breakDurationMinutes: data.breakDurationMinutes,
      centerOpeningTime: data.centerOpeningTime,
      centerClosingTime: data.centerClosingTime,
      slotDurationMinutes: data.slotDurationMinutes,
    });

    const invalidation =
      timingChanged && this.timingChangeProvider && this.runInTransaction
        ? await this.runInTransaction(async (tx) => {
            await this.academicYearRepository.update(academicYear, tx);
            return this.timingChangeProvider!.invalidateForTimingChange(
              organizationId,
              academicYearId,
              tx
            );
          })
        : undefined;

    if (!invalidation) {
      await this.academicYearRepository.update(academicYear);
    }

    if (invalidation) {
      if (this.notificationProvider) {
        await Promise.allSettled(
          invalidation.affectedUsers.map(({ userId, reservationCount }) =>
            this.notificationProvider!.notifyReservationsCancelled(
              userId,
              organizationId,
              reservationCount
            )
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

    return AcademicYearMapper.toDTO(academicYear);
  }
}
