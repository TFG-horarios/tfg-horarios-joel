import type { ClassroomDTO } from '@tfg-horarios/shared';
import type { IClassroomRepository } from '../domain/classroom.repository';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';
import { ForbiddenError } from '@/core/errors/app.error';
import { ClassroomMapper } from './classroom.mapper';

export class ListClassroomsUseCase {
  constructor(
    private readonly classroomRepository: IClassroomRepository,
    private readonly memberRepository: IMemberRepository
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string
  ): Promise<ClassroomDTO[]> {
    const requester = await this.memberRepository.findByUserAndOrg(
      requesterUserId,
      organizationId
    );
    if (!requester) {
      throw new ForbiddenError('You do not have access to this organization');
    }

    const classrooms = await this.classroomRepository.findAll(organizationId);
    return ClassroomMapper.toDTOList(classrooms);
  }
}
