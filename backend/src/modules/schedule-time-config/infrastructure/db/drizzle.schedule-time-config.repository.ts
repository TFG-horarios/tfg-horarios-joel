import { and, eq, isNull } from 'drizzle-orm';
import type { DbConnection } from '@/core/db/connection';
import type { DbTransaction } from '@/core/db/transaction-runner';
import { academicYearsTable } from '@/modules/academic-year/infrastructure/db/drizzle.academic-year.schema';
import { degreesTable } from '@/modules/degree/infrastructure/db/drizzle.degree.schema';
import { itinerariesTable } from '@/modules/itinerary/infrastructure/db/drizzle.itinerary.schema';
import type {
  IScheduleTimeConfigRepository,
  TimeConfigScope,
} from '../../domain/schedule-time-config.repository';
import { ScheduleTimeConfig } from '../../domain/schedule-time-config.entity';
import {
  scheduleTimeConfigsTable,
  type DrizzleScheduleTimeConfig,
} from './drizzle.schedule-time-config.schema';
import type {
  ScheduleTimeConfigListQueryDTO,
  ScheduleTimeConfigPossibilityDTO,
} from '@tfg-horarios/shared';
import { subjectsTable } from '@/modules/subject/infrastructure/db/drizzle.subject.schema';
import { subjectGroupsTable } from '@/modules/subject-group/infrastructure/db/drizzle.subject-group.schema';
import { schedulesTable } from '@/modules/schedule/infrastructure/db/drizzle.schedule.schema';

export class DrizzleScheduleTimeConfigRepository implements IScheduleTimeConfigRepository {
  constructor(private readonly db: DbConnection) {}

