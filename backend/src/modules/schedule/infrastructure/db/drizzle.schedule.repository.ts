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
  inArray,
  or,
} from 'drizzle-orm';
import type { DbConnection } from '@/core/db/connection';
import type { DbTransaction } from '@/core/db/transaction-runner';
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
import type { ScheduleEngineAssignment } from '../../domain/providers/schedule-engine.provider';
import { subjectGroupsTable } from '@/modules/subject-group/infrastructure/db/drizzle.subject-group.schema';
import { subjectsTable } from '@/modules/subject/infrastructure/db/drizzle.subject.schema';
import { itinerariesTable } from '@/modules/itinerary/infrastructure/db/drizzle.itinerary.schema';
import { academicYearsTable } from '@/modules/academic-year/infrastructure/db/drizzle.academic-year.schema';
import { scheduleTimeConfigsTable } from '@/modules/schedule-time-config/infrastructure/db/drizzle.schedule-time-config.schema';

export class DrizzleScheduleRepository implements IScheduleRepository {
  constructor(private readonly database: DbConnection) {}

  private mapToDomain(row: DrizzleSchedule): Schedule {
    return Schedule.reconstitute({
      id: row.id,
      organizationId: row.organizationId,
      degreeId: row.degreeId,
      itineraryId: row.itineraryId,
      academicYearId: row.academicYearId,
      timeConfigId: row.timeConfigId,
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
      timeConfigId: domain.timeConfigId,
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

  private buildScheduleMetricsUpdate(scheduleId: string) {
    return {
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
    };
  }

  private async withEffectiveTimeConfig(
    row: DrizzleSchedule
  ): Promise<DrizzleSchedule> {
    const candidates = await this.database
      .select()
      .from(scheduleTimeConfigsTable)
      .where(
        and(
          eq(scheduleTimeConfigsTable.organizationId, row.organizationId),
          eq(scheduleTimeConfigsTable.academicYearId, row.academicYearId),
          eq(scheduleTimeConfigsTable.degreeId, row.degreeId),
          eq(scheduleTimeConfigsTable.courseYear, row.courseYear),
          eq(scheduleTimeConfigsTable.period, row.period),
          eq(scheduleTimeConfigsTable.shift, row.shift)
        )
      );

    const specific = row.itineraryId
      ? candidates.find((config) => config.itineraryId === row.itineraryId)
      : null;
    const base = candidates.find((config) => config.itineraryId === null);
    const effective = specific ?? base;

    if (!effective || effective.id === row.timeConfigId) {
      return row;
    }

    return { ...row, timeConfigId: effective.id };
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
    if (!rows[0]) return null;
    return this.mapToDomain(await this.withEffectiveTimeConfig(rows[0]));
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

  async update(schedule: Schedule): Promise<void> {
    const rawData = this.mapToPersistence(schedule);
    await this.database
      .update(schedulesTable)
      .set({
        timeConfigId: rawData.timeConfigId,
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
      .set(this.buildScheduleMetricsUpdate(scheduleId))
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
                timeConfigId: item.schedule.timeConfigId,
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
            .set(this.buildScheduleMetricsUpdate(scheduleId))
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
        timeConfigId: schedulesTable.timeConfigId,
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
      timeConfigId: r.timeConfigId ?? undefined,
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

  async unassignClassroomsFromSlots(
    classroomIds: string[],
    organizationId: string,
    activeAndFutureYearIds: string[],
    tx: DbConnection | DbTransaction = this.database
  ): Promise<string[]> {
    if (classroomIds.length === 0 || activeAndFutureYearIds.length === 0) {
      return [];
    }

    const allowedSchedules = tx
      .select({ id: schedulesTable.id })
      .from(schedulesTable)
      .where(
        and(
          eq(schedulesTable.organizationId, organizationId),
          inArray(schedulesTable.academicYearId, activeAndFutureYearIds)
        )
      );
    const targetRows = await tx
      .select({
        id: scheduleSlotsTable.id,
        scheduleId: scheduleSlotsTable.scheduleId,
      })
      .from(scheduleSlotsTable)
      .where(
        and(
          inArray(scheduleSlotsTable.classroomId, classroomIds),
          inArray(scheduleSlotsTable.scheduleId, allowedSchedules)
        )
      );
    if (targetRows.length === 0) return [];

    const slotIds = targetRows.map((row: { id: string }) => row.id);
    const includedRows = await tx
      .select({ scheduleId: scheduleSlotInclusionsTable.scheduleId })
      .from(scheduleSlotInclusionsTable)
      .innerJoin(
        schedulesTable,
        eq(scheduleSlotInclusionsTable.scheduleId, schedulesTable.id)
      )
      .where(
        and(
          inArray(scheduleSlotInclusionsTable.slotId, slotIds),
          eq(schedulesTable.organizationId, organizationId),
          inArray(schedulesTable.academicYearId, activeAndFutureYearIds)
        )
      );

    await tx
      .update(scheduleSlotsTable)
      .set({
        classroomId: null,
        dayOfWeek: null,
        slotIndex: null,
        conflicts: [],
        updatedAt: new Date(),
      })
      .where(inArray(scheduleSlotsTable.id, slotIds));
    await tx
      .update(scheduleSlotInclusionsTable)
      .set({ conflicts: [], updatedAt: new Date() })
      .where(inArray(scheduleSlotInclusionsTable.slotId, slotIds));

    return [
      ...new Set<string>(
        [...targetRows, ...includedRows].map(
          (row: { scheduleId: string }) => row.scheduleId
        )
      ),
    ];
  }

  async deleteSchedulesByDegreesOrItineraries(
    degreeIds: string[],
    itineraryIds: string[],
    organizationId: string,
    activeAndFutureYearIds: string[],
    tx: DbConnection | DbTransaction = this.database
  ): Promise<void> {
    if (
      activeAndFutureYearIds.length === 0 ||
      (degreeIds.length === 0 && itineraryIds.length === 0)
    ) {
      return;
    }

    const scopeConditions: SQL[] = [];
    if (degreeIds.length > 0) {
      scopeConditions.push(inArray(schedulesTable.degreeId, degreeIds));
    }
    if (itineraryIds.length > 0) {
      scopeConditions.push(inArray(schedulesTable.itineraryId, itineraryIds));
    }

    await tx
      .delete(schedulesTable)
      .where(
        and(
          eq(schedulesTable.organizationId, organizationId),
          inArray(schedulesTable.academicYearId, activeAndFutureYearIds),
          or(...scopeConditions)
        )
      );
  }

  async deleteSlotsBySubjects(
    subjectIds: string[],
    organizationId: string,
    activeAndFutureYearIds: string[],
    tx: DbConnection | DbTransaction = this.database
  ): Promise<string[]> {
    if (subjectIds.length === 0 || activeAndFutureYearIds.length === 0) {
      return [];
    }

    const groupIds = tx
      .select({ id: subjectGroupsTable.id })
      .from(subjectGroupsTable)
      .where(
        and(
          eq(subjectGroupsTable.organizationId, organizationId),
          inArray(subjectGroupsTable.subjectId, subjectIds)
        )
      );

    return this.deleteSlotsByGroupQuery(
      groupIds,
      organizationId,
      activeAndFutureYearIds,
      tx
    );
  }

  async deleteSlotsBySubjectGroups(
    subjectGroupIds: string[],
    organizationId: string,
    activeAndFutureYearIds: string[],
    tx: DbConnection | DbTransaction = this.database
  ): Promise<string[]> {
    if (subjectGroupIds.length === 0 || activeAndFutureYearIds.length === 0) {
      return [];
    }

    return this.deleteSlotsByGroupQuery(
      subjectGroupIds,
      organizationId,
      activeAndFutureYearIds,
      tx
    );
  }

  async addUnassignedSlotsForSubjectGroups(
    subjectGroupIds: string[],
    organizationId: string,
    activeAndFutureYearIds: string[],
    tx: DbConnection | DbTransaction = this.database
  ): Promise<string[]> {
    if (subjectGroupIds.length === 0 || activeAndFutureYearIds.length === 0) {
      return [];
    }

    type SubjectGroupScheduleRow = {
      subjectGroupId: string;
      weeklyHours: string;
      isCommon: boolean;
      subjectItineraryId: string | null;
      scheduleId: string;
      scheduleItineraryId: string | null;
      academicYearId: string;
      slotDurationMinutes: number;
    };

    const rows: SubjectGroupScheduleRow[] = await tx
      .select({
        subjectGroupId: subjectGroupsTable.id,
        weeklyHours: subjectGroupsTable.weeklyHours,
        isCommon: subjectsTable.isCommon,
        subjectItineraryId: subjectsTable.itineraryId,
        scheduleId: schedulesTable.id,
        scheduleItineraryId: schedulesTable.itineraryId,
        academicYearId: schedulesTable.academicYearId,
        slotDurationMinutes: academicYearsTable.slotDurationMinutes,
      })
      .from(subjectGroupsTable)
      .innerJoin(
        subjectsTable,
        eq(subjectGroupsTable.subjectId, subjectsTable.id)
      )
      .innerJoin(
        schedulesTable,
        and(
          eq(schedulesTable.organizationId, organizationId),
          eq(schedulesTable.degreeId, subjectsTable.degreeId),
          eq(schedulesTable.courseYear, subjectsTable.courseYear),
          eq(schedulesTable.period, subjectsTable.period),
          eq(schedulesTable.shift, subjectGroupsTable.shift),
          inArray(schedulesTable.academicYearId, activeAndFutureYearIds)
        )
      )
      .innerJoin(
        academicYearsTable,
        eq(schedulesTable.academicYearId, academicYearsTable.id)
      )
      .where(
        and(
          eq(subjectGroupsTable.organizationId, organizationId),
          inArray(subjectGroupsTable.id, subjectGroupIds),
          isNull(subjectGroupsTable.deletedAt),
          isNull(subjectsTable.deletedAt)
        )
      );

    const affectedScheduleIds = new Set<string>();
    const scopeRows = new Map<string, typeof rows>();
    for (const row of rows) {
      const key = `${row.subjectGroupId}:${row.academicYearId}`;
      const groupRows = scopeRows.get(key) ?? [];
      groupRows.push(row);
      scopeRows.set(key, groupRows);
    }

    for (const groupRows of scopeRows.values()) {
      const group = groupRows[0];
      if (!group) continue;

      const owner = group.isCommon
        ? groupRows.find((row) => row.scheduleItineraryId === null)
        : groupRows.find(
            (row) => row.scheduleItineraryId === group.subjectItineraryId
          );
      if (!owner) continue;

      const totalMinutes = Number(group.weeklyHours) * 60;
      const fullSlots = Math.floor(totalMinutes / group.slotDurationMinutes);
      const remainder = totalMinutes % group.slotDurationMinutes;
      const durations: number[] = [];
      for (let index = 0; index < fullSlots - 1; index++) {
        durations.push(1);
      }
      if (fullSlots > 0) {
        durations.push(1 + remainder / group.slotDurationMinutes);
      } else if (remainder > 0) {
        durations.push(remainder / group.slotDurationMinutes);
      }
      if (durations.length === 0) continue;

      const slots = durations.map((duration) => ({
        id: crypto.randomUUID(),
        scheduleId: owner.scheduleId,
        subjectGroupId: group.subjectGroupId,
        classroomId: null,
        dayOfWeek: null,
        slotIndex: null,
        duration,
        conflicts: [],
      }));
      await tx.insert(scheduleSlotsTable).values(slots);
      affectedScheduleIds.add(owner.scheduleId);

      if (group.isCommon) {
        const includedScheduleIds = groupRows
          .filter((row) => row.scheduleItineraryId !== null)
          .map((row) => row.scheduleId);
        const inclusions = includedScheduleIds.flatMap((scheduleId) =>
          slots.map((slot) => ({
            scheduleId,
            slotId: slot.id,
            conflicts: [],
          }))
        );
        if (inclusions.length > 0) {
          await tx.insert(scheduleSlotInclusionsTable).values(inclusions);
          includedScheduleIds.forEach((id) => affectedScheduleIds.add(id));
        }
      }
    }

    return [...affectedScheduleIds];
  }

  private async deleteSlotsByGroupQuery(
    groupIds: string[] | any,
    organizationId: string,
    activeAndFutureYearIds: string[],
    tx: DbConnection | DbTransaction
  ): Promise<string[]> {
    const allowedSchedules = tx
      .select({ id: schedulesTable.id })
      .from(schedulesTable)
      .where(
        and(
          eq(schedulesTable.organizationId, organizationId),
          inArray(schedulesTable.academicYearId, activeAndFutureYearIds)
        )
      );
    const targetRows = await tx
      .select({
        id: scheduleSlotsTable.id,
        scheduleId: scheduleSlotsTable.scheduleId,
      })
      .from(scheduleSlotsTable)
      .where(
        and(
          inArray(scheduleSlotsTable.subjectGroupId, groupIds),
          inArray(scheduleSlotsTable.scheduleId, allowedSchedules)
        )
      );
    if (targetRows.length === 0) return [];

    const slotIds = targetRows.map((row: { id: string }) => row.id);
    const includedRows = await tx
      .select({ scheduleId: scheduleSlotInclusionsTable.scheduleId })
      .from(scheduleSlotInclusionsTable)
      .innerJoin(
        schedulesTable,
        eq(scheduleSlotInclusionsTable.scheduleId, schedulesTable.id)
      )
      .where(
        and(
          inArray(scheduleSlotInclusionsTable.slotId, slotIds),
          eq(schedulesTable.organizationId, organizationId),
          inArray(schedulesTable.academicYearId, activeAndFutureYearIds)
        )
      );
    await tx
      .delete(scheduleSlotsTable)
      .where(inArray(scheduleSlotsTable.id, slotIds));

    return [
      ...new Set<string>(
        [...targetRows, ...includedRows].map(
          (row: { scheduleId: string }) => row.scheduleId
        )
      ),
    ];
  }

  async findScheduleIssueData(
    scheduleIds: string[],
    organizationId: string,
    tx: DbConnection | DbTransaction = this.database
  ) {
    if (scheduleIds.length === 0) return [];

    const ownRows = await tx
      .select({
        scheduleId: scheduleSlotsTable.scheduleId,
        classroomId: scheduleSlotsTable.classroomId,
        dayOfWeek: scheduleSlotsTable.dayOfWeek,
        slotIndex: scheduleSlotsTable.slotIndex,
        conflicts: scheduleSlotsTable.conflicts,
      })
      .from(scheduleSlotsTable)
      .innerJoin(
        schedulesTable,
        eq(scheduleSlotsTable.scheduleId, schedulesTable.id)
      )
      .where(
        and(
          eq(schedulesTable.organizationId, organizationId),
          inArray(scheduleSlotsTable.scheduleId, scheduleIds)
        )
      );

    const includedRows = await tx
      .select({
        scheduleId: scheduleSlotInclusionsTable.scheduleId,
        classroomId: scheduleSlotsTable.classroomId,
        dayOfWeek: scheduleSlotsTable.dayOfWeek,
        slotIndex: scheduleSlotsTable.slotIndex,
        conflicts: scheduleSlotInclusionsTable.conflicts,
      })
      .from(scheduleSlotInclusionsTable)
      .innerJoin(
        schedulesTable,
        eq(scheduleSlotInclusionsTable.scheduleId, schedulesTable.id)
      )
      .innerJoin(
        scheduleSlotsTable,
        eq(scheduleSlotInclusionsTable.slotId, scheduleSlotsTable.id)
      )
      .where(
        and(
          eq(schedulesTable.organizationId, organizationId),
          inArray(scheduleSlotInclusionsTable.scheduleId, scheduleIds)
        )
      );

    return [...ownRows, ...includedRows];
  }

  async updateSchedulesMetrics(
    metrics: { scheduleId: string; conflicts: number; unassigned: number }[],
    organizationId: string,
    tx: DbConnection | DbTransaction = this.database
  ): Promise<void> {
    for (const metric of metrics) {
      await tx
        .update(schedulesTable)
        .set({
          conflicts: metric.conflicts,
          unassigned: metric.unassigned,
          ...(metric.unassigned > 0 ? { status: 'draft' as const } : {}),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schedulesTable.id, metric.scheduleId),
            eq(schedulesTable.organizationId, organizationId)
          )
        );
    }
  }
}
