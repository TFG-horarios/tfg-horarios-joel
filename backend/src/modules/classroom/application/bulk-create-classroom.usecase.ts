import type { ClassroomDTO, SaveClassroomDTO } from '@tfg-horarios/shared';
import { Classroom } from '../domain/classroom.entity';
import type { IClassroomRepository } from '../domain/classroom.repository';
import type { IClassroomMemberProvider } from '../domain/classroom-member.provider';
import { ForbiddenError, ValidationError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import { ClassroomMapper } from './classroom.mapper';
import type { AppRole } from '@/core/permissions/roles';

export class BulkCreateClassroomsUseCase {
  constructor(
    private readonly classroomRepository: IClassroomRepository,
    private readonly memberProvider: IClassroomMemberProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    dtos: SaveClassroomDTO[]
  ): Promise<ClassroomDTO[]> {
    if (!dtos || dtos.length === 0) {
      throw new ValidationError('No classroom data provided for bulk creation');
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

    const role: AppRole | null = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role || !hasPermission(role, 'CREATE_ORGANIZATION_COMPONENTS')) {
      throw new ForbiddenError(
        'You do not have permission to create new classrooms in this organization'
      );
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

    await this.classroomRepository.createMany(classrooms);

    return ClassroomMapper.toDTOList(classrooms);
  }
}
