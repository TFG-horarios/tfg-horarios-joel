import type { ISubjectRepository } from '../domain/subject.repository';
import type { ISubjectMemberProvider } from '../domain/subject-member.provider';
import type { SaveSubjectDTO, SubjectDTO } from '@tfg-horarios/shared';
import { Subject } from '../domain/subject.entity';
import { SubjectMapper } from './subject.mapper';
import { ForbiddenError, ValidationError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';

export class BulkCreateSubjectUseCase {
  constructor(
    private readonly subjectRepository: ISubjectRepository,
    private readonly memberProvider: ISubjectMemberProvider
  ) {}

  async execute(
    organizationId: string,
    degreeId: string,
    requesterUserId: string,
    dtos: SaveSubjectDTO[]
  ): Promise<SubjectDTO[]> {
    if (!dtos || dtos.length === 0) {
      throw new ValidationError('No subject data provided for bulk creation');
    }

    const uniqueCodes = new Set<string>();
    for (const dto of dtos) {
      const code = dto.code.trim();
      if (uniqueCodes.has(code)) {
        throw new ValidationError(`Duplicate subject code in request: ${code}`);
      }
      uniqueCodes.add(code);
    }

    const role = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role || !hasPermission(role, 'CREATE_ORGANIZATION_COMPONENTS')) {
      throw new ForbiddenError(
        'You do not have permission to create a subject in this organization.'
      );
    }

    const subjects = dtos.map((dto) =>
      Subject.create({
        organizationId,
        degreeId,
        itineraryId: dto.isCommon ? null : dto.itineraryId || null,
        name: dto.name,
        code: dto.code,
        availableShifts: dto.availableShifts,
        numberOfStudents: dto.numberOfStudents,
        courseYear: dto.courseYear,
        period: dto.period,
        weeklyHours: dto.weeklyHours,
        isCommon: dto.isCommon,
      })
    );

    await this.subjectRepository.createMany(subjects);
    return SubjectMapper.toDTOList(subjects);
  }
}
