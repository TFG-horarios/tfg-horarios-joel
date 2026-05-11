import { eq, and, isNull } from 'drizzle-orm';
import type { DbConnection } from '@/core/db/connection';
import {
  classroom as classroomTable,
  type DrizzleClassroom,
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

  async findById(id: string): Promise<Classroom | null> {
    const rows = await this.database
      .select()
      .from(classroomTable)
      .where(and(eq(classroomTable.id, id), isNull(classroomTable.deletedAt)))
      .limit(1);
    return rows[0] ? this.mapToDomain(rows[0]) : null;
  }

  async findAll(organizationId: string): Promise<Classroom[]> {
    const rows = await this.database
      .select()
      .from(classroomTable)
      .where(
        and(
          eq(classroomTable.organizationId, organizationId),
          isNull(classroomTable.deletedAt)
        )
      );
    return rows.map((row) => this.mapToDomain(row));
  }

  async create(classroom: Classroom): Promise<void> {
    await this.database.insert(classroomTable).values(classroom);
  }

  async createMany(classrooms: Classroom[]): Promise<void> {
    if (classrooms.length === 0) return;
    await this.database.transaction(async (tx) => {
      await tx.insert(classroomTable).values(classrooms);
    });
  }

  async update(classroom: Classroom): Promise<void> {
    await this.database
      .update(classroomTable)
      .set({
        name: classroom.name,
        capacity: classroom.capacity,
        type: classroom.type,
        updatedAt: new Date(),
      })
      .where(eq(classroomTable.id, classroom.id));
  }

  async delete(id: string): Promise<void> {
    await this.database
      .update(classroomTable)
      .set({ deletedAt: new Date() })
      .where(eq(classroomTable.id, id));
  }
}
