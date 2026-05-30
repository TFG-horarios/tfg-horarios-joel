import { eq } from 'drizzle-orm';
import type { DbConnection } from '@/core/db/connection';
import { ConflictError } from '@/core/errors/app.error';
import { isPostgresError } from '@/core/db/db-errors';
import {
  scheduleSlotsTable,
  type DrizzleScheduleSlot,
  type NewDrizzleScheduleSlot,
} from './drizzle.schedule-slot.schema';
import type { IScheduleSlotRepository } from '../../domain/schedule-slot.repository';
import { ScheduleSlot } from '../../domain/schedule-slot.entity';

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

  async create(slot: ScheduleSlot): Promise<void> {
    await this.database
      .insert(scheduleSlotsTable)
      .values(this.mapToPersistence(slot));
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
      if (isPostgresError(error) && error.code === '23505') {
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
