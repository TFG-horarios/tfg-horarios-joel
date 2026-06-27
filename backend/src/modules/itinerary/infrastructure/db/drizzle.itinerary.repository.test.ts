import { describe, expect, test, beforeAll, beforeEach } from 'bun:test';
import { DrizzleItineraryRepository } from './drizzle.itinerary.repository';
import { Itinerary } from '../../domain/itinerary.entity';
import { ConflictError } from '@/core/errors/app.error';
import { eq, and, isNull } from 'drizzle-orm';
import { subjectsTable } from '@/modules/subject/infrastructure/db/drizzle.subject.schema';
import { subjectGroupsTable } from '@/modules/subject-group/infrastructure/db/drizzle.subject-group.schema';
import { setupTestDb, cleanTestDb, testDb } from '@/tests/setup-db';
import {
  seedTestDb,
  testOrgId,
  testDegreeId,
  testItineraryId,
  seedTestSubject,
} from '@/tests/seed-db';
import { degreesTable } from '@/modules/degree/infrastructure/db/drizzle.degree.schema';

describe('DrizzleItineraryRepository Integration', () => {
  let repository: DrizzleItineraryRepository;

  beforeAll(async () => {
    await setupTestDb();
    repository = new DrizzleItineraryRepository(testDb);
  });

  beforeEach(async () => {
    await cleanTestDb();
    await seedTestDb(testDb);
  });

  const createValidItinerary = () =>
    Itinerary.create({
      organizationId: testOrgId,
      degreeId: testDegreeId,
      name: 'Software Engineering',
      code: 'SE101',
    });

  test('should create and retrieve an itinerary by ID', async () => {
    const itinerary = createValidItinerary();
    await repository.create(itinerary);
    const foundItinerary = await repository.findById(itinerary.id, testOrgId);
    expect(foundItinerary).not.toBeNull();
    expect(foundItinerary?.id).toBe(itinerary.id);
    expect(foundItinerary?.name).toBe('Software Engineering');
    expect(foundItinerary?.code).toBe('SE101');
  });

  test('should return null if itinerary not found by ID', async () => {
    const foundItinerary = await repository.findById(
      '99999999-9999-4ef8-bb6d-6bb9bd380a33',
      testOrgId
    );
    expect(foundItinerary).toBeNull();
  });

  test('should return null if itinerary belongs to different org', async () => {
    const itinerary = createValidItinerary();
    await repository.create(itinerary);
    const foundItinerary = await repository.findById(
      itinerary.id,
      'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'
    );
    expect(foundItinerary).toBeNull();
  });

  test('should find all itineraries in an organization', async () => {
    const itinerary1 = Itinerary.create({
      organizationId: testOrgId,
      degreeId: testDegreeId,
      name: 'Path 1',
      code: 'P1',
    });
    const itinerary2 = Itinerary.create({
      organizationId: testOrgId,
      degreeId: testDegreeId,
      name: 'Path 2',
      code: 'P2',
    });
    await repository.createMany([itinerary1, itinerary2]);
    const foundItineraries = await repository.findAll(testOrgId);
    expect(foundItineraries.length).toBe(3);
    expect(foundItineraries.map((i) => i.id)).toContain(itinerary1.id);
    expect(foundItineraries.map((i) => i.id)).toContain(itinerary2.id);
  });

  test('should filter itineraries by search, code, and degreeId', async () => {
    const degreeId2 = 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const itinerary1 = Itinerary.create({
      organizationId: testOrgId,
      degreeId: testDegreeId,
      name: 'Software Engineering',
      code: 'SWE',
    });
    const itinerary2 = Itinerary.create({
      organizationId: testOrgId,
      degreeId: testDegreeId,
      name: 'Computer Engineering',
      code: 'CE',
    });
    const itinerary3 = Itinerary.create({
      organizationId: testOrgId,
      degreeId: degreeId2,
      name: 'Software Testing',
      code: 'ST',
    });
    await testDb.insert(degreesTable).values({
      id: degreeId2,
      organizationId: testOrgId,
      name: 'Degree 2',
      code: 'D2',
    });
    await repository.createMany([itinerary1, itinerary2, itinerary3]);
    const searchResults = await repository.findPaginated(testOrgId, {
      search: 'software',
    });
    expect(searchResults.data.length).toBe(3);
    expect(searchResults.data.map((i) => i.name)).toContain(
      'Software Engineering'
    );
    expect(searchResults.data.map((i) => i.name)).toContain('Software Testing');
    const codeResults = await repository.findPaginated(testOrgId, {
      code: 'CE',
    });
    expect(codeResults.data.length).toBe(1);
    expect(codeResults.data[0]?.name).toBe('Computer Engineering');
    const degreeResults = await repository.findPaginated(testOrgId, {
      degreeId: testDegreeId,
    });
    expect(degreeResults.data.length).toBe(3);
    expect(degreeResults.data.map((i) => i.name)).not.toContain(
      'Software Testing'
    );
    const combinedResults = await repository.findPaginated(testOrgId, {
      search: 'Engineering',
      code: 'SWE',
      degreeId: testDegreeId,
    });
    expect(combinedResults.data.length).toBe(1);
    expect(combinedResults.data[0]?.code).toBe('SWE');
  });

  test('should find identifiers of itineraries in an organization', async () => {
    const itinerary1 = Itinerary.create({
      organizationId: testOrgId,
      degreeId: testDegreeId,
      name: 'Path 1',
      code: 'ID1',
    });
    const itinerary2 = Itinerary.create({
      organizationId: testOrgId,
      degreeId: testDegreeId,
      name: 'Path 2',
      code: 'ID2',
    });
    await repository.createMany([itinerary1, itinerary2]);
    const identifiers = await repository.findIdentifiers(testOrgId);
    expect(identifiers).toContain('ID1');
    expect(identifiers).toContain('ID2');
  });

  test('should throw ConflictError on duplicate itinerary code', async () => {
    const itinerary = createValidItinerary();
    await repository.create(itinerary);
    const itineraryDuplicate = Itinerary.create({
      organizationId: testOrgId,
      degreeId: testDegreeId,
      name: 'Other Path',
      code: 'SE101',
    });
    await expect(repository.create(itineraryDuplicate)).rejects.toThrow(
      ConflictError
    );
  });

  test('should update an itinerary successfully', async () => {
    const itinerary = createValidItinerary();
    await repository.create(itinerary);
    itinerary.update('Updated Name', 'UP101');
    await repository.update(itinerary);
    const updatedItinerary = await repository.findById(itinerary.id, testOrgId);
    expect(updatedItinerary?.name).toBe('Updated Name');
    expect(updatedItinerary?.code).toBe('UP101');
  });

  test('should soft delete an itinerary successfully', async () => {
    const subjectId = 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a00';
    await seedTestSubject(
      testDb,
      subjectId,
      'SUBJ_ITIN',
      testItineraryId,
      'Itinerary Subject'
    );

    const groupId = 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a00';
    const now = new Date();
    await testDb.insert(subjectGroupsTable).values({
      id: groupId,
      organizationId: testOrgId,
      subjectId: subjectId,
      name: 'Group ITIN',
      groupType: 'practices',
      shift: 'morning',
      groupNumber: 1,
      weeklyHours: '2',
      numberOfStudents: 30,
      createdAt: now,
      updatedAt: now,
    });
    await repository.delete(testItineraryId, testOrgId);
    const foundItinerary = await repository.findById(
      testItineraryId,
      testOrgId
    );
    expect(foundItinerary).toBeNull();
    const historicalItineraries = await repository.findAll(testOrgId, true);
    expect(
      historicalItineraries.find(
        (itinerary) => itinerary.id === testItineraryId
      )?.deletedAt
    ).toBeInstanceOf(Date);
    const subjects = await testDb
      .select()
      .from(subjectsTable)
      .where(
        and(eq(subjectsTable.id, subjectId), isNull(subjectsTable.deletedAt))
      );
    expect(subjects.length).toBe(0);
    const groups = await testDb
      .select()
      .from(subjectGroupsTable)
      .where(
        and(
          eq(subjectGroupsTable.id, groupId),
          isNull(subjectGroupsTable.deletedAt)
        )
      );
    expect(groups.length).toBe(0);
  });

  test('should soft delete all itineraries successfully', async () => {
    const itinerary1 = createValidItinerary();
    const itinerary2 = Itinerary.create({
      organizationId: testOrgId,
      degreeId: testDegreeId,
      name: 'Computer Science',
      code: 'CS101',
    });
    await repository.createMany([itinerary1, itinerary2]);
    const beforeDelete = await repository.findAll(testOrgId);
    expect(beforeDelete.length).toBeGreaterThan(0);
    await repository.deleteAll(testOrgId);
    const afterDelete = await repository.findAll(testOrgId);
    expect(afterDelete.length).toBe(0);
  });

  test('should replace itineraries successfully', async () => {
    const itinerary1 = createValidItinerary();
    await repository.create(itinerary1);

    const newItinerary = Itinerary.create({
      organizationId: testOrgId,
      degreeId: testDegreeId,
      name: 'New Itinerary',
      code: 'NI',
    });
    await repository.replace([newItinerary], testOrgId);
    const allItineraries = await repository.findAll(testOrgId);
    expect(allItineraries.length).toBe(1);
    expect(allItineraries[0]?.id).toBe(newItinerary.id);
    expect(allItineraries[0]?.name).toBe('New Itinerary');
  });
});
