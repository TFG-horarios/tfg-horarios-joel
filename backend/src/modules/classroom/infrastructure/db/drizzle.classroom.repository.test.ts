import { describe, expect, test, beforeAll, beforeEach } from 'bun:test';
import { DrizzleClassroomRepository } from './drizzle.classroom.repository';
import { Classroom } from '../../domain/classroom.entity';
import { ConflictError } from '@/core/errors/app.error';
import { setupTestDb, cleanTestDb, testDb } from '@/tests/setup-db';
import {
  seedTestDb,
  testOrgId,
  testAcademicYearId,
  testPastAcademicYearId,
} from '@/tests/seed-db';

describe('DrizzleClassroomRepository Integration', () => {
  let repository: DrizzleClassroomRepository;

  beforeAll(async () => {
    await setupTestDb();
    repository = new DrizzleClassroomRepository(testDb);
  });

  beforeEach(async () => {
    await cleanTestDb();
    await seedTestDb(testDb);
  });

  const createValidClassroom = () =>
    Classroom.create({
      organizationId: testOrgId,
      name: 'A-101',
      capacity: 30,
      floor: 1,
      type: 'theory',
    });

  test('should create and retrieve a classroom by ID', async () => {
    const classroom = createValidClassroom();
    await repository.create(classroom);
    const foundClassroom = await repository.findById(classroom.id, testOrgId);
    expect(foundClassroom).not.toBeNull();
    expect(foundClassroom?.id).toBe(classroom.id);
    expect(foundClassroom?.name).toBe('A-101');
    expect(foundClassroom?.capacity).toBe(30);
    expect(foundClassroom?.floor).toBe(1);
  });

  test('should return null if classroom not found by ID', async () => {
    const foundClassroom = await repository.findById(
      'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      testOrgId
    );
    expect(foundClassroom).toBeNull();
  });

  test('should return null if classroom belongs to different org', async () => {
    const classroom = createValidClassroom();
    await repository.create(classroom);
    const foundClassroom = await repository.findById(
      classroom.id,
      'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'
    );
    expect(foundClassroom).toBeNull();
  });

  test('should find all classrooms in an organization', async () => {
    const classroom1 = Classroom.create({
      organizationId: testOrgId,
      name: 'C1',
      capacity: 30,
      floor: 0,
      type: 'theory',
    });
    const classroom2 = Classroom.create({
      organizationId: testOrgId,
      name: 'C2',
      capacity: 20,
      floor: 1,
      type: 'lab',
    });
    await repository.createMany([classroom1, classroom2]);
    const foundClassrooms = await repository.findAll(testOrgId);
    expect(foundClassrooms.length).toBe(3);
    expect(foundClassrooms.map((c) => c.id)).toContain(classroom1.id);
    expect(foundClassrooms.map((c) => c.id)).toContain(classroom2.id);
  });

  test('should filter classrooms by search, type, and capacity', async () => {
    const classroom1 = Classroom.create({
      organizationId: testOrgId,
      name: 'Theory Room A',
      capacity: 50,
      floor: 0,
      type: 'theory',
    });
    const classroom2 = Classroom.create({
      organizationId: testOrgId,
      name: 'Lab Room B',
      capacity: 20,
      floor: 1,
      type: 'lab',
    });
    const classroom3 = Classroom.create({
      organizationId: testOrgId,
      name: 'Theory Room C',
      capacity: 100,
      floor: 2,
      type: 'theory',
    });
    await repository.createMany([classroom1, classroom2, classroom3]);
    const theoryClassrooms = await repository.findPaginated(testOrgId, {
      type: 'theory',
    });
    expect(theoryClassrooms.data.length).toBe(3);
    expect(theoryClassrooms.data.map((c) => c.name)).toContain('Theory Room A');
    expect(theoryClassrooms.data.map((c) => c.name)).toContain('Theory Room C');
    const labClassrooms = await repository.findPaginated(testOrgId, {
      type: 'lab',
    });
    expect(labClassrooms.data.map((c) => c.name)).toContain('Lab Room B');
    const searchClassrooms = await repository.findPaginated(testOrgId, {
      search: 'room',
    });
    expect(searchClassrooms.data.length).toBe(3);
    const minCapClassrooms = await repository.findPaginated(testOrgId, {
      minCapacity: 50,
    });
    expect(minCapClassrooms.data.length).toBe(3);
    const maxCapClassrooms = await repository.findPaginated(testOrgId, {
      maxCapacity: 25,
    });
    expect(maxCapClassrooms.data.map((c) => c.name)).toContain('Lab Room B');
    const combinedClassrooms = await repository.findPaginated(testOrgId, {
      type: 'theory',
      minCapacity: 60,
      maxCapacity: 150,
      search: 'Theory',
    });
    expect(combinedClassrooms.data.length).toBe(1);
    expect(combinedClassrooms.data[0]?.name).toBe('Theory Room C');
  });

  test('should find identifiers of classrooms in an organization', async () => {
    const classroom1 = Classroom.create({
      organizationId: testOrgId,
      name: 'ID-1',
      capacity: 30,
      floor: 0,
      type: 'theory',
    });
    const classroom2 = Classroom.create({
      organizationId: testOrgId,
      name: 'ID-2',
      capacity: 20,
      floor: 1,
      type: 'lab',
    });
    await repository.createMany([classroom1, classroom2]);
    const identifiers = await repository.findIdentifiers(testOrgId);
    expect(identifiers).toContain('ID-1');
    expect(identifiers).toContain('ID-2');
  });

  test('should throw ConflictError on duplicate classroom name', async () => {
    const classroom = createValidClassroom();
    await repository.create(classroom);
    const classroomDuplicate = Classroom.create({
      organizationId: testOrgId,
      name: 'A-101',
      capacity: 40,
      floor: 2,
      type: 'lab',
    });
    await expect(repository.create(classroomDuplicate)).rejects.toThrow(
      ConflictError
    );
  });

  test('should update a classroom successfully', async () => {
    const classroom = createValidClassroom();
    await repository.create(classroom);
    classroom.update('B-202', 50, 2, 'lab');
    await repository.update(classroom);
    const updatedClassroom = await repository.findById(classroom.id, testOrgId);
    expect(updatedClassroom?.name).toBe('B-202');
    expect(updatedClassroom?.capacity).toBe(50);
    expect(updatedClassroom?.floor).toBe(2);
    expect(updatedClassroom?.type).toBe('lab');
  });

  test('should soft delete a classroom successfully', async () => {
    const classroom = createValidClassroom();
    await repository.create(classroom);
    await repository.delete(classroom.id, testOrgId);
    const foundClassroom = await repository.findById(classroom.id, testOrgId);
    expect(foundClassroom).toBeNull();
    const historicalClassroom = await repository.findById(
      classroom.id,
      testOrgId,
      testPastAcademicYearId
    );
    expect(historicalClassroom?.deletedAt).toBeInstanceOf(Date);
    const allClassrooms = await repository.findAll(testOrgId);
    expect(allClassrooms.map((c) => c.id)).not.toContain(classroom.id);
    const currentClassrooms = await repository.findAll(
      testOrgId,
      testAcademicYearId
    );
    expect(currentClassrooms.map((c) => c.id)).not.toContain(classroom.id);
    const historicalClassrooms = await repository.findAll(
      testOrgId,
      testPastAcademicYearId
    );
    expect(
      historicalClassrooms.find((c) => c.id === classroom.id)?.deletedAt
    ).toBeInstanceOf(Date);
  });

  test('should soft delete all classrooms successfully', async () => {
    const classroom1 = createValidClassroom();
    const classroom2 = Classroom.create({
      organizationId: testOrgId,
      name: 'A-102',
      capacity: 30,
      floor: 1,
      type: 'theory',
    });
    await repository.createMany([classroom1, classroom2]);
    const beforeDelete = await repository.findAll(testOrgId);
    expect(beforeDelete.length).toBeGreaterThan(0);
    await repository.deleteAll(testOrgId);
    const afterDelete = await repository.findAll(testOrgId);
    expect(afterDelete.length).toBe(0);
  });

  test('should replace classrooms successfully', async () => {
    const classroom1 = createValidClassroom();
    await repository.create(classroom1);
    const newClassroom = Classroom.create({
      organizationId: testOrgId,
      name: 'R-999',
      capacity: 50,
      floor: -1,
      type: 'theory',
    });
    await repository.replace([newClassroom], testOrgId);
    const allClassrooms = await repository.findAll(testOrgId);
    expect(allClassrooms.length).toBe(1);
    expect(allClassrooms[0]?.id).toBe(newClassroom.id);
    expect(allClassrooms[0]?.name).toBe('R-999');
  });
});
