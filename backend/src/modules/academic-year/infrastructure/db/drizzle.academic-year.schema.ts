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
} from 'drizzle-orm/pg-core';
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
    morningStart: time('morning_start').notNull(),
    morningEnd: time('morning_end').notNull(),
    afternoonStart: time('afternoon_start').notNull(),
    afternoonEnd: time('afternoon_end').notNull(),
    slotDurationMinutes: integer('slot_duration_minutes').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('unique_name_org').on(table.organizationId, table.name),
  ]
);

export type DrizzleAcademicYear = typeof academicYearsTable.$inferSelect;
export type NewDrizzleAcademicYear = typeof academicYearsTable.$inferInsert;
