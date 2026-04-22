import { eq } from 'drizzle-orm';
import { db } from '../connection';
import { subjectGroup, SubjectGroup as DrizzleSubjectGroup } from '../schema/subject-group.schema';
import { ISubjectGroupRepository } from '../../../domain/repositories/subject-group.repository';
import { SubjectGroup, GroupType } from '../../../domain/entities/subject-group.entity';
import { ShiftType } from '../../../domain/entities/subject.entity';

export class SubjectGroupRepository implements ISubjectGroupRepository {
  private mapToDomain(row: DrizzleSubjectGroup): SubjectGroup {
    return SubjectGroup.reconstitute({
      id: row.id,
      subjectId: row.subjectId,
      name: row.name,
      groupType: row.groupType as GroupType,
      shift: row.shift as ShiftType,
      groupNumber: row.groupNumber,
      weeklyHours: Number(row.weeklyHours),
      numberOfStudents: row.numberOfStudents,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findById(id: string): Promise<SubjectGroup | null> {
    const result = await db.select().from(subjectGroup).where(eq(subjectGroup.id, id)).limit(1);
    return result.length > 0 ? this.mapToDomain(result[0]) : null;
  }

  async findBySubjectId(subjectId: string): Promise<SubjectGroup[]> {
    const results = await db.select().from(subjectGroup).where(eq(subjectGroup.subjectId, subjectId));
    return results.map(row => this.mapToDomain(row));
  }

  async save(domainEntity: SubjectGroup): Promise<void> {
    const existing = await this.findById(domainEntity.id);
    
    if (existing) {
      await db.update(subjectGroup)
        .set({
          name: domainEntity.name,
          groupType: domainEntity.groupType,
          shift: domainEntity.shift,
          groupNumber: domainEntity.groupNumber,
          weeklyHours: domainEntity.weeklyHours.toString(),
          numberOfStudents: domainEntity.numberOfStudents,
          updatedAt: domainEntity.updatedAt,
        })
        .where(eq(subjectGroup.id, domainEntity.id));
    } else {
      await db.insert(subjectGroup).values({
        id: domainEntity.id,
        subjectId: domainEntity.subjectId,
        name: domainEntity.name,
        groupType: domainEntity.groupType,
        shift: domainEntity.shift,
        groupNumber: domainEntity.groupNumber,
        weeklyHours: domainEntity.weeklyHours.toString(),
        numberOfStudents: domainEntity.numberOfStudents,
        createdAt: domainEntity.createdAt,
        updatedAt: domainEntity.updatedAt,
      });
    }
  }

  async delete(id: string): Promise<void> {
    await db.delete(subjectGroup).where(eq(subjectGroup.id, id));
  }
}
