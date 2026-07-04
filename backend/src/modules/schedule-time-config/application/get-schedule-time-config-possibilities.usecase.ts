import type { ScheduleTimeConfigPossibilityDTO } from '@tfg-horarios/shared';
import { ForbiddenError } from '@/core/errors/app.error';
import type { AppRole } from '@/core/permissions/roles';
import type { IMemberProvider } from '../domain/providers/member.provider';
import type { IScheduleTimeConfigRepository } from '../domain/schedule-time-config.repository';

export class GetScheduleTimeConfigPossibilitiesUseCase {
  constructor(
    private readonly repository: IScheduleTimeConfigRepository,
    private readonly memberProvider: IMemberProvider
  ) {}

  async execute(
    organizationId: string,
    _academicYearId: string,
    userId: string
  ): Promise<ScheduleTimeConfigPossibilityDTO[]> {
    const role: AppRole | null = await this.memberProvider.getMemberRole(
      userId,
      organizationId
    );
    if (!role) {
      throw new ForbiddenError('You do not have access to this organization');
    }

    return this.repository.findPossibilities(organizationId);
  }
}
