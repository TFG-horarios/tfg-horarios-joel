import type { ItineraryDTO } from '@tfg-horarios/shared';
import type { IItineraryRepository } from '../domain/itinerary.repository';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { ItineraryMapper } from './itinerary.mapper';

export class GetItineraryUseCase {
  constructor(
    private readonly itineraryRepository: IItineraryRepository,
    private readonly memberRepository: IMemberRepository
  ) {}

  async execute(
    organizationId: string,
    degreeId: string,
    itineraryId: string,
    requesterUserId: string
  ): Promise<ItineraryDTO> {
    const requester = await this.memberRepository.findByUserAndOrg(
      requesterUserId,
      organizationId
    );
    if (!requester)
      throw new ForbiddenError('You do not have access to this organization');

    const itinerary = await this.itineraryRepository.findById(itineraryId);
    if (
      !itinerary ||
      itinerary.organizationId !== organizationId ||
      itinerary.degreeId !== degreeId
    ) {
      throw new NotFoundError('Itinerary', itineraryId);
    }

    return ItineraryMapper.toDTO(itinerary);
  }
}
