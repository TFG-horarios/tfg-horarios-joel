import type {
  ItineraryDTO,
  CreateAndUpdateItineraryDTO,
} from '@tfg-horarios/shared';
import type { IItineraryRepository } from '../domain/itinerary.repository';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import { ItineraryMapper } from './itinerary.mapper';

export class UpdateItineraryUseCase {
  constructor(
    private readonly itineraryRepository: IItineraryRepository,
    private readonly memberRepository: IMemberRepository
  ) {}

  async execute(
    organizationId: string,
    degreeId: string,
    itineraryId: string,
    requesterUserId: string,
    dto: CreateAndUpdateItineraryDTO
  ): Promise<ItineraryDTO> {
    const requester = await this.memberRepository.findByUserAndOrg(
      requesterUserId,
      organizationId
    );
    if (
      !requester ||
      !hasPermission(requester.role, 'UPDATE_ORGANIZATION_COMPONENTS')
    ) {
      throw new ForbiddenError(
        'You do not have permission to update itineraries in this organization.'
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

    itinerary.update(dto.name);
    await this.itineraryRepository.update(itinerary);
    return ItineraryMapper.toDTO(itinerary);
  }
}
