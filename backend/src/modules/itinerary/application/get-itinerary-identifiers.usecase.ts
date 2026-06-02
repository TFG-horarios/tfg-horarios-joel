import type { IItineraryRepository } from '../domain/itinerary.repository';
import type { IItineraryMemberProvider } from '../domain/itinerary-member.provider';
import { ForbiddenError } from '@/core/errors/app.error';
import type { AppRole } from '@/core/permissions/roles';
import type { ItineraryIdentifierDTO } from '@tfg-horarios/shared';

export class GetItineraryIdentifiersUseCase {
  constructor(
    private readonly itineraryRepository: IItineraryRepository,
    private readonly memberProvider: IItineraryMemberProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string
  ): Promise<ItineraryIdentifierDTO[]> {
    const role: AppRole | null = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role) {
      throw new ForbiddenError('You do not have access to this organization');
    }

    return this.itineraryRepository.findIdentifiers(organizationId);
  }
}
