import { pgTable, uuid, integer, timestamp, time } from 'drizzle-orm/pg-core';
import { schedulesTable } from '@/modules/schedule/infrastructure/db/drizzle.schedule.schema';
import { subjectGroupsTable } from '@/modules/subject-group/infrastructure/db/drizzle.subject-group.schema';
import { classroom } from '@/modules/classroom/infrastructure/db/drizzle.classroom.schema';

export const scheduleSlotsTable = pgTable('schedule_slot', {
  id: uuid('id').primaryKey().defaultRandom(),
  scheduleId: uuid('schedule_id')
    .notNull()
    .references(() => schedulesTable.id, { onDelete: 'cascade' }),
  subjectGroupId: uuid('subject_group_id')
    .notNull()
    .references(() => subjectGroupsTable.id, { onDelete: 'restrict' }),
  classroomId: uuid('classroom_id')
    .notNull()
    .references(() => classroom.id, { onDelete: 'restrict' }),
  dayOfWeek: integer('day_of_week').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
