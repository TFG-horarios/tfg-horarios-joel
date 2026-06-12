import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  date,
} from 'drizzle-orm/pg-core';
import { organizationsTable } from '@/modules/organization/infrastructure/db/drizzle.organization.schema';

export const academicYearsTable = pgTable('academic_year', {
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
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type DrizzleAcademicYear = typeof academicYearsTable.$inferSelect;
export type NewDrizzleAcademicYear = typeof academicYearsTable.$inferInsert;
