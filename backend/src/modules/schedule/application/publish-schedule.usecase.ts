import type { ScheduleDTO } from '@tfg-horarios/shared';
import type { IScheduleRepository } from '../domain/schedule.repository';
import type { IMemberProvider } from '../domain/providers/member.provider';
import type { IScheduleSlotProvider } from '../domain/providers/schedule-slot.provider';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import { ScheduleMapper } from './schedule.mapper';

export class PublishScheduleUseCase {
  constructor(
    private readonly scheduleRepository: IScheduleRepository,
    private readonly scheduleSlotProvider: IScheduleSlotProvider,
    private readonly memberProvider: IMemberProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    scheduleId: string
  ): Promise<ScheduleDTO> {
    const role = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );

    if (!role || !hasPermission(role, 'UPDATE_ORGANIZATION_COMPONENTS')) {
      throw new ForbiddenError(
        'You do not have permission to publish a schedule in this organization.'
      );
    }

    const schedule = await this.scheduleRepository.findById(
      scheduleId,
      organizationId
    );
    if (!schedule) {
      throw new NotFoundError('Schedule', scheduleId);
    }

    if (schedule.status === 'published') {
      return ScheduleMapper.toDTO(schedule);
    }

    const hasUnassigned = await this.scheduleSlotProvider.hasUnassignedSlots(
      schedule.id
    );

    if (hasUnassigned) {
      throw new ValidationError('ERR_SCHEDULE_HAS_UNASSIGNED_SLOTS');
    }

    if (schedule.conflicts > 0) {
      throw new ValidationError('ERR_SCHEDULE_HAS_CONFLICTS');
    }

    schedule.publish();

    await this.scheduleRepository.update(schedule);

    return ScheduleMapper.toDTO(schedule);
  }
}
