import { eq, and, isNull } from 'drizzle-orm';
import type { DbConnection } from '@/core/db/connection';
import { ConflictError } from '@/core/errors/app.error';
import { getPostgresErrorCode } from '@/core/db/db-errors';
import {
  subjectsTable,
  type DrizzleSubject,
  type NewDrizzleSubject,
} from './drizzle.subject.schema';
import type { ISubjectRepository } from '../../domain/subject.repository';
import { Subject, type Shift } from '../../domain/subject.entity';
import type { SubjectIdentifierDTO } from '@tfg-horarios/shared';

export class DrizzleSubjectRepository implements ISubjectRepository {
  constructor(private readonly database: DbConnection) {}

  private mapToDomain(row: DrizzleSubject): Subject {
    return Subject.reconstitute({
      id: row.id,
      organizationId: row.organizationId,
      degreeId: row.degreeId,
      itineraryId: row.itineraryId,
      name: row.name,
      code: row.code,
      availableShifts: row.availableShifts as Shift[],
      numberOfStudents: row.numberOfStudents,
      courseYear: row.courseYear,
      period: row.period,
      weeklyHours: row.weeklyHours,
      isCommon: row.isCommon,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    });
  }

  private mapToPersistence(domain: Subject): NewDrizzleSubject {
    return {
      id: domain.id,
      organizationId: domain.organizationId,
      degreeId: domain.degreeId,
      itineraryId: domain.itineraryId,
      name: domain.name,
      code: domain.code,
      availableShifts: domain.availableShifts,
      numberOfStudents: domain.numberOfStudents,
      courseYear: domain.courseYear,
      period: domain.period,
      weeklyHours: domain.weeklyHours,
      isCommon: domain.isCommon,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
      deletedAt: domain.deletedAt,
    };
  }

  async findById(id: string, organizationId: string): Promise<Subject | null> {
    const rows = await this.database
      .select()
      .from(subjectsTable)
      .where(
        and(
          eq(subjectsTable.id, id),
          eq(subjectsTable.organizationId, organizationId),
          isNull(subjectsTable.deletedAt)
        )
      )
      .limit(1);
    return rows[0] ? this.mapToDomain(rows[0]) : null;
  }

  async findAll(organizationId: string): Promise<Subject[]> {
    const conditions = [
      eq(subjectsTable.organizationId, organizationId),
      isNull(subjectsTable.deletedAt),
    ];

    const rows = await this.database
      .select()
      .from(subjectsTable)
      .where(and(...conditions));
    return rows.map((row) => this.mapToDomain(row));
  }

  async findIdentifiers(
    organizationId: string
  ): Promise<SubjectIdentifierDTO[]> {
    const rows = await this.database
      .select({ code: subjectsTable.code })
      .from(subjectsTable)
      .where(
        and(
          eq(subjectsTable.organizationId, organizationId),
          isNull(subjectsTable.deletedAt)
        )
      );
    return rows.map((r) => r.code);
  }

  async create(subject: Subject): Promise<void> {
    try {
      await this.database
        .insert(subjectsTable)
        .values(this.mapToPersistence(subject));
    } catch (error: unknown) {
      if (getPostgresErrorCode(error) === '23505') {
        throw new ConflictError(
          `Una asignatura con el código '${subject.code}' ya existe en esta organización`
        );
      }
      throw error;
    }
  }

  async createMany(subjects: Subject[]): Promise<void> {
    if (subjects.length === 0) return;
    const valuesToInsert = subjects.map((s) => this.mapToPersistence(s));
    try {
      await this.database.insert(subjectsTable).values(valuesToInsert);
    } catch (error: unknown) {
      if (getPostgresErrorCode(error) === '23505') {
        throw new ConflictError(
          'Una o más asignaturas con el mismo código ya existen en esta organización'
        );
      }
      throw error;
    }
  }

  async update(subject: Subject): Promise<void> {
    const rawData = this.mapToPersistence(subject);
    try {
      await this.database
        .update(subjectsTable)
        .set({
          name: rawData.name,
          code: rawData.code,
          itineraryId: rawData.itineraryId,
          availableShifts: rawData.availableShifts,
          numberOfStudents: rawData.numberOfStudents,
          courseYear: rawData.courseYear,
          period: rawData.period,
          weeklyHours: rawData.weeklyHours,
          isCommon: rawData.isCommon,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(subjectsTable.id, subject.id),
            eq(subjectsTable.organizationId, subject.organizationId)
          )
        );
    } catch (error: unknown) {
      if (getPostgresErrorCode(error) === '23505') {
        throw new ConflictError(
          `Una asignatura con el código '${subject.code}' ya existe en esta organización`
        );
      }
      throw error;
    }
  }

  async delete(id: string, organizationId: string): Promise<void> {
    await this.database
      .update(subjectsTable)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(subjectsTable.id, id),
          eq(subjectsTable.organizationId, organizationId)
        )
      );
  }

  async deleteAll(organizationId: string): Promise<void> {
    await this.database
      .update(subjectsTable)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(subjectsTable.organizationId, organizationId),
          isNull(subjectsTable.deletedAt)
        )
      );
  }

  async replace(subjects: Subject[], organizationId: string): Promise<void> {
    await this.database.transaction(async (tx) => {
      await tx
        .update(subjectsTable)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(subjectsTable.organizationId, organizationId),
            isNull(subjectsTable.deletedAt)
          )
        );

      if (subjects.length > 0) {
        const valuesToInsert = subjects.map((s) => this.mapToPersistence(s));
        try {
          await tx.insert(subjectsTable).values(valuesToInsert);
        } catch (error: unknown) {
          if (getPostgresErrorCode(error) === '23505') {
            throw new ConflictError(
              'One or more subjects with the same code already exist in this organization'
            );
          }
          throw error;
        }
      }
    });
  }
}
