import type { ClassroomDTO } from '@tfg-horarios/shared';
import type { IClassroomRepository } from '../domain/classroom.repository';
import type { IClassroomMemberProvider } from '../domain/classroom-member.provider';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { ClassroomMapper } from './classroom.mapper';
import type { AppRole } from '@/core/permissions/roles';

export class GetClassroomUseCase {
  constructor(
    private readonly classroomRepository: IClassroomRepository,
    private readonly memberProvider: IClassroomMemberProvider
  ) {}

  async execute(
    organizationId: string,
    classroomId: string,
    requesterUserId: string
  ): Promise<ClassroomDTO> {
    const role: AppRole | null = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role) {
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
