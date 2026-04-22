import { pgEnum } from 'drizzle-orm/pg-core';

export const shiftEnum = pgEnum('shift', ['morning', 'afternoon']);

export const groupTypeEnum = pgEnum('group_type', [
  'theory',
  'problems',
  'practices',
]);

export const roleEnum = pgEnum('role', ['admin', 'editor', 'viewer']);

export const scheduleStatusEnum = pgEnum('schedule_status', [
  'draft',
  'published',
  'archived',
]);

export const periodTypeEnum = pgEnum('period_type', [
  'semester', // 2 periods
  'trimestral', // 3 periods
  'annual', // 1 period
]);
