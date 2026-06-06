import { type TestDbConnection } from './setup-db';
import { usersTable } from '@/modules/user/infrastructure/db/drizzle.user.schema';
import { organizationsTable } from '@/modules/organization/infrastructure/db/drizzle.organization.schema';
import { degreesTable } from '@/modules/degree/infrastructure/db/drizzle.degree.schema';
import { itinerariesTable } from '@/modules/itinerary/infrastructure/db/drizzle.itinerary.schema';
import { subjectsTable } from '@/modules/subject/infrastructure/db/drizzle.subject.schema';
import { subjectGroupsTable } from '@/modules/subject-group/infrastructure/db/drizzle.subject-group.schema';
import { classroomsTable } from '@/modules/classroom/infrastructure/db/drizzle.classroom.schema';
import { schedulesTable } from '@/modules/schedule/infrastructure/db/drizzle.schedule.schema';

export const testUserId = '10eebc99-9c0b-4ef8-bb6d-6bb9bd380a00';
export const testOrgId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
export const testDegreeId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
export const testItineraryId = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
export const testSubjectId = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';
export const testSubjectGroupId = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';
export const testClassroomId = 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66';
export const testScheduleId = '20eebc99-9c0b-4ef8-bb6d-6bb9bd380a77';

export const seedTestUser = async (
  db: TestDbConnection,
  id: string,
  email: string,
  name = 'Seed User'
) => {
  const now = new Date();
  await db.insert(usersTable).values({
    id,
    name,
    email,
    password: 'hashedpassword',
    createdAt: now,
    updatedAt: now,
  });
};

export const seedTestSubject = async (
  db: TestDbConnection,
  id: string,
  code: string,
  itineraryId: string | null = null,
  name: string = 'Seed Subject'
) => {
  const now = new Date();
  await db.insert(subjectsTable).values({
    id,
    organizationId: testOrgId,
    degreeId: testDegreeId,
    itineraryId,
    name,
    code,
    availableShifts: ['morning', 'afternoon'],
    numberOfStudents: 100,
    courseYear: 1,
    period: 1,
    weeklyHours: 4,
    isCommon: false,
    createdAt: now,
    updatedAt: now,
  });
};

export const seedTestDb = async (db: TestDbConnection) => {
  const now = new Date();

  await seedTestUser(db, testUserId, 'seed@example.com');

  await db.insert(organizationsTable).values({
    id: testOrgId,
    name: 'Seed Org',
    periodType: 'semester',
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(degreesTable).values({
    id: testDegreeId,
    organizationId: testOrgId,
    name: 'Seed Computer Science',
    code: 'SEEDCS101',
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(itinerariesTable).values({
    id: testItineraryId,
    organizationId: testOrgId,
    degreeId: testDegreeId,
    name: 'Seed Software Engineering',
    code: 'SEEDSE101',
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(subjectsTable).values({
    id: testSubjectId,
    organizationId: testOrgId,
    degreeId: testDegreeId,
    name: 'Seed Mathematics',
    code: 'SEEDMATH101',
    availableShifts: ['morning'],
    numberOfStudents: 100,
    courseYear: 1,
    period: 1,
    weeklyHours: 4,
    isCommon: true,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(subjectGroupsTable).values({
    id: testSubjectGroupId,
    organizationId: testOrgId,
    subjectId: testSubjectId,
    name: 'Seed T1',
    groupType: 'practices',
    shift: 'morning',
    groupNumber: 99,
    weeklyHours: '2',
    numberOfStudents: 50,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(classroomsTable).values({
    id: testClassroomId,
    organizationId: testOrgId,
    name: 'SEED-A-101',
    capacity: 50,
    type: 'theory',
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(schedulesTable).values({
    id: testScheduleId,
    organizationId: testOrgId,
    degreeId: testDegreeId,
    academicYear: '2030/2031',
    shift: 'morning',
    courseYear: 1,
    period: 1,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  });
};
