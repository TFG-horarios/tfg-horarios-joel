import {
  pgTable,
  uuid,
  timestamp,
  varchar,
  integer,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { organizationsTable } from '@/modules/organization/infrastructure/db/drizzle.organization.schema';
import { usersTable } from '@/modules/user/infrastructure/db/drizzle.user.schema';
import { classroomsTable } from '@/modules/classroom/infrastructure/db/drizzle.classroom.schema';
import { academicYearsTable } from '@/modules/academic-year/infrastructure/db/drizzle.academic-year.schema';

export const reservationStatusEnum = pgEnum('reservation_status', [
  'PENDING',
  'ACCEPTED',
  'REJECTED',
  'CANCELLED',
]);

export const classroomReservations = pgTable('classroom_reservations', {
  id: uuid('id').primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizationsTable.id, { onDelete: 'cascade' }),
  requesterUserId: uuid('requester_user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  classroomId: uuid('classroom_id')
    .notNull()
    .references(() => classroomsTable.id, { onDelete: 'cascade' }),
  academicYearId: uuid('academic_year_id')
    .notNull()
    .references(() => academicYearsTable.id, { onDelete: 'cascade' }),
  date: varchar('date', { length: 10 }).notNull(),
  slotIndex: integer('slot_index').notNull(),
  status: reservationStatusEnum('status').notNull().default('PENDING'),
  reason: varchar('reason', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type DrizzleClassroomReservation =
  typeof classroomReservations.$inferSelect;
export type DrizzleNewClassroomReservation =
  typeof classroomReservations.$inferInsert;
