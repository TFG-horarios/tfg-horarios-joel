import type { ItineraryDTO, BulkSaveItineraryDTO } from '@tfg-horarios/shared';
import { Itinerary } from '../domain/itinerary.entity';
import type { IItineraryRepository } from '../domain/itinerary.repository';
import type { IItineraryMemberProvider } from '../domain/itinerary-member.provider';
import type { AppRole } from '@/core/permissions/roles';
import { ForbiddenError, ValidationError } from '@/core/errors/app.error';
import { hasPermission } from '@/core/permissions/authorization';
import { ItineraryMapper } from './itinerary.mapper';

export class ReplaceItinerariesUseCase {
  constructor(
    private readonly itineraryRepository: IItineraryRepository,
    private readonly memberProvider: IItineraryMemberProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    dtos: BulkSaveItineraryDTO[]
  ): Promise<ItineraryDTO[]> {
    const role: AppRole | null = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (
      !role ||
      !hasPermission(role, 'DELETE_ORGANIZATION_COMPONENTS') ||
      !hasPermission(role, 'CREATE_ORGANIZATION_COMPONENTS')
    ) {
      throw new ForbiddenError(
        'You do not have permission to replace itineraries in this organization.'
      );
    }

    const uniqueCodes = new Set<string>();
    for (const dto of dtos) {
      const code = dto.code.trim();
      if (uniqueCodes.has(code)) {
        throw new ValidationError(
          `Duplicate itinerary code in request: ${code}`
        );
      }
      uniqueCodes.add(code);
    }

    const itineraries = dtos.map((dto) =>
      Itinerary.create({
        organizationId,
        degreeId: dto.degreeId,
        name: dto.name,
        code: dto.code,
      })
    );

    await this.itineraryRepository.replace(itineraries, organizationId);
    return ItineraryMapper.toDTOList(itineraries);
  }
}
