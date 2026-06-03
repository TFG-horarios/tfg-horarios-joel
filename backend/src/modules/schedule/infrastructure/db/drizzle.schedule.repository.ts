import { eq, and, desc, isNull, type SQL } from 'drizzle-orm';
import type { DbConnection } from '@/core/db/connection';
import { ConflictError } from '@/core/errors/app.error';
import { getPostgresErrorCode } from '@/core/db/db-errors';
import {
  schedulesTable,
  type DrizzleSchedule,
  type NewDrizzleSchedule,
} from './drizzle.schedule.schema';
import { scheduleSlotsTable } from '@/modules/schedule-slot/infrastructure/db/drizzle.schedule-slot.schema';
import type {
  IScheduleRepository,
  CreateScheduleSlotInput,
} from '../../domain/schedule.repository';
import { Schedule } from '../../domain/schedule.entity';
import type { ScheduleListQueryDTO } from '@tfg-horarios/shared';

export class DrizzleScheduleRepository implements IScheduleRepository {
  constructor(private readonly database: DbConnection) {}

  private mapToDomain(row: DrizzleSchedule): Schedule {
    return Schedule.reconstitute({
      id: row.id,
      organizationId: row.organizationId,
      degreeId: row.degreeId,
      itineraryId: row.itineraryId,
      academicYear: row.academicYear,
      shift: row.shift,
      courseYear: row.courseYear,
      period: row.period,
      status: row.status,
      version: row.version,
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
      academicYear: domain.academicYear,
      shift: domain.shift,
      courseYear: domain.courseYear,
      period: domain.period,
      status: domain.status,
      version: domain.version,
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

  async findPublishedByScope(
    organizationId: string,
    degreeId: string,
    itineraryId: string | null,
    academicYear: string,
    courseYear: number,
    period: number,
    shift: 'morning' | 'afternoon'
  ): Promise<Schedule | null> {
    const conditions = [
      eq(schedulesTable.organizationId, organizationId),
      eq(schedulesTable.degreeId, degreeId),
      eq(schedulesTable.academicYear, academicYear),
      eq(schedulesTable.courseYear, courseYear),
      eq(schedulesTable.period, period),
      eq(schedulesTable.shift, shift),
      eq(schedulesTable.status, 'published'),
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

  async findLatestVersionByScope(
    organizationId: string,
    degreeId: string,
    itineraryId: string | null,
    academicYear: string,
    courseYear: number,
    period: number,
    shift: 'morning' | 'afternoon'
  ): Promise<string | null> {
    const conditions = [
      eq(schedulesTable.organizationId, organizationId),
      eq(schedulesTable.degreeId, degreeId),
      eq(schedulesTable.academicYear, academicYear),
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
      .select({ version: schedulesTable.version })
      .from(schedulesTable)
      .where(and(...conditions))
      .orderBy(desc(schedulesTable.createdAt))
      .limit(1);

    return rows[0] ? rows[0].version : null;
  }

  async findAll(
    organizationId: string,
    filters?: ScheduleListQueryDTO
  ): Promise<Schedule[]> {
    const conditions: SQL[] = [
      eq(schedulesTable.organizationId, organizationId),
    ];

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

    const rows = await this.database
      .select()
      .from(schedulesTable)
      .where(and(...conditions))
      .orderBy(desc(schedulesTable.createdAt));
    return rows.map((row) => this.mapToDomain(row));
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
        version: rawData.version,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schedulesTable.id, schedule.id),
          eq(schedulesTable.organizationId, schedule.organizationId)
        )
      );
  }

  private mapSlotToPersistence(domain: CreateScheduleSlotInput) {
    const now = new Date();
    return {
      id: crypto.randomUUID(),
      scheduleId: domain.scheduleId,
      subjectGroupId: domain.subjectGroupId,
      classroomId: domain.classroomId,
      dayOfWeek: domain.dayOfWeek,
      slotIndex: domain.slotIndex,
      duration: domain.duration,
      createdAt: now,
      updatedAt: now,
    };
  }

  async createSchedulesWithSlots(
    items: { schedule: Schedule; slots: CreateScheduleSlotInput[] }[]
  ): Promise<void> {
    if (items.length === 0) return;

    try {
      await this.database.transaction(async (tx) => {
        for (const item of items) {
          await tx
            .insert(schedulesTable)
            .values(this.mapToPersistence(item.schedule));

          if (item.slots.length > 0) {
            const valuesToInsert = item.slots.map((s) =>
              this.mapSlotToPersistence(s)
            );
            await tx.insert(scheduleSlotsTable).values(valuesToInsert);
          }
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

  async publishAndArchive(
    toPublish: Schedule,
    toArchive: Schedule | null
  ): Promise<void> {
    await this.database.transaction(async (tx) => {
      if (toArchive) {
        const rawArchive = this.mapToPersistence(toArchive);
        await tx
          .update(schedulesTable)
          .set({
            status: rawArchive.status,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(schedulesTable.id, toArchive.id),
              eq(schedulesTable.organizationId, toArchive.organizationId)
            )
          );
      }

      const rawPublish = this.mapToPersistence(toPublish);
      await tx
        .update(schedulesTable)
        .set({
          status: rawPublish.status,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schedulesTable.id, toPublish.id),
            eq(schedulesTable.organizationId, toPublish.organizationId)
          )
        );
    });
  }
}
