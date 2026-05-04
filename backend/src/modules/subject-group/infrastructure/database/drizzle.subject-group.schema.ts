import {
  pgTable,
  uuid,
  integer,
  numeric,
  unique,
  timestamp,
  text,
} from 'drizzle-orm/pg-core';
import { subjectsTable } from '../../../subject/infrastructure/database/drizzle.subject.schema';
import {
  shiftEnum,
  groupTypeEnum,
} from '../../../subject/infrastructure/database/drizzle.subject.schema';

export const subjectGroupsTable = pgTable(
  'subject_group',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    subjectId: uuid('subject_id')
      .notNull()
      .references(() => subjectsTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    groupType: groupTypeEnum('group_type').notNull(),
    shift: shiftEnum('shift').notNull(),
    groupNumber: integer('group_number').notNull(),
    weeklyHours: numeric('weekly_hours', { precision: 4, scale: 1 }).notNull(),
    numberOfStudents: integer('number_of_students').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique().on(
      table.subjectId,
      table.groupType,
      table.groupNumber,
      table.shift
    ),
  ]
);

export type DrizzleSubjectGroup = typeof subjectGroupsTable.$inferSelect;
export type NewDrizzleSubjectGroup = typeof subjectGroupsTable.$inferInsert;
