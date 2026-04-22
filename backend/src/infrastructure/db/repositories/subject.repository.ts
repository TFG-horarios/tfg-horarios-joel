import { eq } from 'drizzle-orm';
import { db } from '../connection';
import { subject, Subject as DrizzleSubject } from '../schema/subject.schema';
import { ISubjectRepository } from '../../../domain/repositories/subject.repository';
import { Subject, ShiftType } from '../../../domain/entities/subject.entity';

export class SubjectRepository implements ISubjectRepository {
  private mapToDomain(row: DrizzleSubject): Subject {
    return Subject.reconstitute({
      id: row.id,
      organizationId: row.organizationId,
      name: row.name,
      code: row.code,
      availableShifts: row.availableShifts as ShiftType[],
      numberOfStudents: row.numberOfStudents,
      courseYear: row.courseYear,
      degree: row.degree,
      period: row.period,
      isCommon: row.isCommon,
      itineraryName: row.itineraryName || undefined,
      weeklyHours: row.weeklyHours,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findById(id: string): Promise<Subject | null> {
    const result = await db.select().from(subject).where(eq(subject.id, id)).limit(1);
    return result.length > 0 ? this.mapToDomain(result[0]) : null;
  }

  async findByOrganizationId(organizationId: string): Promise<Subject[]> {
    const results = await db.select().from(subject).where(eq(subject.organizationId, organizationId));
    return results.map(row => this.mapToDomain(row));
  }

  async save(domainEntity: Subject): Promise<void> {
    const existing = await this.findById(domainEntity.id);
    
    if (existing) {
      await db.update(subject)
        .set({
          name: domainEntity.name,
          code: domainEntity.code,
          availableShifts: domainEntity.availableShifts,
          numberOfStudents: domainEntity.numberOfStudents,
          courseYear: domainEntity.courseYear,
          degree: domainEntity.degree,
          period: domainEntity.period,
          weeklyHours: domainEntity.weeklyHours,
          isCommon: domainEntity.isCommon,
          itineraryName: domainEntity.itineraryName,
          updatedAt: domainEntity.updatedAt,
        })
        .where(eq(subject.id, domainEntity.id));
    } else {
      await db.insert(subject).values({
        id: domainEntity.id,
        organizationId: domainEntity.organizationId,
        name: domainEntity.name,
        code: domainEntity.code,
        availableShifts: domainEntity.availableShifts,
        numberOfStudents: domainEntity.numberOfStudents,
        courseYear: domainEntity.courseYear,
        degree: domainEntity.degree,
        period: domainEntity.period,
        weeklyHours: domainEntity.weeklyHours,
        isCommon: domainEntity.isCommon,
        itineraryName: domainEntity.itineraryName,
        createdAt: domainEntity.createdAt,
        updatedAt: domainEntity.updatedAt,
      });
    }
  }

  async delete(id: string): Promise<void> {
    await db.delete(subject).where(eq(subject.id, id));
  }
}
