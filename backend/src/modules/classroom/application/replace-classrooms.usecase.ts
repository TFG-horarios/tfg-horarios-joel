import type { ClassroomDTO, SaveClassroomDTO } from '@tfg-horarios/shared';
import { Classroom } from '../domain/classroom.entity';
import type { IClassroomRepository } from '../domain/classroom.repository';
import type { IMemberProvider } from '../domain/providers/member.provider';
import { ForbiddenError, ValidationError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import { ClassroomMapper } from './classroom.mapper';
import type { AppRole } from '@/core/permissions/roles';

export class ReplaceClassroomsUseCase {
  constructor(
    private readonly classroomRepository: IClassroomRepository,
    private readonly memberProvider: IMemberProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    dtos: SaveClassroomDTO[]
  ): Promise<ClassroomDTO[]> {
    const role: AppRole | null = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (
      !role ||
      !hasPermission(role, 'DELETE_ORGANIZATION_COMPONENTS') ||
      !hasPermission(role, 'CREATE_ORGANIZATION_COMPONENTS')
    ) {
      throw new ForbiddenError(
        'You do not have permission to replace classrooms in this organization'
      );
    }

    const uniqueNames = new Set<string>();
    for (const dto of dtos) {
      const name = dto.name.trim();
      if (uniqueNames.has(name)) {
        throw new ValidationError(
          `Duplicate classroom name in request: ${name}`
        );
      }
      uniqueNames.add(name);
    }

    const classrooms = dtos.map((dto) =>
      Classroom.create({
        organizationId,
        name: dto.name,
        capacity: dto.capacity,
        floor: dto.floor,
        type: dto.type ?? 'theory',
      })
    );

    await this.classroomRepository.replace(classrooms, organizationId);

    return ClassroomMapper.toDTOList(classrooms);
  }
}
