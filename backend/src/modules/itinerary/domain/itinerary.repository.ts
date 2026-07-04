import type { DbTransaction } from '@/core/db/transaction-runner';
import type { Itinerary } from './itinerary.entity';
import type {
  ItineraryIdentifierDTO,
  ItineraryListQueryDTO,
  PaginatedResponse,
} from '@tfg-horarios/shared';

export interface IItineraryRepository {
  findById(
    id: string,
    organizationId: string,
    includeSoftDeleted: boolean
  ): Promise<Itinerary | null>;
  findAll(
    organizationId: string,
    includeSoftDeleted: boolean
  ): Promise<Itinerary[]>;
  findPaginated(
    organizationId: string,
    filters?: ItineraryListQueryDTO
  ): Promise<PaginatedResponse<Itinerary>>;
  findIdentifiers(organizationId: string): Promise<ItineraryIdentifierDTO[]>;
  create(itinerary: Itinerary): Promise<void>;
  createMany(itineraries: Itinerary[]): Promise<void>;
  update(itinerary: Itinerary): Promise<void>;
  delete(id: string, organizationId: string, tx?: DbTransaction): Promise<void>;
  deleteAll(organizationId: string, tx?: DbTransaction): Promise<void>;
  replace(itineraries: Itinerary[], organizationId: string): Promise<void>;
}
