import type { ClassroomDTO, SaveClassroomDTO } from '@tfg-horarios/shared';
import type { IClassroomRepository } from '../domain/classroom.repository';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import { ClassroomMapper } from './classroom.mapper';

export class UpdateClassroomUseCase {
  constructor(
    private readonly classroomRepository: IClassroomRepository,
    private readonly memberRepository: IMemberRepository
  ) {}

  async execute(
    organizationId: string,
    classroomId: string,
    requesterUserId: string,
    dto: SaveClassroomDTO
  ): Promise<ClassroomDTO> {
    const requester = await this.memberRepository.findByUserAndOrg(
      requesterUserId,
      organizationId
    );
    if (
      !requester ||
      !hasPermission(requester.role, 'UPDATE_ORGANIZATION_COMPONENTS')
    ) {
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
