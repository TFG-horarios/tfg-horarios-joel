import {
  boolean,
  integer,
  pgTable,
  time,
  timestamp,
  uniqueIndex,
  uuid,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizationsTable } from '@/modules/organization/infrastructure/db/drizzle.organization.schema';
import { academicYearsTable } from '@/modules/academic-year/infrastructure/db/drizzle.academic-year.schema';
import { degreesTable } from '@/modules/degree/infrastructure/db/drizzle.degree.schema';
import { itinerariesTable } from '@/modules/itinerary/infrastructure/db/drizzle.itinerary.schema';
import { shiftEnum } from '@/modules/subject/infrastructure/db/drizzle.subject.schema';

export const scheduleTimeConfigsTable = pgTable(
  'schedule_time_config',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    academicYearId: uuid('academic_year_id')
      .notNull()
      .references(() => academicYearsTable.id, { onDelete: 'cascade' }),
    degreeId: uuid('degree_id')
      .notNull()
      .references(() => degreesTable.id, { onDelete: 'cascade' }),
    itineraryId: uuid('itinerary_id').references(() => itinerariesTable.id, {
      onDelete: 'cascade',
    }),
    courseYear: integer('course_year').notNull(),
    period: integer('period').notNull(),
    shift: shiftEnum('shift').notNull(),
    startTime: time('start_time').notNull(),
    endTime: time('end_time').notNull(),
    hasBreak: boolean('has_break').notNull().default(false),
    breakAfterSlot: integer('break_after_slot'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('schedule_time_config_base_unique')
      .on(
        table.organizationId,
        table.academicYearId,
        table.degreeId,
        table.courseYear,
        table.period,
        table.shift
      )
      .where(sql`itinerary_id IS NULL`),
    uniqueIndex('schedule_time_config_itinerary_unique')
      .on(
        table.organizationId,
        table.academicYearId,
        table.degreeId,
        table.courseYear,
        table.period,
        table.shift,
        table.itineraryId
      )
      .where(sql`itinerary_id IS NOT NULL`),
    check(
      'schedule_time_config_hours_order',
      sql`${table.endTime} > ${table.startTime}`
    ),
    check(
      'schedule_time_config_break_consistency',
      sql`(${table.hasBreak} = false AND ${table.breakAfterSlot} IS NULL) OR (${table.hasBreak} = true AND ${table.breakAfterSlot} IS NOT NULL AND ${table.breakAfterSlot} > 0)`
    ),
  ]
);

export type DrizzleScheduleTimeConfig =
  typeof scheduleTimeConfigsTable.$inferSelect;
