import type { IScheduleRepository } from '../domain/schedule.repository';
import type { IScheduleMemberProvider } from '../domain/schedule-member.provider';
import type { ScheduleDTO } from '@tfg-horarios/shared';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import { ScheduleMapper } from './schedule.mapper';

export class UnpublishScheduleUseCase {
  constructor(
    private readonly scheduleRepository: IScheduleRepository,
    private readonly memberProvider: IScheduleMemberProvider
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
        'You do not have permission to unpublish schedules in this organization.'
      );
    }

    const schedule = await this.scheduleRepository.findById(
      scheduleId,
      organizationId
    );
    if (!schedule) {
      throw new NotFoundError('Schedule', scheduleId);
    }

    schedule.markAsDraft();

    await this.scheduleRepository.update(schedule);

    return ScheduleMapper.toDTO(schedule);
  }
}
