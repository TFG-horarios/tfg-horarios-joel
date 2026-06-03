import type { Itinerary } from './itinerary.entity';
import type {
  ItineraryIdentifierDTO,
  ItineraryListQueryDTO,
  PaginatedResponse,
} from '@tfg-horarios/shared';

export interface IItineraryRepository {
  findById(id: string, organizationId: string): Promise<Itinerary | null>;
  findAll(organizationId: string): Promise<Itinerary[]>;
  findPaginated(
    organizationId: string,
    filters?: ItineraryListQueryDTO
  ): Promise<PaginatedResponse<Itinerary>>;
  findIdentifiers(organizationId: string): Promise<ItineraryIdentifierDTO[]>;
  create(itinerary: Itinerary): Promise<void>;
  createMany(itineraries: Itinerary[]): Promise<void>;
  update(itinerary: Itinerary): Promise<void>;
  delete(id: string, organizationId: string): Promise<void>;
  deleteAll(organizationId: string): Promise<void>;
  replace(itineraries: Itinerary[], organizationId: string): Promise<void>;
}
