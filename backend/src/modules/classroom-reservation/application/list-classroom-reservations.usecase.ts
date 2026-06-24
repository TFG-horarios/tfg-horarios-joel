import type {
  ClassroomReservationDTO,
  ClassroomReservationListQueryDTO,
  PaginatedResponse,
} from '@tfg-horarios/shared';
import type { IClassroomReservationRepository } from '../domain/classroom-reservation.repository';
import type { IClassroomReservationMemberProvider } from '../domain/providers/classroom-reservation-member.provider';
import { ClassroomReservationMapper } from './classroom-reservation.mapper';
import { ForbiddenError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';

export class ListClassroomReservationsUseCase {
  constructor(
    private readonly repository: IClassroomReservationRepository,
    private readonly memberProvider: IClassroomReservationMemberProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    query: ClassroomReservationListQueryDTO
  ): Promise<PaginatedResponse<ClassroomReservationDTO>> {
    const role = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );

    if (!role) {
      throw new ForbiddenError(
        'You must be a member of the organization to view reservations.'
      );
    }

    const paginated = await this.repository.findPaginated(
      organizationId,
      query,
      hasPermission(role, 'UPDATE_ORGANIZATION_COMPONENTS')
        ? undefined
        : requesterUserId
    );

    return {
      data: paginated.data.map((r) => ClassroomReservationMapper.toDTO(r)),
      meta: paginated.meta,
    };
  }
}
