import type { ISubjectRepository } from '../domain/subject.repository';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';
import type { SaveSubjectDTO, SubjectDTO } from '@tfg-horarios/shared';
import { Subject } from '../domain/subject.entity';
import { SubjectMapper } from './subject.mapper';
import { ForbiddenError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';

export class CreateSubjectUseCase {
  constructor(
    private readonly subjectRepository: ISubjectRepository,
    private readonly memberRepository: IMemberRepository
  ) {}

  async execute(
    organizationId: string,
    degreeId: string,
    requesterUserId: string,
    dto: SaveSubjectDTO
  ): Promise<SubjectDTO> {
    const requester = await this.memberRepository.findByUserAndOrg(
      requesterUserId,
      organizationId
    );
    if (
      !requester ||
      !hasPermission(requester.role, 'CREATE_ORGANIZATION_COMPONENTS')
    ) {
      throw new ForbiddenError(
        'You do not have permission to create a subject in this organization.'
      );
    }
    const subject = Subject.create({
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
    });

    await this.subjectRepository.create(subject);
    return SubjectMapper.toDTO(subject);
  }
}
