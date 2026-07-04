import type {
  ScheduleTimeConfigDTO,
  ScheduleTimeConfigListQueryDTO,
} from '@tfg-horarios/shared';
import { ForbiddenError } from '@/core/errors/app.error';
import type { AppRole } from '@/core/permissions/roles';
import type { IScheduleTimeConfigMemberProvider } from '../domain/providers/schedule-time-config-member.provider';
import type { IScheduleTimeConfigRepository } from '../domain/schedule-time-config.repository';
import { toScheduleTimeConfigDTO } from './schedule-time-config.mapper';

export class ListScheduleTimeConfigsUseCase {
  constructor(
    private readonly repository: IScheduleTimeConfigRepository,
    private readonly memberProvider: IScheduleTimeConfigMemberProvider
  ) {}

  async execute(
    organizationId: string,
    academicYearId: string,
    userId: string,
    filters: ScheduleTimeConfigListQueryDTO
  ): Promise<ScheduleTimeConfigDTO[]> {
    const role: AppRole | null = await this.memberProvider.getMemberRole(
      userId,
      organizationId
    );
    if (!role) {
      throw new ForbiddenError('You do not have access to this organization');
    }

    return (
      await this.repository.findAll(organizationId, academicYearId, filters)
    ).map(toScheduleTimeConfigDTO);
  }
}
