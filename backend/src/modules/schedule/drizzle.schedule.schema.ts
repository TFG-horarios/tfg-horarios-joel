import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  unique,
  pgEnum,
  time,
} from 'drizzle-orm/pg-core';
import { organizationsTable } from '../organization/infrastructure/db/drizzle.organization.schema';
import { shiftEnum } from '../subject/infrastructure/db/drizzle.subject.schema';
import { subjectGroupsTable } from '../subject-group/infrastructure/db/drizzle.subject-group.schema';
import { classroom } from '../classroom/infrastructure/db/drizzle.classroom.schema';

export const scheduleStatusEnum = pgEnum('schedule_status', [
  'draft',
  'published',
  'archived',
]);

export const schedulesTable = pgTable(
  'schedule',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    academicYear: text('academic_year').notNull(),
    shift: shiftEnum('shift').notNull(),
    courseYear: integer('course_year').notNull(),
    period: integer('period').notNull(),
    status: scheduleStatusEnum('status').notNull().default('draft'),
    version: text('version').notNull().default('v1'),
    publishedAt: timestamp('published_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique().on(
      table.organizationId,
      table.academicYear,
      table.courseYear,
      table.shift,
      table.period,
      table.version
    ),
  ]
);

export type DrizzleSchedule = typeof schedulesTable.$inferSelect;
export type NewDrizzleSchedule = typeof schedulesTable.$inferInsert;

export const scheduleEntriesTable = pgTable('schedule_entry', {
  id: uuid('id').primaryKey().defaultRandom(),
  scheduleId: uuid('schedule_id')
    .notNull()
    .references(() => schedulesTable.id, { onDelete: 'cascade' }),
  subjectGroupId: uuid('subject_group_id')
    .notNull()
    .references(() => subjectGroupsTable.id, { onDelete: 'cascade' }),
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

export type DrizzleScheduleEntry = typeof scheduleEntriesTable.$inferSelect;
export type NewDrizzleScheduleEntry = typeof scheduleEntriesTable.$inferInsert;
