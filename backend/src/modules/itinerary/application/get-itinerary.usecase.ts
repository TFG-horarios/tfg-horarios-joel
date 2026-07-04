import type { ItineraryDTO } from '@tfg-horarios/shared';
import type { IItineraryRepository } from '../domain/itinerary.repository';
import type { IMemberProvider } from '../domain/providers/member.provider';
import type { AppRole } from '@/core/permissions/roles';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { ItineraryMapper } from './itinerary.mapper';
import type { IAcademicYearProvider } from '../domain/providers/academic-year.provider';

export class GetItineraryUseCase {
  constructor(
    private readonly itineraryRepository: IItineraryRepository,
    private readonly memberProvider: IMemberProvider,
    private readonly academicYearProvider: IAcademicYearProvider
  ) {}

  async execute(
    organizationId: string,
    itineraryId: string,
    requesterUserId: string,
    academicYearId?: string
  ): Promise<ItineraryDTO> {
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

    const itinerary = await this.itineraryRepository.findById(
      itineraryId,
      organizationId,
      includeSoftDeleted
    );
    if (!itinerary) {
      throw new NotFoundError('Itinerary', itineraryId);
    }

    return ItineraryMapper.toDTO(itinerary);
  }
}
