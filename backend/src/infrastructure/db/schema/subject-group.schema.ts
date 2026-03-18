import {
  pgTable,
  uuid,
  integer,
  numeric,
  unique,
  timestamp,
  text,
} from 'drizzle-orm/pg-core';
import { subject } from './subject.schema';
import { groupTypeEnum, shiftEnum } from './enums.schema';

export const subjectGroup = pgTable(
  'subject_group',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    subjectId: uuid('subject_id')
      .notNull()
      .references(() => subject.id, { onDelete: 'cascade' }),
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

export type SubjectGroup = typeof subjectGroup.$inferSelect;
export type NewSubjectGroup = typeof subjectGroup.$inferInsert;
