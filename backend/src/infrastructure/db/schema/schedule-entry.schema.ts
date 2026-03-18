import { pgTable, uuid, integer, time, timestamp } from 'drizzle-orm/pg-core';
import { schedule } from './schedule.schema';
import { subjectGroup } from './subject-group.schema';
import { classroom } from './classroom.schema';

export const scheduleEntry = pgTable('schedule_entry', {
  id: uuid('id').primaryKey().defaultRandom(),
  scheduleId: uuid('schedule_id')
    .notNull()
    .references(() => schedule.id, { onDelete: 'cascade' }),
  subjectGroupId: uuid('subject_group_id')
    .notNull()
    .references(() => subjectGroup.id, { onDelete: 'cascade' }),
  classroomId: uuid('classroom_id')
    .notNull()
    .references(() => classroom.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type ScheduleEntry = typeof scheduleEntry.$inferSelect;
export type NewScheduleEntry = typeof scheduleEntry.$inferInsert;
