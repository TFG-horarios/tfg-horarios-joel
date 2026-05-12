import type { ClassroomDTO, SaveClassroomDTO } from '@tfg-horarios/shared';
import { Classroom } from '../domain/classroom.entity';
import type { IClassroomRepository } from '../domain/classroom.repository';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';
import { ForbiddenError, ValidationError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import { ClassroomMapper } from './classroom.mapper';

export class BulkCreateClassroomsUseCase {
  constructor(
    private readonly classroomRepository: IClassroomRepository,
    private readonly memberRepository: IMemberRepository
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    dtos: SaveClassroomDTO[]
  ): Promise<ClassroomDTO[]> {
    if (!dtos || dtos.length === 0) {
      throw new ValidationError('No classroom data provided for bulk creation');
    }

    const requester = await this.memberRepository.findByUserAndOrg(
      requesterUserId,
      organizationId
    );
    if (
      !requester ||
      !hasPermission(requester.role, 'CREATE_ORGANIZATION_COMPONENTS')
    ) {
      throw new ForbiddenError(
        'You do not have permission to create new classrooms in this organization'
      );
    }

    const classrooms = dtos.map((dto) =>
      Classroom.create({
        organizationId,
        name: dto.name,
        capacity: dto.capacity,
        type: dto.type ?? 'theory',
      })
    );

    await this.classroomRepository.createMany(classrooms);

    return ClassroomMapper.toDTOList(classrooms);
  }
}
