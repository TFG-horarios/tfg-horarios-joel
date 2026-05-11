import { Itinerary } from './itinerary.entity';

export interface IItineraryRepository {
  findById(id: string): Promise<Itinerary | null>;
  findAll(degreeId: string): Promise<Itinerary[]>;
  create(itinerary: Itinerary): Promise<void>;
  createMany(itineraries: Itinerary[]): Promise<void>;
  update(itinerary: Itinerary): Promise<void>;
  delete(id: string): Promise<void>;
}
