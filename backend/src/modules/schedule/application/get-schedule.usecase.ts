import type { ScheduleDTO } from '@tfg-horarios/shared';
import type { IScheduleRepository } from '../domain/schedule.repository';
import type { IScheduleMemberProvider } from '../domain/schedule-member.provider';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { ScheduleMapper } from './schedule.mapper';
import type { AppRole } from '@/core/permissions/roles';

export class GetScheduleUseCase {
  constructor(
    private readonly scheduleRepository: IScheduleRepository,
    private readonly memberProvider: IScheduleMemberProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    scheduleId: string
  ): Promise<ScheduleDTO> {
    const role: AppRole | null = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );

    if (!role) {
      throw new ForbiddenError('You do not have access to this organization.');
    }

    const schedule = await this.scheduleRepository.findById(
      scheduleId,
      organizationId
    );
    if (!schedule) {
      throw new NotFoundError('Schedule', scheduleId);
    }

    return ScheduleMapper.toDTO(schedule);
  }
}
