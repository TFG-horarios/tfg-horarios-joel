import type { ItineraryDTO, SaveItineraryDTO } from '@tfg-horarios/shared';
import { Itinerary } from '../domain/itinerary.entity';
import type { IItineraryRepository } from '../domain/itinerary.repository';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';
import { ForbiddenError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import { ItineraryMapper } from './itinerary.mapper';

export class CreateItineraryUseCase {
  constructor(
    private readonly itineraryRepository: IItineraryRepository,
    private readonly memberRepository: IMemberRepository
  ) {}

  async execute(
    organizationId: string,
    degreeId: string,
    requesterUserId: string,
    dto: SaveItineraryDTO
  ): Promise<ItineraryDTO> {
    const requester = await this.memberRepository.findByUserAndOrg(
      requesterUserId,
      organizationId
    );
    if (
      !requester ||
      !hasPermission(requester.role, 'CREATE_ORGANIZATION_COMPONENTS')
    ) {
      throw new ForbiddenError(
        'You do not have permission to create an itinerary in this organization.'
      );
    }

    const itinerary = Itinerary.create({
      organizationId,
      degreeId,
      name: dto.name,
      code: dto.code,
    });

    await this.itineraryRepository.create(itinerary);
    return ItineraryMapper.toDTO(itinerary);
  }
}
