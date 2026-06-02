import { describe, expect, test, beforeAll, beforeEach } from 'bun:test';
import { DrizzleSubjectGroupRepository } from './drizzle.subject-group.repository';
import { SubjectGroup } from '../../domain/subject-group.entity';
import { ConflictError } from '@/core/errors/app.error';
import { setupTestDb, cleanTestDb, testDb } from '@/tests/setup-db';
import {
  seedTestDb,
  testOrgId,
  testDegreeId,
  testItineraryId,
  testSubjectId,
  seedTestSubject,
} from '@/tests/seed-db';

describe('DrizzleSubjectGroupRepository Integration', () => {
  let repository: DrizzleSubjectGroupRepository;

  const testSubject2Id = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';

  beforeAll(async () => {
    await setupTestDb();
    repository = new DrizzleSubjectGroupRepository(testDb);
  });

  beforeEach(async () => {
    await cleanTestDb();
    await seedTestDb(testDb);
    await seedTestSubject(
      testDb,
      testSubject2Id,
      'PROG101',
      testItineraryId,
      'Programming'
    );
  });

  const createValidGroup = () =>
    SubjectGroup.create({
      organizationId: testOrgId,
      subjectId: testSubjectId,
      name: 'Group A',
      groupType: 'theory',
      shift: 'morning',
      groupNumber: 1,
      weeklyHours: 2,
      numberOfStudents: 50,
    });

  test('should create and retrieve a subject group by ID', async () => {
    const group = createValidGroup();
    await repository.create(group);
    const foundGroup = await repository.findById(group.id, testOrgId);
    expect(foundGroup).not.toBeNull();
    expect(foundGroup?.id).toBe(group.id);
    expect(foundGroup?.name).toBe('Group A');
    expect(foundGroup?.groupType).toBe('theory');
  });

  test('should return null if group not found by ID', async () => {
    const foundGroup = await repository.findById(
      'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66',
      testOrgId
    );
    expect(foundGroup).toBeNull();
  });

  test('should find all groups in an organization', async () => {
    const group1 = SubjectGroup.create({
      organizationId: testOrgId,
      subjectId: testSubjectId,
      name: 'T1',
      groupType: 'theory',
      shift: 'morning',
      groupNumber: 1,
      weeklyHours: 2,
      numberOfStudents: 50,
    });
    const group2 = SubjectGroup.create({
      organizationId: testOrgId,
      subjectId: testSubjectId,
      name: 'P1',
      groupType: 'problems',
      shift: 'morning',
      groupNumber: 1,
      weeklyHours: 2,
      numberOfStudents: 25,
    });
    await repository.createMany([group1, group2]);
    const foundGroups = await repository.findAll(testOrgId);
    expect(foundGroups.length).toBe(3);
    expect(foundGroups.map((g) => g.id)).toContain(group1.id);
    expect(foundGroups.map((g) => g.id)).toContain(group2.id);
  });

  test('should find identifiers of groups in an organization', async () => {
    const group1 = SubjectGroup.create({
      organizationId: testOrgId,
      subjectId: testSubjectId,
      name: 'T1',
      groupType: 'theory',
      shift: 'morning',
      groupNumber: 1,
      weeklyHours: 2,
      numberOfStudents: 50,
    });
    const group2 = SubjectGroup.create({
      organizationId: testOrgId,
      subjectId: testSubjectId,
      name: 'P1',
      groupType: 'problems',
      shift: 'morning',
      groupNumber: 1,
      weeklyHours: 2,
      numberOfStudents: 25,
    });
    await repository.createMany([group1, group2]);
    const identifiers = await repository.findIdentifiers(testOrgId);
    expect(identifiers.length).toBe(3);
    const subjectIds = identifiers.map((i) => i.subjectId);
    expect(subjectIds).toContain(testSubjectId);
    expect(subjectIds).toContain(testSubjectId);
  });

  test('should throw ConflictError on duplicate type, number, and shift', async () => {
    const group = createValidGroup();
    await repository.create(group);
    const groupDuplicate = SubjectGroup.create({
      organizationId: testOrgId,
      subjectId: testSubjectId,
      name: 'Group B',
      groupType: 'theory',
      shift: 'morning',
      groupNumber: 1,
      weeklyHours: 2,
      numberOfStudents: 50,
    });
    await expect(repository.create(groupDuplicate)).rejects.toThrow(
      ConflictError
    );
  });

  test('should update a group successfully', async () => {
    const group = createValidGroup();
    await repository.create(group);
    group.update({
      name: 'Updated Group A',
      groupType: 'problems',
      shift: 'afternoon',
      groupNumber: 2,
      weeklyHours: 3,
      numberOfStudents: 30,
    });
    await repository.update(group);
    const updatedGroup = await repository.findById(group.id, testOrgId);
    expect(updatedGroup?.name).toBe('Updated Group A');
    expect(updatedGroup?.groupType).toBe('problems');
    expect(updatedGroup?.shift).toBe('afternoon');
    expect(updatedGroup?.groupNumber).toBe(2);
  });

  test('should soft delete a group successfully', async () => {
    const group = createValidGroup();
    await repository.create(group);
    await repository.delete(group.id, testOrgId);
    const foundGroup = await repository.findById(group.id, testOrgId);
    expect(foundGroup).toBeNull();
    const allGroups = await repository.findAll(testOrgId);
    expect(allGroups.length).toBe(1);
  });

  test('should find groups with subjects in scope', async () => {
    const group1 = SubjectGroup.create({
      organizationId: testOrgId,
      subjectId: testSubjectId,
      name: 'Math T1',
      groupType: 'theory',
      shift: 'morning',
      groupNumber: 1,
      weeklyHours: 2,
      numberOfStudents: 50,
    });
    const group2 = SubjectGroup.create({
      organizationId: testOrgId,
      subjectId: testSubject2Id,
      name: 'Prog T1',
      groupType: 'theory',
      shift: 'morning',
      groupNumber: 1,
      weeklyHours: 2,
      numberOfStudents: 50,
    });
    await repository.createMany([group1, group2]);
    const groupsInDegree = await repository.findGroupsWithSubjectsInScope(
      testOrgId,
      1,
      [testDegreeId]
    );
    expect(groupsInDegree.length).toBe(3);
    const groupsInItinerary = await repository.findGroupsWithSubjectsInScope(
      testOrgId,
      1,
      [testDegreeId],
      [testItineraryId]
    );
    expect(groupsInItinerary.length).toBe(1);
    expect(groupsInItinerary[0]?.subjectId).toBe(testSubject2Id);
    const groupsInYear2 = await repository.findGroupsWithSubjectsInScope(
      testOrgId,
      1,
      [testDegreeId],
      undefined,
      [2]
    );
    expect(groupsInYear2.length).toBe(0);
  });

  test('should soft delete all subject groups successfully', async () => {
    const group1 = createValidGroup();
    const group2 = SubjectGroup.create({
      organizationId: testOrgId,
      subjectId: testSubject2Id,
      name: 'Prog T2',
      groupType: 'theory',
      shift: 'morning',
      groupNumber: 1,
      weeklyHours: 2,
      numberOfStudents: 50,
    });
    await repository.createMany([group1, group2]);
    const beforeDelete = await repository.findAll(testOrgId);
    expect(beforeDelete.length).toBeGreaterThan(0);
    await repository.deleteAll(testOrgId);
    const afterDelete = await repository.findAll(testOrgId);
    expect(afterDelete.length).toBe(0);
  });

  test('should replace subject groups successfully', async () => {
    const group1 = createValidGroup();
    await repository.create(group1);
    const newGroup = SubjectGroup.create({
      organizationId: testOrgId,
      subjectId: testSubjectId,
      name: 'New Group',
      groupType: 'problems',
      shift: 'morning',
      groupNumber: 1,
      weeklyHours: 2,
      numberOfStudents: 10,
    });
    await repository.replace([newGroup], testOrgId);
    const allGroups = await repository.findAll(testOrgId);
    expect(allGroups.length).toBe(1);
    expect(allGroups[0]?.id).toBe(newGroup.id);
    expect(allGroups[0]?.name).toBe('New Group');
  });
});
