import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { degreesTable } from '@/modules/degree/infrastructure/db/drizzle.degree.schema';
import { organizationsTable } from '@/modules/organization/infrastructure/db/drizzle.organization.schema';

export const itinerariesTable = pgTable(
  'itinerary',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    degreeId: uuid('degree_id')
      .notNull()
      .references(() => degreesTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    uniqueIndex('itinerary_name_degree_idx')
      .on(table.degreeId, table.name)
      .where(sql`deleted_at IS NULL`),
  ]
);
