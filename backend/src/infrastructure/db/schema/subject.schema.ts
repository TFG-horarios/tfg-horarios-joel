import {
  pgTable,
  uuid,
  text,
  unique,
  timestamp,
  integer,
} from 'drizzle-orm/pg-core';
import { organization } from './organization.schema';
import { shiftEnum } from './enums.schema';

export const subject = pgTable(
  'subject',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    code: text('code').notNull(),
    availableShifts: shiftEnum('available_shifts').array().notNull(),
    numberOfStudents: integer('number_of_students').notNull(),
    courseYear: integer('course_year').notNull(),
    period: integer('period').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [unique().on(table.organizationId, table.code)]
);

export type Subject = typeof subject.$inferSelect;
export type NewSubject = typeof subject.$inferInsert;
