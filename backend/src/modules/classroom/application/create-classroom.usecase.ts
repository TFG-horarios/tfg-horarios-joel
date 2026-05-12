import type { ClassroomDTO, SaveClassroomDTO } from '@tfg-horarios/shared';
import { Classroom } from '../domain/classroom.entity';
import type { IClassroomRepository } from '../domain/classroom.repository';
import { ClassroomMapper } from './classroom.mapper';
import { ForbiddenError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';

export class CreateClassroomUseCase {
  constructor(
    private readonly classroomRepository: IClassroomRepository,
    private readonly memberRepository: IMemberRepository
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    dto: SaveClassroomDTO
  ): Promise<ClassroomDTO> {
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
