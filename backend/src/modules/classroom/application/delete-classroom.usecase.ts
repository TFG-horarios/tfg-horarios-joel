import type { IClassroomRepository } from '../domain/classroom.repository';
import type { IClassroomMemberProvider } from '../domain/classroom-member.provider';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import type { AppRole } from '@/core/permissions/roles';

export class DeleteClassroomUseCase {
  constructor(
    private readonly classroomRepository: IClassroomRepository,
    private readonly memberProvider: IClassroomMemberProvider
  ) {}

  async execute(
    organizationId: string,
    classroomId: string,
    requesterUserId: string
  ): Promise<void> {
    const role: AppRole | null = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role || !hasPermission(role, 'DELETE_ORGANIZATION_COMPONENTS')) {
      throw new ForbiddenError(
        'You do not have permission to delete classrooms in this organization.'
      );
    }

    const classroom = await this.classroomRepository.findById(
      classroomId,
      organizationId
    );
    if (!classroom) {
      throw new NotFoundError('Classroom', classroomId);
    }

    await this.classroomRepository.delete(classroomId, organizationId);
  }
}
