import {
  eq,
  and,
  isNotNull,
  isNull,
  count,
  ilike,
  type SQL,
} from 'drizzle-orm';
import type { DbConnection } from '@/core/db/connection';
import { ConflictError } from '@/core/errors/app.error';
import { getPostgresErrorCode } from '@/core/db/db-errors';
import {
  scheduleSlotsTable,
  type DrizzleScheduleSlot,
  type NewDrizzleScheduleSlot,
} from './drizzle.schedule-slot.schema';
import { schedulesTable } from '@/modules/schedule/infrastructure/db/drizzle.schedule.schema';
import { classroomsTable } from '@/modules/classroom/infrastructure/db/drizzle.classroom.schema';
import type { IScheduleSlotRepository } from '../../domain/schedule-slot.repository';
import { ScheduleSlot } from '../../domain/schedule-slot.entity';
import type {
  ClassroomConfigurationListQueryDTO,
  ClassroomScheduleQueryDTO,
  PaginatedResponse,
} from '@tfg-horarios/shared';

export class DrizzleScheduleSlotRepository implements IScheduleSlotRepository {
  constructor(private readonly database: DbConnection) {}

  private mapToDomain(row: DrizzleScheduleSlot): ScheduleSlot {
    return ScheduleSlot.reconstitute({
      id: row.id,
      scheduleId: row.scheduleId,
      subjectGroupId: row.subjectGroupId,
      classroomId: row.classroomId,
      dayOfWeek: row.dayOfWeek,
      slotIndex: row.slotIndex,
      duration: row.duration,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private mapToPersistence(domain: ScheduleSlot): NewDrizzleScheduleSlot {
    return {
      id: domain.id,
      scheduleId: domain.scheduleId,
      subjectGroupId: domain.subjectGroupId,
      classroomId: domain.classroomId,
      dayOfWeek: domain.dayOfWeek,
      slotIndex: domain.slotIndex,
      duration: domain.duration,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  async findById(id: string): Promise<ScheduleSlot | null> {
    const rows = await this.database
      .select()
      .from(scheduleSlotsTable)
      .where(eq(scheduleSlotsTable.id, id))
      .limit(1);
    return rows[0] ? this.mapToDomain(rows[0]) : null;
  }

  async findByScheduleId(scheduleId: string): Promise<ScheduleSlot[]> {
    const rows = await this.database
      .select()
      .from(scheduleSlotsTable)
      .where(eq(scheduleSlotsTable.scheduleId, scheduleId));
    return rows.map((row) => this.mapToDomain(row));
  }

  async findActiveClassroomConfigurationsPaginated(
    organizationId: string,
    filters?: ClassroomConfigurationListQueryDTO
  ): Promise<
    PaginatedResponse<{
      classroomId: string;
      academicYear: string;
      shift: 'morning' | 'afternoon';
      period: number;
    }>
  > {
    const conditions: SQL[] = [
      eq(schedulesTable.organizationId, organizationId),
      isNotNull(scheduleSlotsTable.classroomId),
    ];

    if (filters?.academicYear) {
      conditions.push(eq(schedulesTable.academicYear, filters.academicYear));
    }
    if (filters?.shift) {
      conditions.push(eq(schedulesTable.shift, filters.shift));
    }
    if (filters?.period) {
      conditions.push(eq(schedulesTable.period, filters.period));
    }
    if (filters?.search) {
      conditions.push(ilike(classroomsTable.name, `%${filters.search}%`));
    }

    const subquery = this.database
      .select({
        classroomId: scheduleSlotsTable.classroomId,
        academicYear: schedulesTable.academicYear,
        shift: schedulesTable.shift,
        period: schedulesTable.period,
      })
      .from(scheduleSlotsTable)
      .innerJoin(
        schedulesTable,
        eq(scheduleSlotsTable.scheduleId, schedulesTable.id)
      )
      .innerJoin(
        classroomsTable,
        eq(scheduleSlotsTable.classroomId, classroomsTable.id)
      )
      .where(and(...conditions))
      .groupBy(
        scheduleSlotsTable.classroomId,
        schedulesTable.academicYear,
        schedulesTable.shift,
        schedulesTable.period
      )
      .as('subquery');

    const totalResult = await this.database
      .select({ value: count() })
      .from(subquery);

    const total = totalResult[0]?.value ?? 0;
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const totalPages = Math.ceil(total / limit);

    const rows = await this.database
      .select({
        classroomId: scheduleSlotsTable.classroomId,
        academicYear: schedulesTable.academicYear,
        shift: schedulesTable.shift,
        period: schedulesTable.period,
      })
      .from(scheduleSlotsTable)
      .innerJoin(
        schedulesTable,
        eq(scheduleSlotsTable.scheduleId, schedulesTable.id)
      )
      .where(and(...conditions))
      .groupBy(
        scheduleSlotsTable.classroomId,
        schedulesTable.academicYear,
        schedulesTable.shift,
        schedulesTable.period
      )
      .limit(limit)
      .offset((page - 1) * limit);

    const data = rows.map((r) => ({
      classroomId: r.classroomId as string,
      academicYear: r.academicYear,
      shift: r.shift as 'morning' | 'afternoon',
      period: r.period,
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findSlotsByClassroomIdAndFilters(
    classroomId: string,
    organizationId: string,
    filters?: ClassroomScheduleQueryDTO
  ): Promise<ScheduleSlot[]> {
    const conditions: SQL[] = [
      eq(scheduleSlotsTable.classroomId, classroomId),
      eq(schedulesTable.organizationId, organizationId),
    ];

    if (filters?.academicYear) {
      conditions.push(eq(schedulesTable.academicYear, filters.academicYear));
    }
    if (filters?.shift) {
      conditions.push(eq(schedulesTable.shift, filters.shift));
    }
    if (filters?.period) {
      conditions.push(eq(schedulesTable.period, filters.period));
    }

    const rows = await this.database
      .select({
        slot: scheduleSlotsTable,
      })
      .from(scheduleSlotsTable)
      .innerJoin(
        schedulesTable,
        eq(scheduleSlotsTable.scheduleId, schedulesTable.id)
      )
      .where(and(...conditions));

    return rows.map((r) => this.mapToDomain(r.slot));
  }

  async findLinkedSlots(
    subjectGroupId: string,
    academicYear: string,
    shift: 'morning' | 'afternoon',
    originalClassroomId: string | null,
    originalDayOfWeek: number | null,
    originalSlotIndex: number | null,
    duration: number
  ): Promise<ScheduleSlot[]> {
    const conditions: SQL[] = [
      eq(scheduleSlotsTable.subjectGroupId, subjectGroupId),
      eq(schedulesTable.academicYear, academicYear),
      eq(schedulesTable.shift, shift),
      eq(scheduleSlotsTable.duration, duration),
    ];

    if (originalClassroomId === null) {
      conditions.push(isNull(scheduleSlotsTable.classroomId));
    } else {
      conditions.push(eq(scheduleSlotsTable.classroomId, originalClassroomId));
    }

    if (originalDayOfWeek === null) {
      conditions.push(isNull(scheduleSlotsTable.dayOfWeek));
    } else {
      conditions.push(eq(scheduleSlotsTable.dayOfWeek, originalDayOfWeek));
    }

    if (originalSlotIndex === null) {
      conditions.push(isNull(scheduleSlotsTable.slotIndex));
    } else {
      conditions.push(eq(scheduleSlotsTable.slotIndex, originalSlotIndex));
    }

    const rows = await this.database
      .select({
        slot: scheduleSlotsTable,
      })
      .from(scheduleSlotsTable)
      .innerJoin(
        schedulesTable,
        eq(scheduleSlotsTable.scheduleId, schedulesTable.id)
      )
      .where(and(...conditions));

    return rows.map((r) => this.mapToDomain(r.slot));
  }

  async create(slot: ScheduleSlot): Promise<void> {
    try {
      await this.database
        .insert(scheduleSlotsTable)
        .values(this.mapToPersistence(slot));
    } catch (error: unknown) {
      if (getPostgresErrorCode(error) === '23505') {
        throw new ConflictError(
          'This classroom is already assigned to another subject at this time in this schedule.'
        );
      }
      throw error;
    }
  }

  async createMany(slots: ScheduleSlot[]): Promise<void> {
    if (slots.length === 0) return;
    const valuesToInsert = slots.map((s) => this.mapToPersistence(s));
    await this.database.insert(scheduleSlotsTable).values(valuesToInsert);
  }

  async update(slot: ScheduleSlot): Promise<void> {
    const rawData = this.mapToPersistence(slot);
    try {
      await this.database
        .update(scheduleSlotsTable)
        .set({
          classroomId: rawData.classroomId,
          dayOfWeek: rawData.dayOfWeek,
          slotIndex: rawData.slotIndex,
          duration: rawData.duration,
          updatedAt: rawData.updatedAt,
        })
        .where(eq(scheduleSlotsTable.id, slot.id));
    } catch (error: unknown) {
      if (getPostgresErrorCode(error) === '23505') {
        throw new ConflictError(
          'This classroom is already assigned to another subject at this time in this schedule.'
        );
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    await this.database
      .delete(scheduleSlotsTable)
      .where(eq(scheduleSlotsTable.id, id));
  }
}
