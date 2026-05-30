import type { ItineraryDTO } from '@tfg-horarios/shared';
import type { IItineraryRepository } from '../domain/itinerary.repository';
import type { IItineraryMemberProvider } from '../domain/itinerary-member.provider';
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
    requesterUserId: string
  ): Promise<ItineraryDTO[]> {
    const role: AppRole | null = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role) {
      throw new ForbiddenError('You do not have access to this organization');
    }

    const itineraries = await this.itineraryRepository.findAll(organizationId);
    return ItineraryMapper.toDTOList(itineraries);
  }
}
