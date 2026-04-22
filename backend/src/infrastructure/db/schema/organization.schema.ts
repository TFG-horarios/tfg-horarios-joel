import { pgTable, uuid, text, timestamp, time, integer } from 'drizzle-orm/pg-core';
import { periodTypeEnum } from './enums.schema';

export const organization = pgTable('organization', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  periodType: periodTypeEnum('period_type').notNull(),
  morningStart: time('morning_start').notNull().default('08:00:00'),
  afternoonStart: time('afternoon_start').notNull().default('14:00:00'),
  morningEnd: time('morning_end').notNull().default('14:00:00'),
  afternoonEnd: time('afternoon_end').notNull().default('20:00:00'),
  slotDurationMinutes: integer('slot_duration_minutes').notNull().default(60),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Organization = typeof organization.$inferSelect;
export type NewOrganization = typeof organization.$inferInsert;
