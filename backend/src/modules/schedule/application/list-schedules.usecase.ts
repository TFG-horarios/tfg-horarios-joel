import type {
  ScheduleDTO,
  ScheduleListQueryDTO,
  PaginatedResponse,
} from '@tfg-horarios/shared';
import type { IScheduleRepository } from '../domain/schedule.repository';
import type { IScheduleMemberProvider } from '../domain/providers/schedule-member.provider';
import { ForbiddenError } from '@/core/errors/app.error';
import { ScheduleMapper } from './schedule.mapper';

export class ListSchedulesUseCase {
  constructor(
    private readonly scheduleRepository: IScheduleRepository,
    private readonly memberProvider: IScheduleMemberProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    filters?: ScheduleListQueryDTO
  ): Promise<PaginatedResponse<ScheduleDTO>> {
    const role = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role) {
      throw new ForbiddenError('You do not have access to this organization.');
    }

    const { data, meta } = await this.scheduleRepository.findPaginated(
      organizationId,
      filters
    );
    return {
      data: data.map(ScheduleMapper.toDTO),
      meta,
    };
  }
}
