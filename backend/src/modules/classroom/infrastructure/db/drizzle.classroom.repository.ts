import { eq, and, isNull, ilike, gte, lte, count, type SQL } from 'drizzle-orm';
import type { DbConnection } from '@/core/db/connection';
import { ConflictError } from '@/core/errors/app.error';
import { getPostgresErrorCode } from '@/core/db/db-errors';
import {
  classroomsTable,
  type DrizzleClassroom,
  type DrizzleNewClassroom,
} from './drizzle.classroom.schema';
import type { IClassroomRepository } from '../../domain/classroom.repository';
import { Classroom } from '../../domain/classroom.entity';
import {
  type ClassroomIdentifierDTO,
  type ClassroomListQueryDTO,
  type PaginatedResponse,
} from '@tfg-horarios/shared';

export class DrizzleClassroomRepository implements IClassroomRepository {
  constructor(private readonly db: DbConnection) {}

  private mapToDomain(row: DrizzleClassroom): Classroom {
    return Classroom.reconstitute({
      id: row.id,
      organizationId: row.organizationId,
      name: row.name,
      capacity: row.capacity,
      floor: row.floor,
      type: row.type,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    });
  }

  private mapToPersistence(classroom: Classroom): DrizzleNewClassroom {
    return {
      id: classroom.id,
      organizationId: classroom.organizationId,
      name: classroom.name,
      capacity: classroom.capacity,
      floor: classroom.floor,
      type: classroom.type,
      createdAt: classroom.createdAt,
      updatedAt: classroom.updatedAt,
      deletedAt: classroom.deletedAt,
    };
  }

  async findById(
    id: string,
    organizationId: string
  ): Promise<Classroom | null> {
    const rows = await this.db
      .select()
      .from(classroomsTable)
      .where(
        and(
          eq(classroomsTable.id, id),
          eq(classroomsTable.organizationId, organizationId),
          isNull(classroomsTable.deletedAt)
        )
      )
      .limit(1);
    return rows[0] ? this.mapToDomain(rows[0]) : null;
  }

  async findAll(organizationId: string): Promise<Classroom[]> {
    const rows = await this.db
      .select()
      .from(classroomsTable)
      .where(
        and(
          eq(classroomsTable.organizationId, organizationId),
          isNull(classroomsTable.deletedAt)
        )
      );
    return rows.map((row) => this.mapToDomain(row));
  }

  async findPaginated(
    organizationId: string,
    filters?: ClassroomListQueryDTO
  ): Promise<PaginatedResponse<Classroom>> {
    const conditions: SQL[] = [
      eq(classroomsTable.organizationId, organizationId),
      isNull(classroomsTable.deletedAt),
    ];

    if (filters?.search) {
      conditions.push(ilike(classroomsTable.name, `%${filters.search}%`));
    }
    if (filters?.type) {
      conditions.push(eq(classroomsTable.type, filters.type));
    }
    if (filters?.minCapacity) {
      conditions.push(gte(classroomsTable.capacity, filters.minCapacity));
    }
    if (filters?.maxCapacity) {
      conditions.push(lte(classroomsTable.capacity, filters.maxCapacity));
    }

    const totalResult = await this.db
      .select({ value: count() })
      .from(classroomsTable)
      .where(and(...conditions));
    const total = totalResult[0]?.value ?? 0;

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const totalPages = Math.ceil(total / limit);

    const rows = await this.db
      .select()
      .from(classroomsTable)
      .where(and(...conditions))
      .limit(limit)
      .offset((page - 1) * limit);

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
  ): Promise<ClassroomIdentifierDTO[]> {
    const rows = await this.db
      .select({ name: classroomsTable.name })
      .from(classroomsTable)
      .where(
        and(
          eq(classroomsTable.organizationId, organizationId),
          isNull(classroomsTable.deletedAt)
        )
      );
    return rows.map((r) => r.name);
  }

  async create(classroom: Classroom): Promise<void> {
    try {
      await this.db
        .insert(classroomsTable)
        .values(this.mapToPersistence(classroom));
    } catch (error: unknown) {
      if (getPostgresErrorCode(error) === '23505') {
        throw new ConflictError(
          `Classroom with name '${classroom.name}' already exists in this organization`
        );
      }
      throw error;
    }
  }

  async createMany(classrooms: Classroom[]): Promise<void> {
    if (classrooms.length === 0) return;
    const valuesToInsert = classrooms.map((c) => this.mapToPersistence(c));
    try {
      await this.db.insert(classroomsTable).values(valuesToInsert);
    } catch (error: unknown) {
      if (getPostgresErrorCode(error) === '23505') {
        throw new ConflictError(
          'One or more classrooms with the same name already exist in this organization'
        );
      }
      throw error;
    }
  }

  async update(classroom: Classroom): Promise<void> {
    const rawData = this.mapToPersistence(classroom);
    try {
      await this.db
        .update(classroomsTable)
        .set({
          name: rawData.name,
          capacity: rawData.capacity,
          floor: rawData.floor,
          type: rawData.type,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(classroomsTable.id, classroom.id),
            eq(classroomsTable.organizationId, classroom.organizationId)
          )
        );
    } catch (error: unknown) {
      if (getPostgresErrorCode(error) === '23505') {
        throw new ConflictError(
          `Classroom with name '${classroom.name}' already exists in this organization`
        );
      }
      throw error;
    }
  }

  async delete(id: string, organizationId: string): Promise<void> {
    await this.db
      .update(classroomsTable)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(classroomsTable.id, id),
          eq(classroomsTable.organizationId, organizationId)
        )
      );
  }

  async deleteAll(organizationId: string): Promise<void> {
    await this.db
      .update(classroomsTable)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(classroomsTable.organizationId, organizationId),
          isNull(classroomsTable.deletedAt)
        )
      );
  }

  async replace(
    classrooms: Classroom[],
    organizationId: string
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .update(classroomsTable)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(classroomsTable.organizationId, organizationId),
            isNull(classroomsTable.deletedAt)
          )
        );

      if (classrooms.length > 0) {
        const valuesToInsert = classrooms.map((c) => this.mapToPersistence(c));
        try {
          await tx.insert(classroomsTable).values(valuesToInsert);
        } catch (error: unknown) {
          if (getPostgresErrorCode(error) === '23505') {
            throw new ConflictError(
              'One or more classrooms with the same name already exist in this organization'
            );
          }
          throw error;
        }
      }
    });
  }
}
