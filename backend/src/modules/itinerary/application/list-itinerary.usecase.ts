import type {
  ItineraryDTO,
  ItineraryListQueryDTO,
  PaginatedResponse,
} from '@tfg-horarios/shared';
import type { IItineraryRepository } from '../domain/itinerary.repository';
import type { IItineraryMemberProvider } from '../domain/providers/itinerary-member.provider';
import type { AppRole } from '@/core/permissions/roles';
import { ForbiddenError } from '@/core/errors/app.error';
import { ItineraryMapper } from './itinerary.mapper';

export class ListItinerariesUseCase {
  constructor(
    private readonly itineraryRepository: IItineraryRepository,
    private readonly memberProvider: IItineraryMemberProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    filters?: ItineraryListQueryDTO
  ): Promise<PaginatedResponse<ItineraryDTO>> {
    const role: AppRole | null = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role) {
      throw new ForbiddenError('You do not have access to this organization');
    }

    const { data, meta } = await this.itineraryRepository.findPaginated(
      organizationId,
      filters
    );
    return {
      data: ItineraryMapper.toDTOList(data),
      meta,
    };
  }
}
