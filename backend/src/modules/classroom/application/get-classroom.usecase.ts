import type { ClassroomDTO } from '@tfg-horarios/shared';
import type { IClassroomRepository } from '../domain/classroom.repository';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { ClassroomMapper } from './classroom.mapper';

export class GetClassroomUseCase {
  constructor(
    private readonly classroomRepository: IClassroomRepository,
    private readonly memberRepository: IMemberRepository
  ) {}

  async execute(
    organizationId: string,
    classroomId: string,
    requesterUserId: string
  ): Promise<ClassroomDTO> {
    const requester = await this.memberRepository.findByUserAndOrg(
      requesterUserId,
      organizationId
    );
    if (!requester) {
      throw new ForbiddenError('You do not have access to this organization');
    }

    const classroom = await this.classroomRepository.findById(
      classroomId,
      organizationId
    );

    if (!classroom) {
      throw new NotFoundError('Classroom', classroomId);
    }

    return ClassroomMapper.toDTO(classroom);
  }
}
