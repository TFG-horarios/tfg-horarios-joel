import { eq, and, isNull } from 'drizzle-orm';
import type { DbConnection } from '@/core/db/connection';
import {
  subjectGroupsTable,
  type DrizzleSubjectGroup,
} from './drizzle.subject-group.schema';
import type { ISubjectGroupRepository } from '../../domain/subject-group.repository';
import {
  SubjectGroup,
  type GroupType,
  type Shift,
} from '../../domain/subject-group.entity';

export class DrizzleSubjectGroupRepository implements ISubjectGroupRepository {
  constructor(private readonly database: DbConnection) {}

  private mapToDomain(row: DrizzleSubjectGroup): SubjectGroup {
    return SubjectGroup.reconstitute({
      id: row.id,
      organizationId: row.organizationId,
      subjectId: row.subjectId,
      name: row.name,
      groupType: row.groupType as GroupType,
      shift: row.shift as Shift,
      groupNumber: row.groupNumber,
      weeklyHours: Number(row.weeklyHours),
      numberOfStudents: row.numberOfStudents,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    });
  }

  async findById(id: string): Promise<SubjectGroup | null> {
    const rows = await this.database
      .select()
      .from(subjectGroupsTable)
      .where(
        and(eq(subjectGroupsTable.id, id), isNull(subjectGroupsTable.deletedAt))
      )
      .limit(1);
    return rows[0] ? this.mapToDomain(rows[0]) : null;
  }

  async findAll(subjectId: string): Promise<SubjectGroup[]> {
    const rows = await this.database
      .select()
      .from(subjectGroupsTable)
      .where(
        and(
          eq(subjectGroupsTable.subjectId, subjectId),
          isNull(subjectGroupsTable.deletedAt)
        )
      );
    return rows.map((row) => this.mapToDomain(row));
  }

  async create(subjectGroup: SubjectGroup): Promise<void> {
    await this.database.insert(subjectGroupsTable).values({
      ...subjectGroup,
      weeklyHours: subjectGroup.weeklyHours.toString(),
    } as any);
  }

  async createMany(subjectGroups: SubjectGroup[]): Promise<void> {
    if (subjectGroups.length === 0) return;
    const values = subjectGroups.map((g) => ({
      ...g,
      weeklyHours: g.weeklyHours.toString(),
    }));
    await this.database.transaction(async (tx) => {
      await tx.insert(subjectGroupsTable).values(values as any);
    });
  }

  async update(subjectGroup: SubjectGroup): Promise<void> {
    await this.database
      .update(subjectGroupsTable)
      .set({
        name: subjectGroup.name,
        groupType: subjectGroup.groupType,
        shift: subjectGroup.shift,
        groupNumber: subjectGroup.groupNumber,
        weeklyHours: subjectGroup.weeklyHours.toString(),
        numberOfStudents: subjectGroup.numberOfStudents,
        updatedAt: new Date(),
      })
      .where(eq(subjectGroupsTable.id, subjectGroup.id));
  }

  async delete(id: string): Promise<void> {
    await this.database
      .update(subjectGroupsTable)
      .set({ deletedAt: new Date() })
      .where(eq(subjectGroupsTable.id, id));
  }
}
