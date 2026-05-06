import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as userSchema from '../../modules/user/infrastructure/db/drizzle.user.schema';
import * as organizationSchema from '../../modules/organization/infrastructure/db/drizzle.organization.schema';
import * as organizationMemberSchema from '../../modules/organization-member/infrastructure/db/drizzle.organization-member.schema';
import * as classroomSchema from '../../modules/classroom/infrastructure/db/drizzle.classroom.schema';
import * as subjectSchema from '../../modules/subject/infrastructure/db/drizzle.subject.schema';
import * as subjectGroupSchema from '../../modules/subject-group/infrastructure/db/drizzle.subject-group.schema';
import * as scheduleSchema from '../../modules/schedule/drizzle.schedule.schema';

const schema = {
  ...userSchema,
  ...organizationSchema,
  ...organizationMemberSchema,
  ...classroomSchema,
  ...subjectSchema,
  ...subjectGroupSchema,
  ...scheduleSchema,
};
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not defined. Please set it in your .env file.'
  );
}

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
export type DbConnection = typeof db;
