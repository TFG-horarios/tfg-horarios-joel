import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const usersTable = pgTable('user', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type DrizzleUser = typeof usersTable.$inferSelect;
export type NewDrizzleUser = typeof usersTable.$inferInsert;
