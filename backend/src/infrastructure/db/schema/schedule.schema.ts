import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { organization } from './organization.schema';
import { scheduleStatusEnum, shiftEnum } from './enums.schema';

export const schedule = pgTable(
  'schedule',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
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

export type Schedule = typeof schedule.$inferSelect;
export type NewSchedule = typeof schedule.$inferInsert;
