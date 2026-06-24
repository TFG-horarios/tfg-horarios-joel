import type {
  ClassroomDTO,
  ClassroomListQueryDTO,
  PaginatedResponse,
} from '@tfg-horarios/shared';
import type { IClassroomRepository } from '../domain/classroom.repository';
import type { IMemberProvider } from '../domain/providers/member.provider';
import { ForbiddenError } from '@/core/errors/app.error';
import { ClassroomMapper } from './classroom.mapper';
import type { AppRole } from '@/core/permissions/roles';

export class ListClassroomsUseCase {
  constructor(
    private readonly classroomRepository: IClassroomRepository,
    private readonly memberProvider: IMemberProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    filters?: ClassroomListQueryDTO
  ): Promise<PaginatedResponse<ClassroomDTO>> {
    const role: AppRole | null = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role) {
      throw new ForbiddenError('You do not have access to this organization');
    }

    const result = await this.classroomRepository.findPaginated(
      organizationId,
      filters
    );

    return {
      data: ClassroomMapper.toDTOList(result.data),
      meta: result.meta,
    };
  }
}
