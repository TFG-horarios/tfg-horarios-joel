import {
  pgTable,
  uuid,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { organizationsTable } from '@/modules/organization/infrastructure/db/drizzle.organization.schema';
import { sql } from 'drizzle-orm';

export const degreesTable = pgTable(
  'degree',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    code: text('code').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    uniqueIndex('degree_code_org_idx')
      .on(table.organizationId, table.code)
      .where(sql`deleted_at IS NULL`),
    uniqueIndex('degree_name_org_idx')
      .on(table.organizationId, table.name)
      .where(sql`deleted_at IS NULL`),
  ]
);
