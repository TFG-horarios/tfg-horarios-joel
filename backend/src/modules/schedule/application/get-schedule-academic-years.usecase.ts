import type { IScheduleRepository } from '../domain/schedule.repository';
import type { IScheduleMemberProvider } from '../domain/schedule-member.provider';
import { ForbiddenError } from '@/core/errors/app.error';
import type { AppRole } from '@/core/permissions/roles';
import type { AcademicYear } from '@tfg-horarios/shared';

export class GetScheduleAcademicYearsUseCase {
  constructor(
    private readonly scheduleRepository: IScheduleRepository,
    private readonly memberProvider: IScheduleMemberProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string
  ): Promise<AcademicYear[]> {
    const role: AppRole | null = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role) {
      throw new ForbiddenError('You do not have access to this organization');
    }

    const years =
      await this.scheduleRepository.findDistinctAcademicYears(organizationId);
    return years;
  }
}
