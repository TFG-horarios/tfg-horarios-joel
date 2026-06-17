import { describe, expect, test, beforeAll, beforeEach } from 'bun:test';
import { DrizzleSubjectRepository } from './drizzle.subject.repository';
import { Subject } from '../../domain/subject.entity';
import { ConflictError } from '@/core/errors/app.error';
import { setupTestDb, cleanTestDb, testDb } from '@/tests/setup-db';
import { eq, and, isNull } from 'drizzle-orm';
import { subjectGroupsTable } from '@/modules/subject-group/infrastructure/db/drizzle.subject-group.schema';
import {
  seedTestDb,
  testOrgId,
  testDegreeId,
  testItineraryId,
  testSubjectId,
  testSubjectGroupId,
} from '@/tests/seed-db';

describe('DrizzleSubjectRepository Integration', () => {
  let repository: DrizzleSubjectRepository;

  beforeAll(async () => {
    await setupTestDb();
    repository = new DrizzleSubjectRepository(testDb);
  });

  beforeEach(async () => {
    await cleanTestDb();
    await seedTestDb(testDb);
  });

  const createValidSubject = () =>
    Subject.create({
      organizationId: testOrgId,
      degreeId: testDegreeId,
      itineraryId: testItineraryId,
      name: 'Mathematics',
      code: 'MATH101',
      availableShifts: ['morning'],
      numberOfStudents: 100,
      courseYear: 1,
      period: 1,
      weeklyHours: 4,
      isCommon: false,
    });

  test('should create and retrieve a subject by ID', async () => {
    const subject = createValidSubject();
    await repository.create(subject);
    const foundSubject = await repository.findById(subject.id, testOrgId);
    expect(foundSubject).not.toBeNull();
    expect(foundSubject?.id).toBe(subject.id);
    expect(foundSubject?.name).toBe('Mathematics');
    expect(foundSubject?.code).toBe('MATH101');
  });

  test('should return null if subject not found by ID', async () => {
    const foundSubject = await repository.findById(
      'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
      testOrgId
    );
    expect(foundSubject).toBeNull();
  });

  test('should find all subjects in an organization', async () => {
    const subject1 = Subject.create({
      organizationId: testOrgId,
      degreeId: testDegreeId,
      itineraryId: testItineraryId,
      name: 'Subject 1',
      code: 'S1',
      availableShifts: ['morning'],
      numberOfStudents: 50,
      courseYear: 1,
      period: 1,
      weeklyHours: 4,
      isCommon: false,
    });
    const subject2 = Subject.create({
      organizationId: testOrgId,
      degreeId: testDegreeId,
      itineraryId: null,
      name: 'Subject 2',
      code: 'S2',
      availableShifts: ['afternoon'],
      numberOfStudents: 60,
      courseYear: 2,
      period: 2,
      weeklyHours: 3,
      isCommon: true,
    });
    await repository.createMany([subject1, subject2]);
    const foundSubjects = await repository.findAll(testOrgId);
    expect(foundSubjects.length).toBe(3);
    expect(foundSubjects.map((s) => s.id)).toContain(subject1.id);
    expect(foundSubjects.map((s) => s.id)).toContain(subject2.id);
  });

  test('should filter subjects by search, code, shift, period, degreeId, itineraryId, and courseYear', async () => {
    const subject1 = Subject.create({
      organizationId: testOrgId,
      degreeId: testDegreeId,
      itineraryId: testItineraryId,
      name: 'Software Testing',
      code: 'ST101',
      availableShifts: ['morning', 'afternoon'],
      numberOfStudents: 50,
      courseYear: 2,
      period: 1,
      weeklyHours: 4,
      isCommon: false,
    });
    const subject2 = Subject.create({
      organizationId: testOrgId,
      degreeId: testDegreeId,
      itineraryId: null,
      name: 'Advanced Mathematics',
      code: 'AM102',
      availableShifts: ['afternoon'],
      numberOfStudents: 60,
      courseYear: 3,
      period: 2,
      weeklyHours: 3,
      isCommon: true,
    });
    await repository.createMany([subject1, subject2]);
    const searchResults = await repository.findPaginated(testOrgId, {
      search: 'software',
    });
    expect(searchResults.data.length).toBe(1);
    expect(searchResults.data[0]?.name).toBe('Software Testing');
    const shiftResults = await repository.findPaginated(testOrgId, {
      shift: 'afternoon',
    });
    expect(shiftResults.data.length).toBe(2);
    const periodResults = await repository.findPaginated(testOrgId, {
      period: 2,
    });
    expect(periodResults.data.length).toBe(1);
    expect(periodResults.data[0]?.code).toBe('AM102');
    const courseResults = await repository.findPaginated(testOrgId, {
      courseYear: 3,
    });
    expect(courseResults.data.length).toBe(1);
    expect(courseResults.data[0]?.code).toBe('AM102');
    const commonResults = await repository.findPaginated(testOrgId, {
      itineraryId: 'common',
    });
    expect(commonResults.data.length).toBe(2);
    const specificItineraryResults = await repository.findPaginated(testOrgId, {
      itineraryId: testItineraryId,
    });
    expect(specificItineraryResults.data.length).toBe(1);
  });

  test('should find identifiers of subjects in an organization', async () => {
    const subject1 = Subject.create({
      organizationId: testOrgId,
      degreeId: testDegreeId,
      itineraryId: testItineraryId,
      name: 'Subject 1',
      code: 'ID1',
      availableShifts: ['morning'],
      numberOfStudents: 50,
      courseYear: 1,
      period: 1,
      weeklyHours: 4,
      isCommon: false,
    });
    const subject2 = Subject.create({
      organizationId: testOrgId,
      degreeId: testDegreeId,
      itineraryId: null,
      name: 'Subject 2',
      code: 'ID2',
      availableShifts: ['afternoon'],
      numberOfStudents: 60,
      courseYear: 2,
      period: 2,
      weeklyHours: 3,
      isCommon: true,
    });
    await repository.createMany([subject1, subject2]);
    const identifiers = await repository.findIdentifiers(testOrgId);
    expect(identifiers).toContain('ID1');
    expect(identifiers).toContain('ID2');
  });

  test('should throw ConflictError on duplicate subject code', async () => {
    const subject = createValidSubject();
    await repository.create(subject);
    const subjectDuplicate = Subject.create({
      organizationId: testOrgId,
      degreeId: testDegreeId,
      itineraryId: testItineraryId,
      name: 'Math II',
      code: 'MATH101',
      availableShifts: ['morning'],
      numberOfStudents: 100,
      courseYear: 1,
      period: 1,
      weeklyHours: 4,
      isCommon: false,
    });
    await expect(repository.create(subjectDuplicate)).rejects.toThrow(
      ConflictError
    );
  });

  test('should update a subject successfully', async () => {
    const subject = createValidSubject();
    await repository.create(subject);
    subject.update({
      name: 'Advanced Mathematics',
      code: 'MATH201',
      itineraryId: null,
      availableShifts: ['morning', 'afternoon'],
      numberOfStudents: 120,
      courseYear: 2,
      period: 2,
      weeklyHours: 5,
      isCommon: true,
    });
    await repository.update(subject);
    const updatedSubject = await repository.findById(subject.id, testOrgId);
    expect(updatedSubject?.name).toBe('Advanced Mathematics');
    expect(updatedSubject?.code).toBe('MATH201');
    expect(updatedSubject?.courseYear).toBe(2);
    expect(updatedSubject?.isCommon).toBe(true);
  });

  test('should soft delete a subject successfully', async () => {
    const beforeGroup = await testDb
      .select()
      .from(subjectGroupsTable)
      .where(
        and(
          eq(subjectGroupsTable.id, testSubjectGroupId),
          isNull(subjectGroupsTable.deletedAt)
        )
      );
    expect(beforeGroup.length).toBe(1);

    await repository.delete(testSubjectId, testOrgId);

    const foundSubject = await repository.findById(testSubjectId, testOrgId);
    expect(foundSubject).toBeNull();
    const afterGroup = await testDb
      .select()
      .from(subjectGroupsTable)
      .where(
        and(
          eq(subjectGroupsTable.id, testSubjectGroupId),
          isNull(subjectGroupsTable.deletedAt)
        )
      );
    expect(afterGroup.length).toBe(0);
  });

  test('should soft delete all subjects successfully', async () => {
    const subject1 = createValidSubject();
    const subject2 = Subject.create({
      organizationId: testOrgId,
      degreeId: testDegreeId,
      itineraryId: testItineraryId,
      name: 'Advanced Mathematics',
      code: 'MATH102',
      availableShifts: ['morning'],
      numberOfStudents: 100,
      courseYear: 1,
      period: 1,
      weeklyHours: 4,
      isCommon: false,
    });
    await repository.createMany([subject1, subject2]);
    const beforeDelete = await repository.findAll(testOrgId);
    expect(beforeDelete.length).toBeGreaterThan(0);
    await repository.deleteAll(testOrgId);
    const afterDelete = await repository.findAll(testOrgId);
    expect(afterDelete.length).toBe(0);
  });

  test('should replace subjects successfully', async () => {
    const subject1 = createValidSubject();
    await repository.create(subject1);
    const newSubject = Subject.create({
      organizationId: testOrgId,
      degreeId: testDegreeId,
      itineraryId: testItineraryId,
      name: 'New Subject',
      code: 'NS',
      availableShifts: ['morning'],
      numberOfStudents: 10,
      courseYear: 1,
      period: 1,
      weeklyHours: 2,
      isCommon: false,
    });
    await repository.replace([newSubject], testOrgId);
    const allSubjects = await repository.findAll(testOrgId);
    expect(allSubjects.length).toBe(1);
    expect(allSubjects[0]?.id).toBe(newSubject.id);
    expect(allSubjects[0]?.name).toBe('New Subject');
  });
});
