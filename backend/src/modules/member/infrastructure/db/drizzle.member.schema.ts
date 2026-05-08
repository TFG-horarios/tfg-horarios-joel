import { pgTable, uuid, unique, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { organizationsTable } from '@/modules/organization/infrastructure/db/drizzle.organization.schema';
import { usersTable } from '@/modules/user/infrastructure/db/drizzle.user.schema';

export const roleEnum = pgEnum('role', ['admin', 'editor', 'viewer']);

export const membersTable = pgTable(
  'member',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    role: roleEnum('role').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [unique().on(table.organizationId, table.userId)]
);

export type DrizzleMember = typeof membersTable.$inferSelect;
export type NewDrizzleMember = typeof membersTable.$inferInsert;
