import { eq, and, isNull, ilike, type SQL } from 'drizzle-orm';
import type { DbConnection } from '@/core/db/connection';
import { ConflictError } from '@/core/errors/app.error';
import { getPostgresErrorCode } from '@/core/db/db-errors';
import {
  itinerariesTable,
  type DrizzleItinerary,
  type NewDrizzleItinerary,
} from './drizzle.itinerary.schema';
import type { IItineraryRepository } from '../../domain/itinerary.repository';
import { Itinerary } from '../../domain/itinerary.entity';
import {
  type ItineraryIdentifierDTO,
  type ItineraryListQueryDTO,
} from '@tfg-horarios/shared';

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

  async findAll(
    organizationId: string,
    filters?: ItineraryListQueryDTO
  ): Promise<Itinerary[]> {
    const conditions: SQL[] = [
      eq(itinerariesTable.organizationId, organizationId),
      isNull(itinerariesTable.deletedAt),
    ];

    if (filters?.search) {
      conditions.push(ilike(itinerariesTable.name, `%${filters.search}%`));
    }
    if (filters?.code) {
      conditions.push(ilike(itinerariesTable.code, `%${filters.code}%`));
    }
    if (filters?.degreeId) {
      conditions.push(eq(itinerariesTable.degreeId, filters.degreeId));
    }

    const rows = await this.database
      .select()
      .from(itinerariesTable)
      .where(and(...conditions));
    return rows.map((row) => this.mapToDomain(row));
  }

  async findIdentifiers(
    organizationId: string
  ): Promise<ItineraryIdentifierDTO[]> {
    const rows = await this.database
      .select({ code: itinerariesTable.code })
      .from(itinerariesTable)
      .where(
        and(
          eq(itinerariesTable.organizationId, organizationId),
          isNull(itinerariesTable.deletedAt)
        )
      );
    return rows.map((r) => r.code);
  }

  async create(itinerary: Itinerary): Promise<void> {
    try {
      await this.database
        .insert(itinerariesTable)
        .values(this.mapToPersistence(itinerary));
    } catch (error: unknown) {
      if (getPostgresErrorCode(error) === '23505') {
        throw new ConflictError(
          `Un itinerario con el código '${itinerary.code}' ya existe en este grado`
        );
      }
      throw error;
    }
  }

  async createMany(itineraries: Itinerary[]): Promise<void> {
    if (itineraries.length === 0) return;
    const valuesToInsert = itineraries.map((i) => this.mapToPersistence(i));
    try {
      await this.database.insert(itinerariesTable).values(valuesToInsert);
    } catch (error: unknown) {
      if (getPostgresErrorCode(error) === '23505') {
        throw new ConflictError(
          'Uno o más itinerarios con el mismo código ya existen en este grado'
        );
      }
      throw error;
    }
  }

  async update(itinerary: Itinerary): Promise<void> {
    const rawData = this.mapToPersistence(itinerary);

    try {
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
    } catch (error: unknown) {
      if (getPostgresErrorCode(error) === '23505') {
        throw new ConflictError(
          `Un itinerario con el código '${itinerary.code}' ya existe en este grado`
        );
      }
      throw error;
    }
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

  async deleteAll(organizationId: string): Promise<void> {
    await this.database
      .update(itinerariesTable)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(itinerariesTable.organizationId, organizationId),
          isNull(itinerariesTable.deletedAt)
        )
      );
  }

  async replace(
    itineraries: Itinerary[],
    organizationId: string
  ): Promise<void> {
    await this.database.transaction(async (tx) => {
      await tx
        .update(itinerariesTable)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(itinerariesTable.organizationId, organizationId),
            isNull(itinerariesTable.deletedAt)
          )
        );

      if (itineraries.length > 0) {
        const valuesToInsert = itineraries.map((i) => this.mapToPersistence(i));
        try {
          await tx.insert(itinerariesTable).values(valuesToInsert);
        } catch (error: unknown) {
          if (getPostgresErrorCode(error) === '23505') {
            throw new ConflictError(
              'Uno o más itinerarios con el mismo código ya existen en este grado'
            );
          }
          throw error;
        }
      }
    });
  }
}
