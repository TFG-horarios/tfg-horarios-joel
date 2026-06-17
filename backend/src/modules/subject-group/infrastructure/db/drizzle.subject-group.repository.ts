import {
  eq,
  and,
  or,
  isNull,
  inArray,
  ilike,
  count,
  type SQL,
} from 'drizzle-orm';
import type { DbConnection } from '@/core/db/connection';
import { ConflictError } from '@/core/errors/app.error';
import { getPostgresErrorCode } from '@/core/db/db-errors';
import {
  subjectGroupsTable,
  type DrizzleSubjectGroup,
  type NewDrizzleSubjectGroup,
} from './drizzle.subject-group.schema';
import { subjectsTable } from '@/modules/subject/infrastructure/db/drizzle.subject.schema';
import { itinerariesTable } from '@/modules/itinerary/infrastructure/db/drizzle.itinerary.schema';
import type {
  ISubjectGroupRepository,
  GroupWithSubjectAndItinerary,
} from '../../domain/subject-group.repository';
import { SubjectGroup } from '../../domain/subject-group.entity';
import type {
  SubjectGroupIdentifierDTO,
  SubjectGroupListQueryDTO,
  PaginatedResponse,
  GroupType,
  Shift,
} from '@tfg-horarios/shared';

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

  async findPaginated(
    organizationId: string,
    filters?: SubjectGroupListQueryDTO
  ): Promise<PaginatedResponse<SubjectGroup>> {
    const conditions: SQL[] = [
      eq(subjectGroupsTable.organizationId, organizationId),
      isNull(subjectGroupsTable.deletedAt),
    ];

    if (filters?.search) {
      conditions.push(ilike(subjectGroupsTable.name, `%${filters.search}%`));
    }
    if (filters?.subjectId) {
      conditions.push(eq(subjectGroupsTable.subjectId, filters.subjectId));
    }
    if (filters?.shift) {
      conditions.push(eq(subjectGroupsTable.shift, filters.shift));
    }
    if (filters?.groupType) {
      conditions.push(eq(subjectGroupsTable.groupType, filters.groupType));
    }

    let countQuery = this.database
      .select({ total: count() })
      .from(subjectGroupsTable)
      .$dynamic();

    let dataQuery = this.database
      .select({ subjectGroup: subjectGroupsTable })
      .from(subjectGroupsTable)
      .$dynamic();

    if (
      filters?.degreeId ||
      filters?.itineraryId ||
      filters?.term ||
      filters?.year
    ) {
      const joinCondition = and(
        eq(subjectGroupsTable.subjectId, subjectsTable.id),
        isNull(subjectsTable.deletedAt)
      );

      countQuery = countQuery.innerJoin(subjectsTable, joinCondition);
      dataQuery = dataQuery.innerJoin(subjectsTable, joinCondition);

      if (filters?.degreeId) {
        conditions.push(eq(subjectsTable.degreeId, filters.degreeId));
      }
      if (filters?.itineraryId) {
        if (filters.itineraryId === 'common') {
          conditions.push(eq(subjectsTable.isCommon, true));
        } else {
          conditions.push(eq(subjectsTable.itineraryId, filters.itineraryId));
        }
      }
      if (filters?.term) {
        conditions.push(eq(subjectsTable.period, filters.term));
      }
      if (filters?.year) {
        conditions.push(eq(subjectsTable.courseYear, filters.year));
      }
    }

    const countResult = await countQuery.where(and(...conditions));
    const total = countResult[0]?.total ?? 0;

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 100;
    const offset = (page - 1) * limit;

    const rows = await dataQuery
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(total / limit);

    return {
      data: rows.map((row) => this.mapToDomain(row.subjectGroup)),
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
  ): Promise<SubjectGroupIdentifierDTO[]> {
    const rows = await this.database
      .select({
        subjectId: subjectGroupsTable.subjectId,
        shift: subjectGroupsTable.shift,
        groupType: subjectGroupsTable.groupType,
        weeklyHours: subjectGroupsTable.weeklyHours,
        groupNumber: subjectGroupsTable.groupNumber,
        numberOfStudents: subjectGroupsTable.numberOfStudents,
      })
      .from(subjectGroupsTable)
      .where(
        and(
          eq(subjectGroupsTable.organizationId, organizationId),
          isNull(subjectGroupsTable.deletedAt)
        )
      );

    return rows.map((r) => ({
      subjectId: r.subjectId,
      shift: r.shift as Shift,
      groupType: r.groupType as GroupType,
      weeklyHours: Number(r.weeklyHours),
      groupNumber: r.groupNumber,
      numberOfStudents: r.numberOfStudents,
    }));
  }

  async create(subjectGroup: SubjectGroup): Promise<void> {
    try {
      await this.database
        .insert(subjectGroupsTable)
        .values(this.mapToPersistence(subjectGroup));
    } catch (error: unknown) {
      if (getPostgresErrorCode(error) === '23505') {
        throw new ConflictError(
          'A group with this type, number, and shift already exists for this subject.'
        );
      }
      throw error;
    }
  }

  async createMany(subjectGroups: SubjectGroup[]): Promise<void> {
    if (subjectGroups.length === 0) return;
    const valuesToInsert = subjectGroups.map((g) => this.mapToPersistence(g));
    try {
      await this.database.insert(subjectGroupsTable).values(valuesToInsert);
    } catch (error: unknown) {
      if (getPostgresErrorCode(error) === '23505') {
        throw new ConflictError(
          'One or more groups with the same type, number, and shift already exist for these subjects.'
        );
      }
      throw error;
    }
  }

  async update(subjectGroup: SubjectGroup): Promise<void> {
    const rawData = this.mapToPersistence(subjectGroup);
    try {
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
    } catch (error: unknown) {
      if (getPostgresErrorCode(error) === '23505') {
        throw new ConflictError(
          'A group with this type, number, and shift already exists for this subject.'
        );
      }
      throw error;
    }
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

  async deleteAll(organizationId: string): Promise<void> {
    await this.database
      .update(subjectGroupsTable)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(subjectGroupsTable.organizationId, organizationId),
          isNull(subjectGroupsTable.deletedAt)
        )
      );
  }

  async replace(
    subjectGroups: SubjectGroup[],
    organizationId: string
  ): Promise<void> {
    await this.database.transaction(async (tx) => {
      await tx
        .update(subjectGroupsTable)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(subjectGroupsTable.organizationId, organizationId),
            isNull(subjectGroupsTable.deletedAt)
          )
        );

      if (subjectGroups.length > 0) {
        const valuesToInsert = subjectGroups.map((g) =>
          this.mapToPersistence(g)
        );
        try {
          await tx.insert(subjectGroupsTable).values(valuesToInsert);
        } catch (error: unknown) {
          if (getPostgresErrorCode(error) === '23505') {
            throw new ConflictError(
              'One or more groups with the same type, number, and shift already exist for these subjects.'
            );
          }
          throw error;
        }
      }
    });
  }

  async findGroupsWithSubjectsInScope(
    organizationId: string,
    period: number,
    degreeIds: string[],
    itineraryIds?: string[],
    courseYears?: number[]
  ): Promise<GroupWithSubjectAndItinerary[]> {
    if (degreeIds.length === 0) return [];

    const queryConditions = [
      eq(subjectsTable.organizationId, organizationId),
      eq(subjectsTable.period, period),
      isNull(subjectsTable.deletedAt),
      isNull(subjectGroupsTable.deletedAt),
      inArray(subjectsTable.degreeId, degreeIds),
    ];

    if (itineraryIds && itineraryIds.length > 0) {
      queryConditions.push(
        or(
          inArray(subjectsTable.itineraryId, itineraryIds),
          eq(subjectsTable.isCommon, true)
        )!
      );
    }

    if (courseYears && courseYears.length > 0) {
      queryConditions.push(inArray(subjectsTable.courseYear, courseYears));
    }

    const rows = await this.database
      .select({
        id: subjectGroupsTable.id,
        subjectId: subjectGroupsTable.subjectId,
        groupType: subjectGroupsTable.groupType,
        shift: subjectGroupsTable.shift,
        groupNumber: subjectGroupsTable.groupNumber,
        weeklyHours: subjectGroupsTable.weeklyHours,
        numberOfStudents: subjectGroupsTable.numberOfStudents,
        isCommon: subjectsTable.isCommon,
        itineraryName: itinerariesTable.name,
        itineraryId: subjectsTable.itineraryId,
        degreeId: subjectsTable.degreeId,
        courseYear: subjectsTable.courseYear,
      })
      .from(subjectGroupsTable)
      .innerJoin(
        subjectsTable,
        eq(subjectGroupsTable.subjectId, subjectsTable.id)
      )
      .leftJoin(
        itinerariesTable,
        eq(subjectsTable.itineraryId, itinerariesTable.id)
      )
      .where(and(...queryConditions));

    return rows.map((r) => ({
      id: r.id,
      subjectId: r.subjectId,
      groupType: r.groupType as GroupType,
      shift: r.shift as Shift,
      groupNumber: r.groupNumber,
      weeklyHours: Number(r.weeklyHours),
      numberOfStudents: r.numberOfStudents,
      isCommon: r.isCommon,
      itineraryName: r.itineraryName,
      itineraryId: r.itineraryId,
      degreeId: r.degreeId,
      courseYear: r.courseYear,
    }));
  }
}
