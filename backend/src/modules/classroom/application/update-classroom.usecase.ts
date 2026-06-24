import type { ClassroomDTO, SaveClassroomDTO } from '@tfg-horarios/shared';
import type { IClassroomRepository } from '../domain/classroom.repository';
import type { IMemberProvider } from '../domain/providers/member.provider';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import { ClassroomMapper } from './classroom.mapper';
import type { AppRole } from '@/core/permissions/roles';

export class UpdateClassroomUseCase {
  constructor(
    private readonly classroomRepository: IClassroomRepository,
    private readonly memberProvider: IMemberProvider
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
      organizationId,
      false
    );
    if (!classroom) {
      throw new NotFoundError('Classroom', classroomId);
    }

    classroom.update(dto.name, dto.capacity, dto.floor, dto.type);

    await this.classroomRepository.update(classroom);
    return ClassroomMapper.toDTO(classroom);
  }
}
