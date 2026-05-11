import { eq, and, isNull } from 'drizzle-orm';
import type { DbConnection } from '@/core/db/connection';
import {
  itinerariesTable,
  type DrizzleItinerary,
} from './drizzle.itinerary.schema';
import type { IItineraryRepository } from '../../domain/itinerary.repository';
import { Itinerary } from '../../domain/itinerary.entity';

export class DrizzleItineraryRepository implements IItineraryRepository {
  constructor(private readonly database: DbConnection) {}

  private mapToDomain(row: DrizzleItinerary): Itinerary {
    return Itinerary.reconstitute({
      id: row.id,
      organizationId: row.organizationId,
      degreeId: row.degreeId,
      name: row.name,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    });
  }

  async findById(id: string): Promise<Itinerary | null> {
    const rows = await this.database
      .select()
      .from(itinerariesTable)
      .where(
        and(eq(itinerariesTable.id, id), isNull(itinerariesTable.deletedAt))
      )
      .limit(1);
    return rows[0] ? this.mapToDomain(rows[0]) : null;
  }

  async findAll(degreeId: string): Promise<Itinerary[]> {
    const rows = await this.database
      .select()
      .from(itinerariesTable)
      .where(
        and(
          eq(itinerariesTable.degreeId, degreeId),
          isNull(itinerariesTable.deletedAt)
        )
      );
    return rows.map((row) => this.mapToDomain(row));
  }

  async create(itinerary: Itinerary): Promise<void> {
    await this.database.insert(itinerariesTable).values(itinerary);
  }

  async createMany(itineraries: Itinerary[]): Promise<void> {
    if (itineraries.length === 0) return;
    await this.database.transaction(async (tx) => {
      await tx.insert(itinerariesTable).values(itineraries);
    });
  }

  async update(itinerary: Itinerary): Promise<void> {
    await this.database
      .update(itinerariesTable)
      .set({
        name: itinerary.name,
        updatedAt: new Date(),
      })
      .where(eq(itinerariesTable.id, itinerary.id));
  }

  async delete(id: string): Promise<void> {
    await this.database
      .update(itinerariesTable)
      .set({ deletedAt: new Date() })
      .where(eq(itinerariesTable.id, id));
  }
}
