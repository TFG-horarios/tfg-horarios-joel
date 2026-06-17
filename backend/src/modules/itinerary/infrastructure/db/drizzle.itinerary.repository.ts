import { eq, and, isNull, isNotNull, inArray, ilike, count, type SQL } from 'drizzle-orm';
import type { DbConnection } from '@/core/db/connection';
import { ConflictError } from '@/core/errors/app.error';
import { getPostgresErrorCode } from '@/core/db/db-errors';
import {
  itinerariesTable,
  type DrizzleItinerary,
  type NewDrizzleItinerary,
} from './drizzle.itinerary.schema';
import { subjectsTable } from '@/modules/subject/infrastructure/db/drizzle.subject.schema';
import { subjectGroupsTable } from '@/modules/subject-group/infrastructure/db/drizzle.subject-group.schema';
import type { IItineraryRepository } from '../../domain/itinerary.repository';
import { Itinerary } from '../../domain/itinerary.entity';
import {
  type ItineraryIdentifierDTO,
  type ItineraryListQueryDTO,
  type PaginatedResponse,
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

  async findPaginated(
    organizationId: string,
    filters?: ItineraryListQueryDTO
  ): Promise<PaginatedResponse<Itinerary>> {
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

    const countResult = await this.database
      .select({ total: count() })
      .from(itinerariesTable)
      .where(and(...conditions));
    const total = countResult[0]?.total ?? 0;

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 100;
    const offset = (page - 1) * limit;

    const rows = await this.database
      .select()
      .from(itinerariesTable)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(total / limit);

    return {
      data: rows.map((row) => this.mapToDomain(row)),
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
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
    await this.database.transaction(async (tx) => {
      await tx
        .update(itinerariesTable)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(itinerariesTable.id, id),
            eq(itinerariesTable.organizationId, organizationId)
          )
        );

      const relatedSubjects = await tx
        .select({ id: subjectsTable.id })
        .from(subjectsTable)
        .where(
          and(
            eq(subjectsTable.itineraryId, id),
            eq(subjectsTable.organizationId, organizationId),
            isNull(subjectsTable.deletedAt)
          )
        );

      if (relatedSubjects.length > 0) {
        const subjectIds = relatedSubjects.map((s) => s.id);

        await tx
          .update(subjectsTable)
          .set({ deletedAt: new Date() })
          .where(
            and(
              inArray(subjectsTable.id, subjectIds),
              eq(subjectsTable.organizationId, organizationId)
            )
          );

        await tx
          .update(subjectGroupsTable)
          .set({ deletedAt: new Date() })
          .where(
            and(
              inArray(subjectGroupsTable.subjectId, subjectIds),
              eq(subjectGroupsTable.organizationId, organizationId),
              isNull(subjectGroupsTable.deletedAt)
            )
          );
      }
    });
  }

  async deleteAll(organizationId: string): Promise<void> {
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

      const relatedSubjects = await tx
        .select({ id: subjectsTable.id })
        .from(subjectsTable)
        .where(
          and(
            eq(subjectsTable.organizationId, organizationId),
            isNotNull(subjectsTable.itineraryId),
            isNull(subjectsTable.deletedAt)
          )
        );

      if (relatedSubjects.length > 0) {
        const subjectIds = relatedSubjects.map((s) => s.id);

        await tx
          .update(subjectsTable)
          .set({ deletedAt: new Date() })
          .where(
            and(
              inArray(subjectsTable.id, subjectIds),
              eq(subjectsTable.organizationId, organizationId)
            )
          );

        await tx
          .update(subjectGroupsTable)
          .set({ deletedAt: new Date() })
          .where(
            and(
              inArray(subjectGroupsTable.subjectId, subjectIds),
              eq(subjectGroupsTable.organizationId, organizationId),
              isNull(subjectGroupsTable.deletedAt)
            )
          );
      }
    });
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

      const relatedSubjects = await tx
        .select({ id: subjectsTable.id })
        .from(subjectsTable)
        .where(
          and(
            eq(subjectsTable.organizationId, organizationId),
            isNotNull(subjectsTable.itineraryId),
            isNull(subjectsTable.deletedAt)
          )
        );

      if (relatedSubjects.length > 0) {
        const subjectIds = relatedSubjects.map((s) => s.id);

        await tx
          .update(subjectsTable)
          .set({ deletedAt: new Date() })
          .where(
            and(
              inArray(subjectsTable.id, subjectIds),
              eq(subjectsTable.organizationId, organizationId)
            )
          );

        await tx
          .update(subjectGroupsTable)
          .set({ deletedAt: new Date() })
          .where(
            and(
              inArray(subjectGroupsTable.subjectId, subjectIds),
              eq(subjectGroupsTable.organizationId, organizationId),
              isNull(subjectGroupsTable.deletedAt)
            )
          );
      }

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
