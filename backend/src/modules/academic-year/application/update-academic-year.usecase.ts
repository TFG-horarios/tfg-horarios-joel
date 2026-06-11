import type { IAcademicYearRepository } from '../domain/academic-year.repository';
import { AcademicYearMapper } from './academic-year.mapper';
import type {
  AcademicYearDTO,
  SaveAcademicYearBodyDTO,
} from '@tfg-horarios/shared';
import { NotFoundError, ForbiddenError } from '@/core/errors/app.error';
import type { IAcademicYearMemberProvider } from '../domain/academic-year-member.provider';
import { hasPermission } from '@/core/permissions/authorization';

export class UpdateAcademicYearUseCase {
  constructor(
    private readonly academicYearRepository: IAcademicYearRepository,
    private readonly memberProvider: IAcademicYearMemberProvider
  ) {}

  async execute(
    organizationId: string,
    academicYearId: string,
    requesterUserId: string,
    data: SaveAcademicYearBodyDTO
  ): Promise<AcademicYearDTO> {
    const role = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role || !hasPermission(role, 'CREATE_ORGANIZATION_COMPONENTS')) {
      throw new ForbiddenError(
        'You do not have permission to update an academic year in this organization'
      );
    }

    const academicYear =
      await this.academicYearRepository.findById(academicYearId);
    if (!academicYear || academicYear.organizationId !== organizationId) {
      throw new NotFoundError('Academic Year', academicYearId);
    }

    academicYear.update({
      name: data.name,
      period0Start: data.period0Start ?? null,
      period0End: data.period0End ?? null,
      period1Start: data.period1Start ?? null,
      period1End: data.period1End ?? null,
      period2Start: data.period2Start ?? null,
      period2End: data.period2End ?? null,
      period3Start: data.period3Start ?? null,
      period3End: data.period3End ?? null,
    });

    await this.academicYearRepository.update(academicYear);

    return AcademicYearMapper.toDTO(academicYear);
  }
}
