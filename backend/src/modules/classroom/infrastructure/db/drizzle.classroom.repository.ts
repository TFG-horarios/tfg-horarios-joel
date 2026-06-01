import { eq, and, isNull } from 'drizzle-orm';
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

export class DrizzleClassroomRepository implements IClassroomRepository {
  constructor(private readonly database: DbConnection) {}

  private mapToDomain(row: DrizzleClassroom): Classroom {
    return Classroom.reconstitute({
      id: row.id,
      organizationId: row.organizationId,
      name: row.name,
      capacity: row.capacity,
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
    const rows = await this.database
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
    const rows = await this.database
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

  async create(classroom: Classroom): Promise<void> {
    try {
      await this.database
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
      await this.database.insert(classroomsTable).values(valuesToInsert);
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
      await this.database
        .update(classroomsTable)
        .set({
          name: rawData.name,
          capacity: rawData.capacity,
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
    await this.database
      .update(classroomsTable)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(classroomsTable.id, id),
          eq(classroomsTable.organizationId, organizationId)
        )
      );
  }
}
