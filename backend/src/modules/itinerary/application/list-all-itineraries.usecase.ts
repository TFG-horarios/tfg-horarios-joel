import type { ItineraryDTO } from '@tfg-horarios/shared';
import type { IItineraryRepository } from '../domain/itinerary.repository';
import type { IItineraryMemberProvider } from '../domain/providers/itinerary-member.provider';
import { ForbiddenError } from '@/core/errors/app.error';
import { ItineraryMapper } from './itinerary.mapper';
import type { AppRole } from '@/core/permissions/roles';
import type { IItineraryAcademicYearProvider } from '../domain/providers/itinerary-academic-year.provider';

export class ListAllItinerariesUseCase {
  constructor(
    private readonly itineraryRepository: IItineraryRepository,
    private readonly memberProvider: IItineraryMemberProvider,
    private readonly academicYearProvider: IItineraryAcademicYearProvider
  ) {}

  async execute(
    organizationId: string,
    requesterUserId: string,
    academicYearId?: string
  ): Promise<ItineraryDTO[]> {
    const role: AppRole | null = await this.memberProvider.getMemberRole(
      requesterUserId,
      organizationId
    );
    if (!role) {
      throw new ForbiddenError('You do not have access to this organization');
    }

    let includeSoftDeleted = false;
    if (academicYearId) {
      includeSoftDeleted =
        await this.academicYearProvider.shouldIncludeSoftDeleted(
          academicYearId
        );
    }

    const itineraries = await this.itineraryRepository.findAll(
      organizationId,
      includeSoftDeleted
    );
    return ItineraryMapper.toDTOList(itineraries);
  }
}
