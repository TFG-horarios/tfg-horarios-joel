import {
  eq,
  and,
  desc,
  isNull,
  count,
  type SQL,
  notInArray,
  gt,
  sql,
} from 'drizzle-orm';
import type { DbConnection } from '@/core/db/connection';
import { ConflictError } from '@/core/errors/app.error';
import { getPostgresErrorCode } from '@/core/db/db-errors';
import {
  schedulesTable,
  type DrizzleSchedule,
  type NewDrizzleSchedule,
} from './drizzle.schedule.schema';
import { scheduleSlotsTable } from '@/modules/schedule-slot/infrastructure/db/drizzle.schedule-slot.schema';
import { scheduleSlotInclusionsTable } from '@/modules/schedule-slot/infrastructure/db/drizzle.schedule-slot.schema';
import type {
  IScheduleRepository,
  CreateScheduleSlotInput,
  CreateScheduleSlotInclusionInput,
} from '../../domain/schedule.repository';
import { Schedule } from '../../domain/schedule.entity';
import type {
  GroupType,
  Shift,
  ScheduleListQueryDTO,
  PaginatedResponse,
} from '@tfg-horarios/shared';
import type { ScheduleEngineAssignment } from '../../domain/schedule-engine.provider';
import { subjectGroupsTable } from '@/modules/subject-group/infrastructure/db/drizzle.subject-group.schema';
import { subjectsTable } from '@/modules/subject/infrastructure/db/drizzle.subject.schema';
import { itinerariesTable } from '@/modules/itinerary/infrastructure/db/drizzle.itinerary.schema';

export class DrizzleScheduleRepository implements IScheduleRepository {
  constructor(private readonly database: DbConnection) {}

