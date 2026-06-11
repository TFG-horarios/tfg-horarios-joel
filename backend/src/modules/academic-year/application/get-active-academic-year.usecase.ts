import type { IAcademicYearRepository } from '../domain/academic-year.repository';
import { AcademicYearMapper } from './academic-year.mapper';
import type { AcademicYearDTO } from '@tfg-horarios/shared';
import { NotFoundError, ForbiddenError } from '@/core/errors/app.error';
import type { IAcademicYearMemberProvider } from '../domain/academic-year-member.provider';

export class GetActiveAcademicYearUseCase {
  constructor(
    private readonly academicYearRepository: IAcademicYearRepository,
    private readonly memberProvider: IAcademicYearMemberProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string
  ): Promise<AcademicYearDTO> {
    const role = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role) {
      throw new ForbiddenError('You do not have access to this organization');
    }

    const activeAcademicYear =
      await this.academicYearRepository.findActiveByOrganizationId(
        organizationId
      );

    if (!activeAcademicYear) {
      throw new NotFoundError('Active academic year', organizationId);
    }

    return AcademicYearMapper.toDTO(activeAcademicYear);
  }
}
