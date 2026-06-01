import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import type { DbConnection } from '@/core/db/connection';
import path from 'path';
import * as userSchema from '@/modules/user/infrastructure/db/drizzle.user.schema';
import * as organizationSchema from '@/modules/organization/infrastructure/db/drizzle.organization.schema';
import * as memberSchema from '@/modules/member/infrastructure/db/drizzle.member.schema';
import * as classroomSchema from '@/modules/classroom/infrastructure/db/drizzle.classroom.schema';
import * as subjectSchema from '@/modules/subject/infrastructure/db/drizzle.subject.schema';
import * as subjectGroupSchema from '@/modules/subject-group/infrastructure/db/drizzle.subject-group.schema';
import * as scheduleSchema from '@/modules/schedule/infrastructure/db/drizzle.schedule.schema';
import * as scheduleSlotSchema from '@/modules/schedule-slot/infrastructure/db/drizzle.schedule-slot.schema';
import * as degreeSchema from '@/modules/degree/infrastructure/db/drizzle.degree.schema';
import * as itinerarySchema from '@/modules/itinerary/infrastructure/db/drizzle.itinerary.schema';

const schema = {
  ...userSchema,
  ...organizationSchema,
  ...memberSchema,
  ...classroomSchema,
  ...subjectSchema,
  ...subjectGroupSchema,
  ...scheduleSchema,
  ...scheduleSlotSchema,
  ...degreeSchema,
  ...itinerarySchema,
};

export const pgliteClient = new PGlite();
const pgliteDb = drizzle(pgliteClient, { schema });
export const testDb = pgliteDb as unknown as DbConnection;
export type TestDbConnection = typeof testDb;

let isMigrated = false;

export const setupTestDb = async () => {
  if (!isMigrated) {
    const migrationsFolder = path.join(__dirname, '../drizzle');
    await migrate(pgliteDb, { migrationsFolder });
    isMigrated = true;
  }
};

export const cleanTestDb = async () => {
  await pgliteClient.query('TRUNCATE TABLE "schedule_slot" CASCADE');
  await pgliteClient.query('TRUNCATE TABLE "schedule" CASCADE');
  await pgliteClient.query('TRUNCATE TABLE "subject_group" CASCADE');
  await pgliteClient.query('TRUNCATE TABLE "subject" CASCADE');
  await pgliteClient.query('TRUNCATE TABLE "itinerary" CASCADE');
  await pgliteClient.query('TRUNCATE TABLE "classroom" CASCADE');
  await pgliteClient.query('TRUNCATE TABLE "degree" CASCADE');
  await pgliteClient.query('TRUNCATE TABLE "member" CASCADE');
  await pgliteClient.query('TRUNCATE TABLE "organization" CASCADE');
  await pgliteClient.query('TRUNCATE TABLE "user" CASCADE');
};