  private mapToDomain(row: DrizzleSchedule): Schedule {
    return Schedule.reconstitute({
      id: row.id,
      organizationId: row.organizationId,
      degreeId: row.degreeId,
      itineraryId: row.itineraryId,
      academicYearId: row.academicYearId,
      shift: row.shift,
      courseYear: row.courseYear,
      period: row.period,
      isCanonicalCommon: row.isCanonicalCommon,
      conflicts: row.conflicts,
      unassigned: row.unassigned,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private mapToPersistence(domain: Schedule): NewDrizzleSchedule {
    return {
      id: domain.id,
      organizationId: domain.organizationId,
      degreeId: domain.degreeId,
      itineraryId: domain.itineraryId,
      academicYearId: domain.academicYearId,
      shift: domain.shift,
      courseYear: domain.courseYear,
      period: domain.period,
      isCanonicalCommon: domain.isCanonicalCommon,
      conflicts: domain.conflicts,
      unassigned: domain.unassigned,
      status: domain.status,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  async findById(id: string, organizationId: string): Promise<Schedule | null> {
    const rows = await this.database
      .select()
      .from(schedulesTable)
      .where(
        and(
          eq(schedulesTable.id, id),
          eq(schedulesTable.organizationId, organizationId)
        )
      )
      .limit(1);
    return rows[0] ? this.mapToDomain(rows[0]) : null;
  }

  async findByScope(
    organizationId: string,
    degreeId: string,
    itineraryId: string | null,
    academicYearId: string,
    courseYear: number,
    period: number,
    shift: Shift
  ): Promise<Schedule | null> {
    const conditions = [
      eq(schedulesTable.organizationId, organizationId),
      eq(schedulesTable.degreeId, degreeId),
      eq(schedulesTable.academicYearId, academicYearId),
      eq(schedulesTable.courseYear, courseYear),
      eq(schedulesTable.period, period),
      eq(schedulesTable.shift, shift),
    ];

    if (itineraryId) {
      conditions.push(eq(schedulesTable.itineraryId, itineraryId));
    } else {
      conditions.push(isNull(schedulesTable.itineraryId));
    }

    const rows = await this.database
      .select()
      .from(schedulesTable)
      .where(and(...conditions))
      .limit(1);

    return rows[0] ? this.mapToDomain(rows[0]) : null;
  }

  async findDistinctAcademicYears(organizationId: string): Promise<string[]> {
    const rows = await this.database
      .selectDistinct({ academicYearId: schedulesTable.academicYearId })
      .from(schedulesTable)
      .where(eq(schedulesTable.organizationId, organizationId))
      .orderBy(desc(schedulesTable.academicYearId));

    return rows.map((r) => r.academicYearId);
  }

  async findAll(organizationId: string): Promise<Schedule[]> {
    const rows = await this.database
      .select()
      .from(schedulesTable)
      .where(
        and(
          eq(schedulesTable.organizationId, organizationId),
          eq(schedulesTable.isCanonicalCommon, false)
        )
      )
      .orderBy(desc(schedulesTable.createdAt));
    return rows.map((row) => this.mapToDomain(row));
  }

  async findPaginated(
    organizationId: string,
    filters?: ScheduleListQueryDTO
  ): Promise<PaginatedResponse<Schedule>> {
    const conditions: SQL[] = [
      eq(schedulesTable.organizationId, organizationId),
      eq(schedulesTable.isCanonicalCommon, false),
    ];

    if (filters?.academicYearId) {
      conditions.push(
        eq(schedulesTable.academicYearId, filters.academicYearId)
      );
    }
    if (filters?.degreeId) {
      conditions.push(eq(schedulesTable.degreeId, filters.degreeId));
    }
    if (filters?.itineraryId) {
      if (filters.itineraryId === 'common') {
        conditions.push(isNull(schedulesTable.itineraryId));
      } else {
        conditions.push(eq(schedulesTable.itineraryId, filters.itineraryId));
      }
    }
    if (filters?.shift) {
      conditions.push(eq(schedulesTable.shift, filters.shift));
    }
    if (filters?.courseYear) {
      conditions.push(eq(schedulesTable.courseYear, filters.courseYear));
    }
    if (filters?.period) {
      conditions.push(eq(schedulesTable.period, filters.period));
    }
    if (filters?.status) {
      conditions.push(eq(schedulesTable.status, filters.status));
    }
    if (filters?.hasConflicts) {
      switch (filters.hasConflicts) {
        case 'all':
          break;
        case 'conflicts':
          conditions.push(gt(schedulesTable.conflicts, 0));
          conditions.push(eq(schedulesTable.unassigned, 0));
          break;
        case 'unassigned':
          conditions.push(eq(schedulesTable.conflicts, 0));
          conditions.push(gt(schedulesTable.unassigned, 0));
          break;
        case 'conflictsAndUnassigned':
          conditions.push(gt(schedulesTable.conflicts, 0));
          conditions.push(gt(schedulesTable.unassigned, 0));
          break;
        case 'withoutConflictsAndUnassigned':
          conditions.push(eq(schedulesTable.conflicts, 0));
          conditions.push(eq(schedulesTable.unassigned, 0));
          break;
      }
    }

    const countResult = await this.database
      .select({ total: count() })
      .from(schedulesTable)
      .where(and(...conditions));
    const total = countResult[0]?.total ?? 0;

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 100;
    const offset = (page - 1) * limit;

    const rows = await this.database
      .select()
      .from(schedulesTable)
      .where(and(...conditions))
      .orderBy(desc(schedulesTable.createdAt))
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

  async create(schedule: Schedule): Promise<void> {
    try {
      await this.database
        .insert(schedulesTable)
        .values(this.mapToPersistence(schedule));
    } catch (error: unknown) {
      if (getPostgresErrorCode(error) === '23505') {
        throw new ConflictError(
          'A schedule generation is already in progress or exists for this scope.'
        );
      }
      throw error;
    }
  }

  async update(schedule: Schedule): Promise<void> {
    const rawData = this.mapToPersistence(schedule);
    await this.database
      .update(schedulesTable)
      .set({
        status: rawData.status,
        conflicts: rawData.conflicts,
        unassigned: rawData.unassigned,
        isCanonicalCommon: rawData.isCanonicalCommon,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schedulesTable.id, schedule.id),
          eq(schedulesTable.organizationId, schedule.organizationId)
        )
      );
  }

  async updateConflictsAndUnassignedCount(
    scheduleId: string,
    organizationId: string
  ): Promise<void> {
    await this.database
      .update(schedulesTable)
      .set({
        conflicts: sql<number>`
          COALESCE((
            SELECT COUNT(*)
            FROM ${scheduleSlotsTable} AS own_slot,
              LATERAL jsonb_array_elements(own_slot.conflicts) AS conflict
            WHERE own_slot.schedule_id = ${scheduleId}
              AND conflict->>'type' NOT LIKE 'UNASSIGNED%'
          ), 0)
          +
          COALESCE((
            SELECT COUNT(*)
            FROM ${scheduleSlotInclusionsTable} AS included_slot,
              LATERAL jsonb_array_elements(included_slot.conflicts) AS conflict
            WHERE included_slot.schedule_id = ${scheduleId}
              AND conflict->>'type' NOT LIKE 'UNASSIGNED%'
          ), 0)
        `,
        unassigned: sql<number>`
          COALESCE((
            SELECT COUNT(*)
            FROM ${scheduleSlotsTable}
            WHERE ${scheduleSlotsTable.scheduleId} = ${scheduleId}
              AND (${scheduleSlotsTable.classroomId} IS NULL OR ${scheduleSlotsTable.dayOfWeek} IS NULL OR ${scheduleSlotsTable.slotIndex} IS NULL)
          ), 0)
          +
          COALESCE((
            SELECT COUNT(*)
            FROM ${scheduleSlotInclusionsTable}
            INNER JOIN ${scheduleSlotsTable} ON ${scheduleSlotInclusionsTable.slotId} = ${scheduleSlotsTable.id}
            WHERE ${scheduleSlotInclusionsTable.scheduleId} = ${scheduleId}
              AND (${scheduleSlotsTable.classroomId} IS NULL OR ${scheduleSlotsTable.dayOfWeek} IS NULL OR ${scheduleSlotsTable.slotIndex} IS NULL)
          ), 0)
        `,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schedulesTable.id, scheduleId),
          eq(schedulesTable.organizationId, organizationId)
        )
      );
  }

  private mapSlotToPersistence(domain: CreateScheduleSlotInput) {
    const now = new Date();
    return {
      id: domain.id ?? crypto.randomUUID(),
      scheduleId: domain.scheduleId,
      subjectGroupId: domain.subjectGroupId,
      classroomId: domain.classroomId,
      dayOfWeek: domain.dayOfWeek,
      slotIndex: domain.slotIndex,
      duration: domain.duration,
      conflicts: domain.conflicts,
      createdAt: now,
      updatedAt: now,
    };
  }

  private mapInclusionToPersistence(domain: CreateScheduleSlotInclusionInput) {
    const now = new Date();
    return {
      id: crypto.randomUUID(),
      scheduleId: domain.scheduleId,
      slotId: domain.slotId,
      conflicts: domain.conflicts,
      createdAt: now,
      updatedAt: now,
    };
  }

  async createSchedulesWithSlots(
    items: {
      schedule: Schedule;
      slots: CreateScheduleSlotInput[];
      inclusions?: CreateScheduleSlotInclusionInput[];
    }[],
    additionalInclusions: CreateScheduleSlotInclusionInput[] = []
  ): Promise<void> {
    if (items.length === 0 && additionalInclusions.length === 0) return;

    try {
      await this.database.transaction(async (tx) => {
        for (const item of items) {
          const existing = await tx
            .select({ id: schedulesTable.id })
            .from(schedulesTable)
            .where(eq(schedulesTable.id, item.schedule.id))
            .limit(1);

          if (existing.length === 0) {
            await tx
              .insert(schedulesTable)
              .values(this.mapToPersistence(item.schedule));
          } else {
            await tx
              .update(schedulesTable)
              .set({
                status: item.schedule.status,
                conflicts: item.schedule.conflicts,
                unassigned: item.schedule.unassigned,
                isCanonicalCommon: item.schedule.isCanonicalCommon,
                updatedAt: new Date(),
              })
              .where(eq(schedulesTable.id, item.schedule.id));

            await tx
              .delete(scheduleSlotInclusionsTable)
              .where(
                eq(scheduleSlotInclusionsTable.scheduleId, item.schedule.id)
              );

            await tx
              .delete(scheduleSlotsTable)
              .where(eq(scheduleSlotsTable.scheduleId, item.schedule.id));
          }
        }

        for (const item of items) {
          if (item.slots.length > 0) {
            const valuesToInsert = item.slots.map((s) =>
              this.mapSlotToPersistence(s)
            );
            await tx.insert(scheduleSlotsTable).values(valuesToInsert);
          }
        }

        const inclusions = [
          ...items.flatMap((item) => item.inclusions ?? []),
          ...additionalInclusions,
        ];
        if (inclusions.length > 0) {
          await tx
            .insert(scheduleSlotInclusionsTable)
            .values(inclusions.map((i) => this.mapInclusionToPersistence(i)));
        }

        const affectedScheduleIds = [
          ...new Set([
            ...items.map((item) => item.schedule.id),
            ...inclusions.map((inclusion) => inclusion.scheduleId),
          ]),
        ];

        for (const scheduleId of affectedScheduleIds) {
          await tx
            .update(schedulesTable)
            .set({
              conflicts: sql<number>`
                COALESCE((
                  SELECT COUNT(*)
                  FROM ${scheduleSlotsTable} AS own_slot,
                    LATERAL jsonb_array_elements(own_slot.conflicts) AS conflict
                  WHERE own_slot.schedule_id = ${scheduleId}
                    AND conflict->>'type' NOT LIKE 'UNASSIGNED%'
                ), 0)
                +
                COALESCE((
                  SELECT COUNT(*)
                  FROM ${scheduleSlotInclusionsTable} AS included_slot,
                    LATERAL jsonb_array_elements(included_slot.conflicts) AS conflict
                  WHERE included_slot.schedule_id = ${scheduleId}
                    AND conflict->>'type' NOT LIKE 'UNASSIGNED%'
                ), 0)
              `,
              unassigned: sql<number>`
                COALESCE((
                  SELECT COUNT(*)
                  FROM ${scheduleSlotsTable}
                  WHERE ${scheduleSlotsTable.scheduleId} = ${scheduleId}
                    AND (${scheduleSlotsTable.classroomId} IS NULL OR ${scheduleSlotsTable.dayOfWeek} IS NULL OR ${scheduleSlotsTable.slotIndex} IS NULL)
                ), 0)
                +
                COALESCE((
                  SELECT COUNT(*)
                  FROM ${scheduleSlotInclusionsTable}
                  INNER JOIN ${scheduleSlotsTable} ON ${scheduleSlotInclusionsTable.slotId} = ${scheduleSlotsTable.id}
                  WHERE ${scheduleSlotInclusionsTable.scheduleId} = ${scheduleId}
                    AND (${scheduleSlotsTable.classroomId} IS NULL OR ${scheduleSlotsTable.dayOfWeek} IS NULL OR ${scheduleSlotsTable.slotIndex} IS NULL)
                ), 0)
              `,
              updatedAt: new Date(),
            })
            .where(eq(schedulesTable.id, scheduleId));
        }
      });
    } catch (error: unknown) {
      if (getPostgresErrorCode(error) === '23505') {
        throw new ConflictError(
          'A schedule generation is already in progress or exists for this scope.'
        );
      }
      throw error;
    }
  }

  async findLockedAssignments(
    organizationId: string,
    academicYearId: string,
    period: number,
    excludeScheduleIds: string[]
  ): Promise<ScheduleEngineAssignment[]> {
    const conditions = [
      eq(schedulesTable.organizationId, organizationId),
      eq(schedulesTable.academicYearId, academicYearId),
      eq(schedulesTable.period, period),
    ];

    if (excludeScheduleIds.length > 0) {
      conditions.push(notInArray(schedulesTable.id, excludeScheduleIds));
    }

    const rows = await this.database
      .select({
        id: scheduleSlotsTable.id,
        subjectGroupId: scheduleSlotsTable.subjectGroupId,
        subjectId: subjectGroupsTable.subjectId,
        groupType: subjectGroupsTable.groupType,
        isCommon: subjectsTable.isCommon,
        itineraryName: itinerariesTable.name,
        itineraryId: subjectsTable.itineraryId,
        numberOfStudents: subjectGroupsTable.numberOfStudents,
        needsComputerLab: subjectGroupsTable.needsComputerLab,
        shift: schedulesTable.shift,
        degreeId: schedulesTable.degreeId,
        courseYear: schedulesTable.courseYear,
        classroomId: scheduleSlotsTable.classroomId,
        dayOfWeek: scheduleSlotsTable.dayOfWeek,
        slotIndex: scheduleSlotsTable.slotIndex,
        duration: scheduleSlotsTable.duration,
      })
      .from(schedulesTable)
      .innerJoin(
        scheduleSlotsTable,
        eq(schedulesTable.id, scheduleSlotsTable.scheduleId)
      )
      .innerJoin(
        subjectGroupsTable,
        eq(scheduleSlotsTable.subjectGroupId, subjectGroupsTable.id)
      )
      .innerJoin(
        subjectsTable,
        eq(subjectGroupsTable.subjectId, subjectsTable.id)
      )
      .leftJoin(
        itinerariesTable,
        eq(subjectsTable.itineraryId, itinerariesTable.id)
      )
      .where(and(...conditions));

    const assignments = rows.map((r) => ({
      id: r.id,
      subjectGroupId: r.subjectGroupId,
      subjectId: r.subjectId,
      shift: r.shift as Shift,
      groupType: r.groupType as GroupType,
      isCommon: r.isCommon,
      itineraryName: r.itineraryName,
      itineraryId: r.itineraryId,
      numberOfStudents: r.numberOfStudents,
      needsComputerLab: r.needsComputerLab,
      degreeId: r.degreeId,
      courseYear: r.courseYear,
      classroomId: r.classroomId,
      dayOfWeek: r.dayOfWeek,
      slotIndex: r.slotIndex,
      duration: r.duration,
      isLocked: true,
    }));

    return [
      ...new Map(
        assignments.map((a) => {
          const key = [
            a.subjectGroupId,
            a.classroomId ?? 'none',
            a.dayOfWeek ?? 'none',
            a.slotIndex ?? 'none',
            a.duration,
          ].join(':');

          return [key, a];
        })
      ).values(),
    ];
  }

  async delete(id: string, organizationId: string): Promise<void> {
    await this.database
      .delete(schedulesTable)
      .where(
        and(
          eq(schedulesTable.id, id),
          eq(schedulesTable.organizationId, organizationId)
        )
      );
  }
}
