import {
  pgTable,
  uuid,
  integer,
  numeric,
  timestamp,
  text,
  pgEnum,
  uniqueIndex,
  boolean,
} from 'drizzle-orm/pg-core';
import { subjectsTable } from '@/modules/subject/infrastructure/db/drizzle.subject.schema';
import { shiftEnum } from '@/modules/subject/infrastructure/db/drizzle.subject.schema';
import { organizationsTable } from '@/modules/organization/infrastructure/db/drizzle.organization.schema';
import { sql } from 'drizzle-orm';
import { GROUP_TYPES } from '@tfg-horarios/shared';

export const groupTypeEnum = pgEnum('group_type', GROUP_TYPES);

export const subjectGroupsTable = pgTable(
  'subject_group',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    subjectId: uuid('subject_id')
      .notNull()
      .references(() => subjectsTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    groupType: groupTypeEnum('group_type').notNull(),
    shift: shiftEnum('shift').notNull(),
    groupNumber: integer('group_number').notNull(),
    weeklyHours: numeric('weekly_hours', { precision: 4, scale: 1 }).notNull(),
    numberOfStudents: integer('number_of_students').notNull(),
    needsComputerLab: boolean('needs_computer_lab').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    uniqueIndex('subject_group_logic_idx')
      .on(table.subjectId, table.groupType, table.groupNumber, table.shift)
      .where(sql`deleted_at IS NULL`),
  ]
);

export type DrizzleSubjectGroup = typeof subjectGroupsTable.$inferSelect;
export type NewDrizzleSubjectGroup = typeof subjectGroupsTable.$inferInsert;
