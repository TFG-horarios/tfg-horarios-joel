import type { DegreeDTO } from '@tfg-horarios/shared';
import type { IDegreeRepository } from '../domain/degree.repository';
import type { IMemberProvider } from '../domain/providers/member.provider';
import type { AppRole } from '@/core/permissions/roles';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { DegreeMapper } from './degree.mapper';
import type { IAcademicYearProvider } from '../domain/providers/academic-year.provider';

export class GetDegreeUseCase {
  constructor(
    private readonly degreeRepository: IDegreeRepository,
    private readonly memberProvider: IMemberProvider,
    private readonly academicYearProvider: IAcademicYearProvider
  ) {}

  async execute(
    organizationId: string,
    degreeId: string,
    requesterUserId: string,
    academicYearId?: string
  ): Promise<DegreeDTO> {
    const role: AppRole | null = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role) {
      throw new ForbiddenError('You do not have access to this organization');
    }

    let includeSoftDeleted = false;
    if (academicYearId) {
      includeSoftDeleted =
        await this.academicYearProvider.shouldIncludeSoftDeleted(
          academicYearId
        );
    }

    const degree = await this.degreeRepository.findById(
      degreeId,
      organizationId,
      includeSoftDeleted
    );
    if (!degree) throw new NotFoundError('Degree', degreeId);

    return DegreeMapper.toDTO(degree);
  }
}
