import { Itinerary } from './itinerary.entity';

export interface IItineraryRepository {
  findById(id: string, organizationId: string): Promise<Itinerary | null>;
  findAll(organizationId: string): Promise<Itinerary[]>;
  create(itinerary: Itinerary): Promise<void>;
  createMany(itineraries: Itinerary[]): Promise<void>;
  update(itinerary: Itinerary): Promise<void>;
  delete(id: string, organizationId: string): Promise<void>;
}
