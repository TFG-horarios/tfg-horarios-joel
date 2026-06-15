import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const organizationsTable = pgTable('organization', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type DrizzleOrganization = typeof organizationsTable.$inferSelect;
export type NewDrizzleOrganization = typeof organizationsTable.$inferInsert;
