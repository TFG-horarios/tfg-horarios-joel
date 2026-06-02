import { describe, expect, test, beforeAll, beforeEach } from 'bun:test';
import { DrizzleDegreeRepository } from './drizzle.degree.repository';
import { Degree } from '../../domain/degree.entity';
import { ConflictError } from '@/core/errors/app.error';
import { setupTestDb, cleanTestDb, testDb } from '@/tests/setup-db';
import { seedTestDb, testOrgId } from '@/tests/seed-db';

describe('DrizzleDegreeRepository Integration', () => {
  let repository: DrizzleDegreeRepository;

  beforeAll(async () => {
    await setupTestDb();
    repository = new DrizzleDegreeRepository(testDb);
  });

  beforeEach(async () => {
    await cleanTestDb();
    await seedTestDb(testDb);
  });

  const createValidDegree = () =>
    Degree.create({
      organizationId: testOrgId,
      name: 'Computer Science',
      code: 'CS101',
    });

  test('should create and retrieve a degree by ID', async () => {
    const degree = createValidDegree();
    await repository.create(degree);
    const foundDegree = await repository.findById(degree.id, testOrgId);
    expect(foundDegree).not.toBeNull();
    expect(foundDegree?.id).toBe(degree.id);
    expect(foundDegree?.name).toBe('Computer Science');
    expect(foundDegree?.code).toBe('CS101');
  });

  test('should return null if degree not found by ID', async () => {
    const foundDegree = await repository.findById(
      'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      testOrgId
    );
    expect(foundDegree).toBeNull();
  });

  test('should return null if degree belongs to different org', async () => {
    const degree = createValidDegree();
    await repository.create(degree);
    const foundDegree = await repository.findById(
      degree.id,
      'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'
    );
    expect(foundDegree).toBeNull();
  });

  test('should find all degrees in an organization', async () => {
    const degree1 = Degree.create({
      organizationId: testOrgId,
      name: 'Deg1',
      code: 'C1',
    });
    const degree2 = Degree.create({
      organizationId: testOrgId,
      name: 'Deg2',
      code: 'C2',
    });
    await repository.createMany([degree1, degree2]);
    const foundDegrees = await repository.findAll(testOrgId);
    expect(foundDegrees.length).toBe(3);
    expect(foundDegrees.map((d) => d.id)).toContain(degree1.id);
    expect(foundDegrees.map((d) => d.id)).toContain(degree2.id);
  });

  test('should find identifiers of degrees in an organization', async () => {
    const degree1 = Degree.create({
      organizationId: testOrgId,
      name: 'ID-1',
      code: 'C1',
    });
    const degree2 = Degree.create({
      organizationId: testOrgId,
      name: 'ID-2',
      code: 'C2',
    });
    await repository.createMany([degree1, degree2]);
    const identifiers = await repository.findIdentifiers(testOrgId);
    expect(identifiers).toContainEqual({ name: 'ID-1', code: 'C1' });
    expect(identifiers).toContainEqual({ name: 'ID-2', code: 'C2' });
  });

  test('should throw ConflictError on duplicate degree code/name', async () => {
    const degree = createValidDegree();
    await repository.create(degree);
    const degreeDuplicate = Degree.create({
      organizationId: testOrgId,
      name: 'Computer Science',
      code: 'CS101',
    });
    await expect(repository.create(degreeDuplicate)).rejects.toThrow(
      ConflictError
    );
  });

  test('should update a degree successfully', async () => {
    const degree = createValidDegree();
    await repository.create(degree);
    degree.update('Updated Name', 'UP101');
    await repository.update(degree);
    const updatedDegree = await repository.findById(degree.id, testOrgId);
    expect(updatedDegree?.name).toBe('Updated Name');
    expect(updatedDegree?.code).toBe('UP101');
  });

  test('should soft delete a degree successfully', async () => {
    const degree = createValidDegree();
    await repository.create(degree);
    await repository.delete(degree.id, testOrgId);
    const foundDegree = await repository.findById(degree.id, testOrgId);
    expect(foundDegree).toBeNull();
    const allDegrees = await repository.findAll(testOrgId);
    expect(allDegrees.length).toBe(1);
  });

  test('should soft delete all degrees successfully', async () => {
    const degree1 = createValidDegree();
    const degree2 = Degree.create({
      organizationId: testOrgId,
      name: 'Software Engineering',
      code: 'SE101',
    });
    await repository.createMany([degree1, degree2]);
    const beforeDelete = await repository.findAll(testOrgId);
    expect(beforeDelete.length).toBeGreaterThan(0);
    await repository.deleteAll(testOrgId);
    const afterDelete = await repository.findAll(testOrgId);
    expect(afterDelete.length).toBe(0);
  });

  test('should replace degrees successfully', async () => {
    const degree1 = createValidDegree();
    await repository.create(degree1);
    const newDegree = Degree.create({
      organizationId: testOrgId,
      name: 'New Degree',
      code: 'ND',
    });
    await repository.replace([newDegree], testOrgId);
    const allDegrees = await repository.findAll(testOrgId);
    expect(allDegrees.length).toBe(1);
    expect(allDegrees[0]?.id).toBe(newDegree.id);
    expect(allDegrees[0]?.name).toBe('New Degree');
  });
});
