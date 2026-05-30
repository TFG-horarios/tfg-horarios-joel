import {
  pgTable,
  uuid,
  integer,
  timestamp,
  uniqueIndex,
  real,
} from 'drizzle-orm/pg-core';
import { schedulesTable } from '@/modules/schedule/infrastructure/db/drizzle.schedule.schema';
import { subjectGroupsTable } from '@/modules/subject-group/infrastructure/db/drizzle.subject-group.schema';
import { classroom } from '@/modules/classroom/infrastructure/db/drizzle.classroom.schema';
import { sql } from 'drizzle-orm';

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
    classroomId: uuid('classroom_id').references(() => classroom.id, {
      onDelete: 'restrict',
    }),
    dayOfWeek: integer('day_of_week'),
    slotIndex: integer('slot_index'),
    duration: real('duration').notNull().default(1),
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

export type DrizzleScheduleSlot = typeof scheduleSlotsTable.$inferSelect;
export type NewDrizzleScheduleSlot = typeof scheduleSlotsTable.$inferInsert;
