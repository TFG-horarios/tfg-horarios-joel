import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { organizationsTable } from '@/modules/organization/infrastructure/db/drizzle.organization.schema';
import { degreesTable } from '@/modules/degree/infrastructure/db/drizzle.degree.schema';
import { itinerariesTable } from '@/modules/itinerary/infrastructure/db/drizzle.itinerary.schema';
import { sql } from 'drizzle-orm';

export const shiftEnum = pgEnum('shift', ['morning', 'afternoon']);

export const subjectsTable = pgTable(
  'subject',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    degreeId: uuid('degree_id')
      .notNull()
      .references(() => degreesTable.id, { onDelete: 'cascade' }),
    itineraryId: uuid('itinerary_id').references(() => itinerariesTable.id, {
      onDelete: 'restrict',
    }),
    name: text('name').notNull(),
    code: text('code').notNull(),
    availableShifts: shiftEnum('available_shifts').array().notNull(),
    numberOfStudents: integer('number_of_students').notNull(),
    courseYear: integer('course_year').notNull(),
    period: integer('period').notNull().default(0),
    weeklyHours: integer('weekly_hours').notNull().default(0),
    isCommon: boolean('is_common').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    uniqueIndex('subject_code_org_idx')
      .on(table.organizationId, table.code)
      .where(sql`deleted_at IS NULL`),
  ]
);

export type DrizzleSubject = typeof subjectsTable.$inferSelect;
export type NewDrizzleSubject = typeof subjectsTable.$inferInsert;
