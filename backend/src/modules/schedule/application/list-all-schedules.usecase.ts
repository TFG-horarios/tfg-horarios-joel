import type { ScheduleDTO } from '@tfg-horarios/shared';
import type { IScheduleRepository } from '../domain/schedule.repository';
import type { IScheduleMemberProvider } from '../domain/schedule-member.provider';
import { ForbiddenError } from '@/core/errors/app.error';
import { ScheduleMapper } from './schedule.mapper';

export class ListAllSchedulesUseCase {
  constructor(
    private readonly scheduleRepository: IScheduleRepository,
    private readonly memberProvider: IScheduleMemberProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string
  ): Promise<ScheduleDTO[]> {
    const role = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role) {
      throw new ForbiddenError('You do not have access to this organization.');
    }

    const schedules = await this.scheduleRepository.findAll(organizationId);
    return schedules.map(ScheduleMapper.toDTO);
  }
}
