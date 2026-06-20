import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  pgEnum,
  varchar,
} from 'drizzle-orm/pg-core';
import { usersTable } from '@/modules/user/infrastructure/db/drizzle.user.schema';
import { organizationsTable } from '@/modules/organization/infrastructure/db/drizzle.organization.schema';

export const notificationTypeEnum = pgEnum('notification_type', [
  'INFO',
  'SUCCESS',
  'WARNING',
  'ERROR',
]);

export const notificationsTable = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id').references(
    () => organizationsTable.id,
    { onDelete: 'cascade' }
  ),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  type: notificationTypeEnum('type').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type DrizzleNotification = typeof notificationsTable.$inferSelect;
export type DrizzleNewNotification = typeof notificationsTable.$inferInsert;
