import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
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
import * as academicYearSchema from '@/modules/academic-year/infrastructure/db/drizzle.academic-year.schema';
import * as classroomReservationSchema from '@/modules/classroom-reservation/infrastructure/db/drizzle.classroom-reservation.schema';
import * as notificationSchema from '@/modules/notification/infrastructure/db/drizzle.notification.schema';
import * as scheduleTimeConfigSchema from '@/modules/schedule-time-config/infrastructure/db/drizzle.schedule-time-config.schema';

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
  ...academicYearSchema,
  ...classroomReservationSchema,
  ...notificationSchema,
  ...scheduleTimeConfigSchema,
};
const connectionString = Bun.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not defined. Please set it in your .env file.'
  );
}

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
export type DbConnection = typeof db;
