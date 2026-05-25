import { eq, and, isNull } from 'drizzle-orm';
import type { DbConnection } from '@/core/db/connection';
import {
  itinerariesTable,
  type DrizzleItinerary,
  type NewDrizzleItinerary,
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
      code: row.code,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    });
  }

  private mapToPersistence(domain: Itinerary): NewDrizzleItinerary {
    return {
      id: domain.id,
      organizationId: domain.organizationId,
      degreeId: domain.degreeId,
      name: domain.name,
      code: domain.code,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
      deletedAt: domain.deletedAt,
    };
  }

  async findById(
    id: string,
    organizationId: string
  ): Promise<Itinerary | null> {
    const rows = await this.database
      .select()
      .from(itinerariesTable)
      .where(
        and(
          eq(itinerariesTable.id, id),
          eq(itinerariesTable.organizationId, organizationId),
          isNull(itinerariesTable.deletedAt)
        )
      )
      .limit(1);
    return rows[0] ? this.mapToDomain(rows[0]) : null;
  }

  async findAll(organizationId: string): Promise<Itinerary[]> {
    const rows = await this.database
      .select()
      .from(itinerariesTable)
      .where(
        and(
          eq(itinerariesTable.organizationId, organizationId),
          isNull(itinerariesTable.deletedAt)
        )
      );
    return rows.map((row) => this.mapToDomain(row));
  }

  async create(itinerary: Itinerary): Promise<void> {
    await this.database
      .insert(itinerariesTable)
      .values(this.mapToPersistence(itinerary));
  }

  async createMany(itineraries: Itinerary[]): Promise<void> {
    if (itineraries.length === 0) return;
    const valuesToInsert = itineraries.map((i) => this.mapToPersistence(i));
    await this.database.transaction(async (tx) => {
      await tx
        .insert(itinerariesTable)
        .values(valuesToInsert)
        .onConflictDoNothing();
    });
  }

  async update(itinerary: Itinerary): Promise<void> {
    const rawData = this.mapToPersistence(itinerary);

    await this.database
      .update(itinerariesTable)
      .set({
        name: rawData.name,
        code: rawData.code,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(itinerariesTable.id, itinerary.id),
          eq(itinerariesTable.organizationId, itinerary.organizationId)
        )
      );
  }

  async delete(id: string, organizationId: string): Promise<void> {
    await this.database
      .update(itinerariesTable)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(itinerariesTable.id, id),
          eq(itinerariesTable.organizationId, organizationId)
        )
      );
  }
}
