import { eq, and, isNull } from 'drizzle-orm';
import type { DbConnection } from '@/core/db/connection';
import {
  subjectGroupsTable,
  type DrizzleSubjectGroup,
  type NewDrizzleSubjectGroup,
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

  private mapToPersistence(domain: SubjectGroup): NewDrizzleSubjectGroup {
    return {
      id: domain.id,
      organizationId: domain.organizationId,
      subjectId: domain.subjectId,
      name: domain.name,
      groupType: domain.groupType,
      shift: domain.shift,
      groupNumber: domain.groupNumber,
      weeklyHours: domain.weeklyHours.toString(),
      numberOfStudents: domain.numberOfStudents,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
      deletedAt: domain.deletedAt,
    };
  }

  async findById(
    id: string,
    organizationId: string
  ): Promise<SubjectGroup | null> {
    const rows = await this.database
      .select()
      .from(subjectGroupsTable)
      .where(
        and(
          eq(subjectGroupsTable.id, id),
          eq(subjectGroupsTable.organizationId, organizationId),
          isNull(subjectGroupsTable.deletedAt)
        )
      )
      .limit(1);
    return rows[0] ? this.mapToDomain(rows[0]) : null;
  }

  async findAll(organizationId: string): Promise<SubjectGroup[]> {
    const rows = await this.database
      .select()
      .from(subjectGroupsTable)
      .where(
        and(
          eq(subjectGroupsTable.organizationId, organizationId),
          isNull(subjectGroupsTable.deletedAt)
        )
      );
    return rows.map((row) => this.mapToDomain(row));
  }

  async create(subjectGroup: SubjectGroup): Promise<void> {
    await this.database
      .insert(subjectGroupsTable)
      .values(this.mapToPersistence(subjectGroup));
  }

  async createMany(subjectGroups: SubjectGroup[]): Promise<void> {
    if (subjectGroups.length === 0) return;
    const valuesToInsert = subjectGroups.map((g) => this.mapToPersistence(g));
    await this.database.transaction(async (tx) => {
      await tx
        .insert(subjectGroupsTable)
        .values(valuesToInsert)
        .onConflictDoNothing();
    });
  }

  async update(subjectGroup: SubjectGroup): Promise<void> {
    const rawData = this.mapToPersistence(subjectGroup);
    await this.database
      .update(subjectGroupsTable)
      .set({
        name: rawData.name,
        groupType: rawData.groupType,
        shift: rawData.shift,
        groupNumber: rawData.groupNumber,
        weeklyHours: rawData.weeklyHours,
        numberOfStudents: rawData.numberOfStudents,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(subjectGroupsTable.id, subjectGroup.id),
          eq(subjectGroupsTable.organizationId, subjectGroup.organizationId)
        )
      );
  }

  async delete(id: string, organizationId: string): Promise<void> {
    await this.database
      .update(subjectGroupsTable)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(subjectGroupsTable.id, id),
          eq(subjectGroupsTable.organizationId, organizationId)
        )
      );
  }
}
