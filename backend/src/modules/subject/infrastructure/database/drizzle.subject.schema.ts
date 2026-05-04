import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  unique,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { organizationsTable } from '../../../organization/infrastructure/database/drizzle.organization.schema';

export const shiftEnum = pgEnum('shift', ['morning', 'afternoon']);
export const groupTypeEnum = pgEnum('group_type', [
  'theory',
  'problems',
  'practices',
]);

export const subjectsTable = pgTable(
  'subject',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    code: text('code').notNull(),
    availableShifts: shiftEnum('available_shifts').array().notNull(),
    numberOfStudents: integer('number_of_students').notNull(),
    courseYear: integer('course_year').notNull(),
    degree: text('degree').notNull(),
    period: integer('period').notNull().default(0),
    weeklyHours: integer('weekly_hours').notNull().default(0),
    isCommon: boolean('is_common').notNull().default(true),
    itineraryName: text('itinerary_name'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [unique().on(table.organizationId, table.code)]
);

export type DrizzleSubject = typeof subjectsTable.$inferSelect;
export type NewDrizzleSubject = typeof subjectsTable.$inferInsert;
