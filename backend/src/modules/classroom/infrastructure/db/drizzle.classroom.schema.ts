import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { organizationsTable as organization } from '../../../organization/infrastructure/db/drizzle.organization.schema';

export const classroom = pgTable(
  'classroom',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    capacity: integer('capacity').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [unique().on(table.organizationId, table.name)]
);

export type Classroom = typeof classroom.$inferSelect;
export type NewClassroom = typeof classroom.$inferInsert;
