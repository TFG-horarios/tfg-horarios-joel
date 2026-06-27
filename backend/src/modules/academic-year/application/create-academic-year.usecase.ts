import { AcademicYear } from '../domain/academic-year.entity';
import { AcademicYearMapper } from './academic-year.mapper';
import type { IAcademicYearRepository } from '../domain/academic-year.repository';
import type {
  AcademicYearDTO,
  SaveAcademicYearBodyDTO,
} from '@tfg-horarios/shared';
import type { IOrganizationProvider } from '../domain/providers/organization.provider';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '@/core/errors/app.error';
import type { IMemberProvider } from '../domain/providers/member.provider';
import { hasPermission } from '@/core/permissions/authorization';

export class CreateAcademicYearUseCase {
  constructor(
    private readonly academicYearRepository: IAcademicYearRepository,
    private readonly organizationProvider: IOrganizationProvider,
    private readonly memberProvider: IMemberProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    data: SaveAcademicYearBodyDTO
  ): Promise<AcademicYearDTO> {
    const role = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role || !hasPermission(role, 'CREATE_ORGANIZATION_COMPONENTS')) {
      throw new ForbiddenError(
        'You do not have permission to create an academic year in this organization'
      );
    }

    const exists =
      await this.organizationProvider.organizationExists(organizationId);
    if (!exists) {
      throw new NotFoundError('Organization', organizationId);
    }

    const existingYears =
      await this.academicYearRepository.findByOrganizationId(organizationId);
    if (existingYears.some((ay) => ay.name === data.name)) {
      throw new ConflictError(
        `An academic year with the name '${data.name}' already exists in this organization`
      );
    }

    const academicYear = AcademicYear.create({
      organizationId,
      name: data.name,
      period0Start: data.period0Start ?? null,
      period0End: data.period0End ?? null,
      period1Start: data.period1Start ?? null,
      period1End: data.period1End ?? null,
      period2Start: data.period2Start ?? null,
      period2End: data.period2End ?? null,
      periodType: data.periodType,
      breakDurationMinutes: data.breakDurationMinutes,
      centerOpeningTime: data.centerOpeningTime,
      centerClosingTime: data.centerClosingTime,
      slotDurationMinutes: data.slotDurationMinutes,
    });

    await this.academicYearRepository.save(academicYear);

    return AcademicYearMapper.toDTO(academicYear);
  }
}
