import type { ItineraryDTO } from '@tfg-horarios/shared';
import type { IItineraryRepository } from '../domain/itinerary.repository';
import type { IItineraryMemberProvider } from '../domain/itinerary-member.provider';
import type { AppRole } from '@/core/permissions/roles';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { ItineraryMapper } from './itinerary.mapper';

export class GetItineraryUseCase {
  constructor(
    private readonly itineraryRepository: IItineraryRepository,
    private readonly memberProvider: IItineraryMemberProvider
  ) {}

  async execute(
    organizationId: string,
    itineraryId: string,
    requesterUserId: string
  ): Promise<ItineraryDTO> {
    const role: AppRole | null = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role) {
      throw new ForbiddenError('You do not have access to this organization');
    }

    const itinerary = await this.itineraryRepository.findById(
      itineraryId,
      organizationId
    );
    if (!itinerary) {
      throw new NotFoundError('Itinerary', itineraryId);
    }

    return ItineraryMapper.toDTO(itinerary);
  }
}
