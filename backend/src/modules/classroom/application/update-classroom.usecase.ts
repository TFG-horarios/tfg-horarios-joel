import type { ClassroomDTO, SaveClassroomDTO } from '@tfg-horarios/shared';
import type { IClassroomRepository } from '../domain/classroom.repository';
import type { IClassroomMemberProvider } from '../domain/classroom-member.provider';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import { ClassroomMapper } from './classroom.mapper';
import type { AppRole } from '@/core/permissions/roles';

export class UpdateClassroomUseCase {
  constructor(
    private readonly classroomRepository: IClassroomRepository,
    private readonly memberProvider: IClassroomMemberProvider
  ) {}

  async execute(
    organizationId: string,
    classroomId: string,
    requesterUserId: string,
    dto: SaveClassroomDTO
  ): Promise<ClassroomDTO> {
    const role: AppRole | null = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role || !hasPermission(role, 'UPDATE_ORGANIZATION_COMPONENTS')) {
      throw new ForbiddenError(
        'You do not have permission to update classrooms in this organization.'
      );
    }

    const classroom = await this.classroomRepository.findById(
      classroomId,
      organizationId
    );
    if (!classroom) {
      throw new NotFoundError('Classroom', classroomId);
    }

    classroom.update(dto.name, dto.capacity, dto.type);

    await this.classroomRepository.update(classroom);
    return ClassroomMapper.toDTO(classroom);
  }
}