  async findPossibilities(
    organizationId: string
  ): Promise<ScheduleTimeConfigPossibilityDTO[]> {
    const rows = await this.db
      .selectDistinct({
        degreeId: subjectsTable.degreeId,
        itineraryId: subjectsTable.itineraryId,
        courseYear: subjectsTable.courseYear,
        period: subjectsTable.period,
        shift: subjectGroupsTable.shift,
      })
      .from(subjectsTable)
      .innerJoin(
        subjectGroupsTable,
        eq(subjectsTable.id, subjectGroupsTable.subjectId)
      )
      .where(
        and(
          eq(subjectsTable.organizationId, organizationId),
          isNull(subjectsTable.deletedAt),
          isNull(subjectGroupsTable.deletedAt)
        )
      )
      .orderBy(
        subjectsTable.degreeId,
        subjectsTable.courseYear,
        subjectsTable.period,
        subjectGroupsTable.shift
      );
    const result: ScheduleTimeConfigPossibilityDTO[] = [];
    const grouped = new Map<string, typeof rows>();

    for (const row of rows) {
      const key = `${row.degreeId}-${row.courseYear}-${row.period}-${row.shift}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(row);
    }

    for (const groupRows of grouped.values()) {
      const hasCommon = groupRows.some((r) => r.itineraryId === null);
      if (hasCommon) {
        result.push(groupRows.find((r) => r.itineraryId === null)!);
      } else {
        result.push(...groupRows);
      }
    }

    return result;
  }

  private map(row: DrizzleScheduleTimeConfig) {
    return ScheduleTimeConfig.reconstitute({
      ...row,
      startTime: row.startTime.slice(0, 5),
      endTime: row.endTime.slice(0, 5),
    });
  }

  async findById(id: string) {
    const [row] = await this.db
      .select()
      .from(scheduleTimeConfigsTable)
      .where(eq(scheduleTimeConfigsTable.id, id));
    return row ? this.map(row) : null;
  }

  async findAll(
    organizationId: string,
    academicYearId: string,
    filters: ScheduleTimeConfigListQueryDTO = {}
  ) {
    const conditions = [
      eq(scheduleTimeConfigsTable.organizationId, organizationId),
      eq(scheduleTimeConfigsTable.academicYearId, academicYearId),
    ];
    if (filters.degreeId)
      conditions.push(eq(scheduleTimeConfigsTable.degreeId, filters.degreeId));
    if (filters.itineraryId)
      conditions.push(
        eq(scheduleTimeConfigsTable.itineraryId, filters.itineraryId)
      );
    if (filters.courseYear)
      conditions.push(
        eq(scheduleTimeConfigsTable.courseYear, filters.courseYear)
      );
    if (filters.period !== undefined)
      conditions.push(eq(scheduleTimeConfigsTable.period, filters.period));
    if (filters.shift)
      conditions.push(eq(scheduleTimeConfigsTable.shift, filters.shift));
    const rows = await this.db
      .select()
      .from(scheduleTimeConfigsTable)
      .where(and(...conditions))
      .orderBy(
        scheduleTimeConfigsTable.degreeId,
        scheduleTimeConfigsTable.courseYear,
        scheduleTimeConfigsTable.period,
        scheduleTimeConfigsTable.shift
      );
    return rows.map((row) => this.map(row));
  }

  async findEffective(scope: TimeConfigScope) {
    if (scope.itineraryId) {
      const [specific] = await this.db
        .select()
        .from(scheduleTimeConfigsTable)
        .where(
          and(
            ...this.scopeConditions(scope),
            eq(scheduleTimeConfigsTable.itineraryId, scope.itineraryId)
          )
        );
      if (specific) return this.map(specific);
    }
    const [base] = await this.db
      .select()
      .from(scheduleTimeConfigsTable)
      .where(
        and(
          ...this.scopeConditions(scope),
          isNull(scheduleTimeConfigsTable.itineraryId)
        )
      );
    return base ? this.map(base) : null;
  }

  private scopeConditions(scope: TimeConfigScope) {
    return [
      eq(scheduleTimeConfigsTable.organizationId, scope.organizationId),
      eq(scheduleTimeConfigsTable.academicYearId, scope.academicYearId),
      eq(scheduleTimeConfigsTable.degreeId, scope.degreeId),
      eq(scheduleTimeConfigsTable.courseYear, scope.courseYear),
      eq(scheduleTimeConfigsTable.period, scope.period),
      eq(scheduleTimeConfigsTable.shift, scope.shift),
    ];
  }

  async save(config: ScheduleTimeConfig) {
    await this.db.insert(scheduleTimeConfigsTable).values(this.values(config));
  }

  async update(
    config: ScheduleTimeConfig,
    tx: DbConnection | DbTransaction = this.db
  ) {
    await tx
      .update(scheduleTimeConfigsTable)
      .set({
        startTime: config.startTime,
        endTime: config.endTime,
        hasBreak: config.hasBreak,
        breakAfterSlot: config.breakAfterSlot,
        updatedAt: config.updatedAt,
      })
      .where(eq(scheduleTimeConfigsTable.id, config.id));
  }

  async delete(id: string) {
    await this.db
      .delete(scheduleTimeConfigsTable)
      .where(eq(scheduleTimeConfigsTable.id, id));
  }

  async validateScope(scope: TimeConfigScope) {
    if (scope.itineraryId) {
      const [row] = await this.db
        .select({ id: academicYearsTable.id })
        .from(academicYearsTable)
        .innerJoin(
          degreesTable,
          and(
            eq(degreesTable.id, scope.degreeId),
            eq(degreesTable.organizationId, scope.organizationId)
          )
        )
        .innerJoin(
          itinerariesTable,
          and(
            eq(itinerariesTable.id, scope.itineraryId),
            eq(itinerariesTable.degreeId, scope.degreeId),
            eq(itinerariesTable.organizationId, scope.organizationId)
          )
        )
        .where(
          and(
            eq(academicYearsTable.id, scope.academicYearId),
            eq(academicYearsTable.organizationId, scope.organizationId)
          )
        );
      return Boolean(row);
    }

    const [row] = await this.db
      .select({ id: academicYearsTable.id })
      .from(academicYearsTable)
      .innerJoin(
        degreesTable,
        and(
          eq(degreesTable.id, scope.degreeId),
          eq(degreesTable.organizationId, scope.organizationId)
        )
      )
      .where(
        and(
          eq(academicYearsTable.id, scope.academicYearId),
          eq(academicYearsTable.organizationId, scope.organizationId)
        )
      );
    return Boolean(row);
  }

  async isReferenced(id: string) {
    const [row] = await this.db
      .select({ id: schedulesTable.id })
      .from(schedulesTable)
      .where(eq(schedulesTable.timeConfigId, id))
      .limit(1);
    return Boolean(row);
  }

  private values(config: ScheduleTimeConfig) {
    return {
      id: config.id,
      organizationId: config.organizationId,
      academicYearId: config.academicYearId,
      degreeId: config.degreeId,
      itineraryId: config.itineraryId,
      courseYear: config.courseYear,
      period: config.period,
      shift: config.shift,
      startTime: config.startTime,
      endTime: config.endTime,
      hasBreak: config.hasBreak,
      breakAfterSlot: config.breakAfterSlot,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }
}
