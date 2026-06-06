import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgEnum,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { organizationsTable } from '@/modules/organization/infrastructure/db/drizzle.organization.schema';
import { shiftEnum } from '@/modules/subject/infrastructure/db/drizzle.subject.schema';
import { itinerariesTable } from '@/modules/itinerary/infrastructure/db/drizzle.itinerary.schema';
import { degreesTable } from '@/modules/degree/infrastructure/db/drizzle.degree.schema';
import { sql } from 'drizzle-orm';

export const scheduleStatusEnum = pgEnum('schedule_status', [
  'draft',
  'published',
]);

export const schedulesTable = pgTable(
  'schedule',
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
    academicYear: text('academic_year').notNull(),
    shift: shiftEnum('shift').notNull(),
    courseYear: integer('course_year').notNull(),
    period: integer('period').notNull(),
    status: scheduleStatusEnum('status').notNull().default('draft'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('schedule_itinerary_unique_idx')
      .on(
        table.organizationId,
        table.degreeId,
        table.itineraryId,
        table.academicYear,
        table.courseYear,
        table.period,
        table.shift
      )
      .where(sql`itinerary_id IS NOT NULL`),
    uniqueIndex('schedule_common_unique_idx')
      .on(
        table.organizationId,
        table.degreeId,
        table.academicYear,
        table.courseYear,
        table.period,
        table.shift
      )
      .where(sql`itinerary_id IS NULL`),
  ]
);

export type DrizzleSchedule = typeof schedulesTable.$inferSelect;
export type NewDrizzleSchedule = typeof schedulesTable.$inferInsert;
