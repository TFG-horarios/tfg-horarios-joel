import type { ItineraryDTO, SaveItineraryDTO } from '@tfg-horarios/shared';
import { Itinerary } from '../domain/itinerary.entity';
import type { IItineraryRepository } from '../domain/itinerary.repository';
import type { IMemberRepository } from '@/modules/member/domain/member.repository';
import { ForbiddenError, ValidationError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import { ItineraryMapper } from './itinerary.mapper';

export class BulkCreateItinerariesUseCase {
  constructor(
    private readonly itineraryRepository: IItineraryRepository,
    private readonly memberRepository: IMemberRepository
  ) {}

  async execute(
    organizationId: string,
    degreeId: string,
    requesterUserId: string,
    dtos: SaveItineraryDTO[]
  ): Promise<ItineraryDTO[]> {
    if (!dtos || dtos.length === 0)
      throw new ValidationError(
        'At least one itinerary must be provided for bulk creation.'
      );

    const requester = await this.memberRepository.findByUserAndOrg(
      requesterUserId,
      organizationId
    );
    if (
      !requester ||
      !hasPermission(requester.role, 'CREATE_ORGANIZATION_COMPONENTS')
    ) {
      throw new ForbiddenError(
        'You do not have permission to create itineraries in this organization.'
      );
    }

    const itineraries = dtos.map((dto) =>
      Itinerary.create({
        organizationId,
        degreeId,
        name: dto.name,
        code: dto.code,
      })
    );

    await this.itineraryRepository.createMany(itineraries);
    return ItineraryMapper.toDTOList(itineraries);
  }
}
