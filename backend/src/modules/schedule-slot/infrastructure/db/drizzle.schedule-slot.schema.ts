import {
  pgTable,
  uuid,
  integer,
  timestamp,
  uniqueIndex,
  real,
  jsonb,
} from 'drizzle-orm/pg-core';
import { schedulesTable } from '@/modules/schedule/infrastructure/db/drizzle.schedule.schema';
import { subjectGroupsTable } from '@/modules/subject-group/infrastructure/db/drizzle.subject-group.schema';
import { classroomsTable } from '@/modules/classroom/infrastructure/db/drizzle.classroom.schema';
import { sql } from 'drizzle-orm';
import type { ScheduleConflictDetailDTO } from '@tfg-horarios/shared';

export const scheduleSlotsTable = pgTable(
  'schedule_slot',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scheduleId: uuid('schedule_id')
      .notNull()
      .references(() => schedulesTable.id, { onDelete: 'cascade' }),
    subjectGroupId: uuid('subject_group_id')
      .notNull()
      .references(() => subjectGroupsTable.id, { onDelete: 'restrict' }),
    classroomId: uuid('classroom_id').references(() => classroomsTable.id, {
      onDelete: 'restrict',
    }),
    dayOfWeek: integer('day_of_week'),
    slotIndex: integer('slot_index'),
    duration: real('duration').notNull().default(1),
    conflicts: jsonb('conflicts')
      .$type<ScheduleConflictDetailDTO[]>()
      .default([])
      .notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('schedule_slot_classroom_time_unique_idx')
      .on(table.classroomId, table.dayOfWeek, table.slotIndex, table.scheduleId)
      .where(
        sql`classroom_id IS NOT NULL AND day_of_week IS NOT NULL AND slot_index IS NOT NULL`
      ),
  ]
);

export const scheduleSlotInclusionsTable = pgTable(
  'schedule_slot_inclusion',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scheduleId: uuid('schedule_id')
      .notNull()
      .references(() => schedulesTable.id, { onDelete: 'cascade' }),
    slotId: uuid('slot_id')
      .notNull()
      .references(() => scheduleSlotsTable.id, { onDelete: 'cascade' }),
    conflicts: jsonb('conflicts')
      .$type<ScheduleConflictDetailDTO[]>()
      .default([])
      .notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('schedule_slot_inclusion_unique_idx').on(
      table.scheduleId,
      table.slotId
    ),
  ]
);

export type DrizzleScheduleSlot = typeof scheduleSlotsTable.$inferSelect;
export type NewDrizzleScheduleSlot = typeof scheduleSlotsTable.$inferInsert;
export type DrizzleScheduleSlotInclusion =
  typeof scheduleSlotInclusionsTable.$inferSelect;
export type NewDrizzleScheduleSlotInclusion =
  typeof scheduleSlotInclusionsTable.$inferInsert;
