import type { IAcademicYearRepository } from '../domain/academic-year.repository';
import { AcademicYearMapper } from './academic-year.mapper';
import type { AcademicYearDTO } from '@tfg-horarios/shared';
import { ForbiddenError } from '@/core/errors/app.error';
import type { IMemberProvider } from '../domain/providers/member.provider';

export class ListAcademicYearsUseCase {
  constructor(
    private readonly academicYearRepository: IAcademicYearRepository,
    private readonly memberProvider: IMemberProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string
  ): Promise<AcademicYearDTO[]> {
    const role = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role) {
      throw new ForbiddenError('You do not have access to this organization');
    }

    const academicYears =
      await this.academicYearRepository.findByOrganizationId(organizationId);

    return AcademicYearMapper.toDTOList(academicYears);
  }
}
