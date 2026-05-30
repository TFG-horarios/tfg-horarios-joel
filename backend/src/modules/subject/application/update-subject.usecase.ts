import type { ISubjectMemberProvider } from '../domain/subject-member.provider';
import type { ISubjectRepository } from '../domain/subject.repository';
import type { SaveSubjectDTO, SubjectDTO } from '@tfg-horarios/shared';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import { SubjectMapper } from './subject.mapper';

export class UpdateSubjectUseCase {
  constructor(
    private readonly subjectRepository: ISubjectRepository,
    private readonly memberProvider: ISubjectMemberProvider
  ) {}

  async execute(
    organizationId: string,
    subjectId: string,
    requesterUserId: string,
    dto: SaveSubjectDTO
  ): Promise<SubjectDTO> {
    const role = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role || !hasPermission(role, 'UPDATE_ORGANIZATION_COMPONENTS')) {
      throw new ForbiddenError('You do not have access to this organization');
    }

    const subject = await this.subjectRepository.findById(
      subjectId,
      organizationId
    );
    if (!subject) {
      throw new NotFoundError('Subject', subjectId);
    }

    subject.update({
      name: dto.name,
      code: dto.code,
      availableShifts: dto.availableShifts,
      numberOfStudents: dto.numberOfStudents,
      courseYear: dto.courseYear,
      period: dto.period,
      weeklyHours: dto.weeklyHours,
      isCommon: dto.isCommon,
      itineraryId: dto.isCommon ? null : dto.itineraryId || null,
    });

    await this.subjectRepository.update(subject);
    return SubjectMapper.toDTO(subject);
  }
}
