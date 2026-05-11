import { Itinerary } from '../domain/itinerary.entity';
import type { ItineraryDTO } from '@tfg-horarios/shared';

export class ItineraryMapper {
  static toDTO(itinerary: Itinerary): ItineraryDTO {
    return {
      id: itinerary.id,
      organizationId: itinerary.organizationId,
      degreeId: itinerary.degreeId,
      name: itinerary.name,
      createdAt: itinerary.createdAt.toISOString(),
      updatedAt: itinerary.updatedAt.toISOString(),
      deletedAt: itinerary.deletedAt ? itinerary.deletedAt.toISOString() : null,
    };
  }

  static toDTOList(itineraries: Itinerary[]): ItineraryDTO[] {
    return itineraries.map((itinerary) => this.toDTO(itinerary));
  }
}
