import type { IAcademicYearRepository } from '../domain/academic-year.repository';
import type { IMemberProvider } from '../domain/providers/member.provider';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';

export class DeleteAcademicYearUseCase {
  constructor(
    private readonly academicYearRepository: IAcademicYearRepository,
    private readonly memberProvider: IMemberProvider
  ) {}

  async execute(
    organizationId: string,
    academicYearId: string,
    requesterUserId: string
  ): Promise<void> {
    const role = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role || !hasPermission(role, 'DELETE_ORGANIZATION_COMPONENTS')) {
      throw new ForbiddenError(
        'You do not have permission to delete an academic year in this organization'
      );
    }

    const academicYear =
      await this.academicYearRepository.findById(academicYearId);
    if (!academicYear || academicYear.organizationId !== organizationId) {
      throw new NotFoundError('Academic Year', academicYearId);
    }

    await this.academicYearRepository.delete(academicYearId);
  }
}
