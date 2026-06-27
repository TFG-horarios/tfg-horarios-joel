import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  date,
  integer,
  time,
  pgEnum,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizationsTable } from '@/modules/organization/infrastructure/db/drizzle.organization.schema';

export const periodTypeEnum = pgEnum('period_type', [
  'semester',
  'trimester',
  'annual',
]);

export const academicYearsTable = pgTable(
  'academic_year',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    isActive: boolean('is_active').notNull().default(false),
    period0Start: date('period_0_start'),
    period0End: date('period_0_end'),
    period1Start: date('period_1_start'),
    period1End: date('period_1_end'),
    period2Start: date('period_2_start'),
    period2End: date('period_2_end'),
    periodType: periodTypeEnum('period_type').notNull(),
    breakDurationMinutes: integer('break_duration_minutes').notNull(),
    centerOpeningTime: time('center_opening_time').notNull(),
    centerClosingTime: time('center_closing_time').notNull(),
    slotDurationMinutes: integer('slot_duration_minutes').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('unique_name_org').on(table.organizationId, table.name),
    check(
      'academic_year_slot_duration_positive',
      sql`${table.slotDurationMinutes} > 0`
    ),
    check(
      'academic_year_break_duration_nonnegative',
      sql`${table.breakDurationMinutes} >= 0`
    ),
    check(
      'academic_year_center_hours_order',
      sql`${table.centerClosingTime} > ${table.centerOpeningTime}`
    ),
  ]
);

export type DrizzleAcademicYear = typeof academicYearsTable.$inferSelect;
export type NewDrizzleAcademicYear = typeof academicYearsTable.$inferInsert;
