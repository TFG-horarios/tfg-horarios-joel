import type { ClassroomDTO, SaveClassroomDTO } from '@tfg-horarios/shared';
import { Classroom } from '../domain/classroom.entity';
import type { IClassroomRepository } from '../domain/classroom.repository';
import { ClassroomMapper } from './classroom.mapper';
import { ForbiddenError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import type { IClassroomMemberProvider } from '../domain/classroom-member.provider';
import type { AppRole } from '@/core/permissions/roles';

export class CreateClassroomUseCase {
  constructor(
    private readonly classroomRepository: IClassroomRepository,
    private readonly memberProvider: IClassroomMemberProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    dto: SaveClassroomDTO
  ): Promise<ClassroomDTO> {
    const role: AppRole | null = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role || !hasPermission(role, 'CREATE_ORGANIZATION_COMPONENTS')) {
      throw new ForbiddenError(
        'You do not have permission to create new classrooms in this organization'
      );
    }
    const classroom = Classroom.create({
      organizationId,
      name: dto.name,
      capacity: dto.capacity,
      type: dto.type,
    });

    await this.classroomRepository.create(classroom);
    return ClassroomMapper.toDTO(classroom);
  }
}
