import { describe, expect, test, beforeAll, beforeEach } from 'bun:test';
import { DrizzleOrganizationRepository } from './drizzle.organization.repository';
import { Organization } from '../../domain/organization.entity';
import { ConflictError } from '@/core/errors/app.error';
import { setupTestDb, cleanTestDb, testDb } from '@/tests/setup-db';
import { seedTestDb, testUserId } from '@/tests/seed-db';

describe('DrizzleOrganizationRepository Integration', () => {
  let repository: DrizzleOrganizationRepository;

  beforeAll(async () => {
    await setupTestDb();
    repository = new DrizzleOrganizationRepository(testDb);
  });

  beforeEach(async () => {
    await cleanTestDb();
    await seedTestDb(testDb);
  });

  const createValidOrg = () =>
    Organization.create({
      name: 'Test Org',
      periodType: 'semester',
      morningStart: '08:00',
      afternoonStart: '15:00',
      morningEnd: '14:00',
      afternoonEnd: '21:00',
      slotDurationMinutes: 60,
    });

  test('should create and retrieve an organization by ID', async () => {
    const org = createValidOrg();
    await repository.create(org, testUserId);
    const foundOrg = await repository.findById(org.id);
    expect(foundOrg).not.toBeNull();
    expect(foundOrg?.id).toBe(org.id);
    expect(foundOrg?.name).toBe('Test Org');
  });

  test('should find organizations by user ID', async () => {
    const org1 = createValidOrg();
    const org2 = createValidOrg();
    await repository.create(org1, testUserId);
    await repository.create(org2, testUserId);
    const foundOrgs = await repository.findByUserId(testUserId);
    expect(foundOrgs.length).toBe(2);
    expect(foundOrgs.map((o) => o.id)).toContain(org1.id);
    expect(foundOrgs.map((o) => o.id)).toContain(org2.id);
  });

  test('should return null if org not found by ID', async () => {
    const foundOrg = await repository.findById(
      '00000000-0000-0000-0000-000000000002'
    );
    expect(foundOrg).toBeNull();
  });

  test('should throw ConflictError on database conflict (e.g., duplicate org name might not be restricted but testing error wrapping)', async () => {
    const org = createValidOrg();
    await repository.create(org, testUserId);
    await expect(repository.create(org, testUserId)).rejects.toThrow(
      ConflictError
    );
  });

  test('should update an organization successfully', async () => {
    const org = createValidOrg();
    await repository.create(org, testUserId);
    org.update({
      name: 'Updated Org',
      periodType: 'semester',
      morningStart: '08:00',
      afternoonStart: '15:00',
      morningEnd: '14:00',
      afternoonEnd: '21:00',
      slotDurationMinutes: 60,
    });
    await repository.update(org);
    const updatedOrg = await repository.findById(org.id);
    expect(updatedOrg?.name).toBe('Updated Org');
  });

  test('should delete an organization successfully', async () => {
    const org = createValidOrg();
    await repository.create(org, testUserId);
    await repository.delete(org.id);
    const foundOrg = await repository.findById(org.id);
    expect(foundOrg).toBeNull();
  });
});
