import {
  eq,
  and,
  isNull,
  ilike,
  arrayContains,
  count,
  type SQL,
} from 'drizzle-orm';
import type { DbConnection } from '@/core/db/connection';
import { ConflictError } from '@/core/errors/app.error';
import { getPostgresErrorCode } from '@/core/db/db-errors';
import {
  subjectsTable,
  type DrizzleSubject,
  type NewDrizzleSubject,
} from './drizzle.subject.schema';
import type { ISubjectRepository } from '../../domain/subject.repository';
import { Subject } from '../../domain/subject.entity';
import { subjectGroupsTable } from '@/modules/subject-group/infrastructure/db/drizzle.subject-group.schema';
import type {
  Shift,
  SubjectIdentifierDTO,
  SubjectListQueryDTO,
  PaginatedResponse,
} from '@tfg-horarios/shared';

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

  async findAll(
    organizationId: string,
    includeSoftDelete = false
  ): Promise<Subject[]> {
    const rows = await this.database
      .select()
      .from(subjectsTable)
      .where(
        includeSoftDelete
          ? eq(subjectsTable.organizationId, organizationId)
          : and(
              eq(subjectsTable.organizationId, organizationId),
              isNull(subjectsTable.deletedAt)
            )
      );
    return rows.map((row) => this.mapToDomain(row));
  }

  async findPaginated(
    organizationId: string,
    filters?: SubjectListQueryDTO
  ): Promise<PaginatedResponse<Subject>> {
    const conditions: SQL[] = [
      eq(subjectsTable.organizationId, organizationId),
      isNull(subjectsTable.deletedAt),
    ];

    if (filters?.search) {
      conditions.push(ilike(subjectsTable.name, `%${filters.search}%`));
    }
    if (filters?.code) {
      conditions.push(ilike(subjectsTable.code, `%${filters.code}%`));
    }
    if (filters?.degreeId) {
      conditions.push(eq(subjectsTable.degreeId, filters.degreeId));
    }
    if (filters?.courseYear !== undefined) {
      conditions.push(eq(subjectsTable.courseYear, filters.courseYear));
    }
    if (filters?.period !== undefined) {
      conditions.push(eq(subjectsTable.period, filters.period));
    }
    if (filters?.shift) {
      conditions.push(
        arrayContains(subjectsTable.availableShifts, [filters.shift])
      );
    }
    if (filters?.itineraryId) {
      if (filters.itineraryId === 'common') {
        conditions.push(eq(subjectsTable.isCommon, true));
      } else {
        conditions.push(eq(subjectsTable.itineraryId, filters.itineraryId));
      }
    }

    const countResult = await this.database
      .select({ total: count() })
      .from(subjectsTable)
      .where(and(...conditions));
    const total = countResult[0]?.total ?? 0;

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 100;
    const offset = (page - 1) * limit;

    const rows = await this.database
      .select()
      .from(subjectsTable)
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

  async delete(
    id: string,
    organizationId: string,
    externalTx?: any
  ): Promise<void> {
    const execute = async (tx: any) => {
      await tx
        .update(subjectsTable)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(subjectsTable.id, id),
            eq(subjectsTable.organizationId, organizationId)
          )
        );

      await tx
        .update(subjectGroupsTable)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(subjectGroupsTable.subjectId, id),
            eq(subjectGroupsTable.organizationId, organizationId),
            isNull(subjectGroupsTable.deletedAt)
          )
        );
    };
    if (externalTx) return execute(externalTx);
    await this.database.transaction(execute);
  }

  async deleteAll(organizationId: string, externalTx?: any): Promise<void> {
    const execute = async (tx: any) => {
      await tx
        .update(subjectsTable)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(subjectsTable.organizationId, organizationId),
            isNull(subjectsTable.deletedAt)
          )
        );

      await tx
        .update(subjectGroupsTable)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(subjectGroupsTable.organizationId, organizationId),
            isNull(subjectGroupsTable.deletedAt)
          )
        );
    };
    if (externalTx) return execute(externalTx);
    await this.database.transaction(execute);
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

      await tx
        .update(subjectGroupsTable)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(subjectGroupsTable.organizationId, organizationId),
            isNull(subjectGroupsTable.deletedAt)
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
