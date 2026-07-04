import { ConflictError, ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import type { AppRole } from '@/core/permissions/roles';
import type { IScheduleTimeConfigMemberProvider } from '../domain/providers/schedule-time-config-member.provider';
import type { IScheduleTimeConfigRepository } from '../domain/schedule-time-config.repository';

export class DeleteScheduleTimeConfigUseCase {
  constructor(
    private readonly repository: IScheduleTimeConfigRepository,
    private readonly memberProvider: IScheduleTimeConfigMemberProvider
  ) {}

  async execute(
    organizationId: string,
    academicYearId: string,
    id: string,
    userId: string
  ): Promise<void> {
    const role: AppRole | null = await this.memberProvider.getMemberRole(
      userId,
      organizationId
    );
    if (!role || !hasPermission(role, 'DELETE_ORGANIZATION_COMPONENTS')) {
      throw new ForbiddenError(
        'You do not have permission to delete schedule time configurations in this organization.'
      );
    }

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
}
