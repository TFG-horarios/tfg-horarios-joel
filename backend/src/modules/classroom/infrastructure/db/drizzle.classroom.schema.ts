import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgEnum,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { organizationsTable } from '@/modules/organization/infrastructure/db/drizzle.organization.schema';
import { sql } from 'drizzle-orm';
import { CLASSROOM_TYPES } from '@tfg-horarios/shared';

export const classroomTypeEnum = pgEnum('classroom_type', CLASSROOM_TYPES);

export const classroomsTable = pgTable(
  'classroom',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    capacity: integer('capacity').notNull(),
    type: classroomTypeEnum('type').notNull().default('theory'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    uniqueIndex('classroom_name_org_idx')
      .on(table.organizationId, table.name)
      .where(sql`deleted_at IS NULL`),
  ]
);

export type DrizzleClassroom = typeof classroomsTable.$inferSelect;
export type DrizzleNewClassroom = typeof classroomsTable.$inferInsert;
