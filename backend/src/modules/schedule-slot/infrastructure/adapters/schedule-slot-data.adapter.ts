import type {
  IScheduleSlotDataProvider,
  IScheduleSlotContext,
} from '../../domain/providers/schedule-slot-data.provider';
import type { IScheduleRepository } from '@/modules/schedule/domain/schedule.repository';
import type { IScheduleDataProvider } from '@/modules/schedule/domain/providers/schedule-data.provider';
import type { IClassroomReservationRepository } from '@/modules/classroom-reservation/domain/classroom-reservation.repository';
import type { CreateNotificationUseCase } from '@/modules/notification/application/create-notification.usecase';
import { SseService } from '@/core/services/sse.service';
import {
  buildScheduleTimeGrid,
  intervalsOverlap,
  projectAssignmentInterval,
} from '@tfg-horarios/shared';

const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const hasReservationStarted = (
  reservationDate: string,
  startTimeMinutes: number | null,
  now: Date
): boolean => {
  const today = getLocalDateString(now);
  if (reservationDate < today) return true;
  if (reservationDate > today) return false;
  if (startTimeMinutes === null) return false;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return startTimeMinutes <= nowMinutes;
};

export class ScheduleSlotDataAdapter implements IScheduleSlotDataProvider {
  constructor(
    private readonly scheduleRepository: IScheduleRepository,
    private readonly scheduleDataProvider: IScheduleDataProvider,
    private readonly reservationRepository: IClassroomReservationRepository,
    private readonly createNotificationUseCase: CreateNotificationUseCase
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
      period: schedule.period,
      shift: schedule.shift,
      timeConfigId: schedule.timeConfigId ?? null,
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
    academicYearId: string,
    period: number,
    classroomId: string,
    dayOfWeek: number,
    slotIndex: number,
    duration: number,
    timeConfigId?: string | null
  ): Promise<void> {
    const now = new Date();
    const today = getLocalDateString(now);
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

    let classStartTimeMinutes: number | null = null;
    let classEndTimeMinutes: number | null = null;
    if (timeConfigId) {
      const orgConstraints =
        await this.scheduleDataProvider.getAcademicYearConstraints(
          academicYearId
        );
      const timeConfig = (
        (await this.scheduleDataProvider.getScheduleTimeConfigs?.(
          organizationId,
          academicYearId
        )) ?? []
      ).find((config) => config.id === timeConfigId);
      if (orgConstraints && timeConfig) {
        const grid = buildScheduleTimeGrid(
          {
            slotDurationMinutes: orgConstraints.slotDurationMinutes,
            breakDurationMinutes: orgConstraints.breakDurationMinutes,
          },
          {
            startTime: timeConfig.startTime,
            endTime: timeConfig.endTime,
            hasBreak: timeConfig.hasBreak,
            breakAfterSlot: timeConfig.breakAfterSlot,
          }
        );
        const interval = projectAssignmentInterval(grid, slotIndex, duration);
        classStartTimeMinutes = interval?.startMinutes ?? null;
        classEndTimeMinutes = interval?.endMinutes ?? null;
      }
    }

    for (const res of allFutureReservations) {
      if (
        (res.status !== 'PENDING' && res.status !== 'ACCEPTED') ||
        res.academicYearId !== academicYearId
      ) {
        continue;
      }

      if (hasReservationStarted(res.date, res.startTimeMinutes, now)) {
        continue;
      }

      const resDate = new Date(res.date);
      const resDow = resDate.getUTCDay();
      const matchingPeriods =
        await this.scheduleDataProvider.getMatchingPeriods(
          academicYearId,
          resDate
        );

      if (matchingPeriods.includes(period) && resDow === dayOfWeek) {
        const overlapsBySnapshot =
          classStartTimeMinutes !== null &&
          classEndTimeMinutes !== null &&
          res.startTimeMinutes !== null &&
          res.endTimeMinutes !== null &&
          intervalsOverlap(
            {
              startMinutes: classStartTimeMinutes,
              endMinutes: classEndTimeMinutes,
            },
            {
              startMinutes: res.startTimeMinutes,
              endMinutes: res.endTimeMinutes,
            }
          );

        if (overlapsBySnapshot) {
          res.reject(
            'Cancelada automáticamente por solapamiento con clase regular'
          );
          await this.reservationRepository.update(res);
          SseService.getInstance().broadcast(
            `classroom_${classroomId}`,
            'reservation_updated',
            {
              classroomId,
              reservationId: res.id,
              status: res.status,
            }
          );

          await this.createNotificationUseCase.execute({
            userId: res.requesterUserId,
            organizationId: organizationId,
            title: 'Reserva cancelada automáticamente',
            message:
              'Tu reserva ha sido cancelada debido a un solapamiento con un horario regular tras una modificación.',
            type: 'ERROR',
          });
        }
      }
    }
  }

  async updateScheduleConflictsAndUnassignedCount(
    scheduleId: string,
    organizationId: string
  ): Promise<void> {
    if (this.scheduleRepository.updateConflictsAndUnassignedCount) {
      await this.scheduleRepository.updateConflictsAndUnassignedCount(
        scheduleId,
        organizationId
      );
    }
  }
}
