import type { IItineraryRepository } from '../domain/itinerary.repository';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';

export class DeleteItineraryUseCase {
  constructor(
    private readonly itineraryRepository: IItineraryRepository,
    private readonly memberRepository: IMemberRepository
  ) {}

  async execute(
    organizationId: string,
    degreeId: string,
    itineraryId: string,
    requesterUserId: string
  ): Promise<void> {
    const requester = await this.memberRepository.findByUserAndOrg(
      requesterUserId,
      organizationId
    );
    if (
      !requester ||
      !hasPermission(requester.role, 'DELETE_ORGANIZATION_COMPONENTS')
    ) {
      throw new ForbiddenError(
        'You do not have permission to delete itineraries in this organization.'
      );
    }

    const itinerary = await this.itineraryRepository.findById(itineraryId);
    if (
      !itinerary ||
      itinerary.organizationId !== organizationId ||
      itinerary.degreeId !== degreeId
    ) {
      throw new NotFoundError('Itinerary', itineraryId);
    }

    await this.itineraryRepository.delete(itineraryId);
  }
}
