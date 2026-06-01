import { describe, expect, test, beforeAll, beforeEach } from 'bun:test';
import { DrizzleItineraryRepository } from './drizzle.itinerary.repository';
import { Itinerary } from '../../domain/itinerary.entity';
import { ConflictError } from '@/core/errors/app.error';
import { setupTestDb, cleanTestDb, testDb } from '@/tests/setup-db';
import { seedTestDb, testOrgId, testDegreeId } from '@/tests/seed-db';

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
    const itinerary = createValidItinerary();
    await repository.create(itinerary);
    await repository.delete(itinerary.id, testOrgId);
    const foundItinerary = await repository.findById(itinerary.id, testOrgId);
    expect(foundItinerary).toBeNull();
    const allItineraries = await repository.findAll(testOrgId);
    expect(allItineraries.length).toBe(1);
  });
});
