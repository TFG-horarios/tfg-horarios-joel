import type { IItineraryRepository } from '../domain/itinerary.repository';
import type { IItineraryMemberProvider } from '../domain/itinerary-member.provider';
import type { AppRole } from '@/core/permissions/roles';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';

export class DeleteItineraryUseCase {
  constructor(
    private readonly itineraryRepository: IItineraryRepository,
    private readonly memberProvider: IItineraryMemberProvider
  ) {}

  async execute(
    organizationId: string,
    itineraryId: string,
    requesterUserId: string
  ): Promise<void> {
    const role: AppRole | null = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role || !hasPermission(role, 'DELETE_ORGANIZATION_COMPONENTS')) {
      throw new ForbiddenError(
        'You do not have permission to delete itineraries in this organization.'
      );
    }

    const itinerary = await this.itineraryRepository.findById(
      itineraryId,
      organizationId
    );
    if (!itinerary) {
      throw new NotFoundError('Itinerary', itineraryId);
    }

    await this.itineraryRepository.delete(itineraryId, organizationId);
  }
}
