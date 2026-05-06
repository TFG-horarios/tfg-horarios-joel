import { pgTable, uuid, unique, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { organizationsTable } from '../../../organization/infrastructure/db/drizzle.organization.schema';

const roleEnum = pgEnum('role', ['admin', 'editor', 'viewer']);

export const organizationMembersTable = pgTable(
  'organization_member',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    role: roleEnum('role').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [unique().on(table.organizationId, table.userId)]
);

export type DrizzleOrganizationMember =
  typeof organizationMembersTable.$inferSelect;
export type NewDrizzleOrganizationMember =
  typeof organizationMembersTable.$inferInsert;
