import { describe, expect, test, beforeAll, beforeEach } from 'bun:test';
import { DrizzleMemberRepository } from './drizzle.member.repository';
import { Member } from '../../domain/member.entity';
import { ConflictError } from '@/core/errors/app.error';
import { setupTestDb, cleanTestDb, testDb } from '@/tests/setup-db';
import { seedTestDb, testOrgId, seedTestUser } from '@/tests/seed-db';

describe('DrizzleMemberRepository Integration', () => {
  let repository: DrizzleMemberRepository;

  beforeAll(async () => {
    await setupTestDb();
    repository = new DrizzleMemberRepository(testDb);
  });

  beforeEach(async () => {
    await cleanTestDb();
    await seedTestDb(testDb);
  });

  const createValidMember = (userId: string) =>
    Member.create({
      organizationId: testOrgId,
      userId,
      role: 'editor',
    });

  test('should create and retrieve a member by ID', async () => {
    const u2 = '20eebc99-9c0b-4ef8-bb6d-6bb9bd380a02';
    await seedTestUser(testDb, u2, 'u2@e.com', 'User ' + u2);
    const member = createValidMember(u2);
    await repository.create(member);
    const foundMember = await repository.findById(member.id, testOrgId);
    expect(foundMember).not.toBeNull();
    expect(foundMember?.id).toBe(member.id);
    expect(foundMember?.userId).toBe(u2);
    expect(foundMember?.role).toBe('editor');
  });

  test('should return null if member not found by ID', async () => {
    const foundMember = await repository.findById(
      'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
      testOrgId
    );
    expect(foundMember).toBeNull();
  });

  test('should find a member by user and org', async () => {
    const u3 = '30eebc99-9c0b-4ef8-bb6d-6bb9bd380a03';
    await seedTestUser(testDb, u3, 'u3@e.com', 'User ' + u3);
    const member = createValidMember(u3);
    await repository.create(member);
    const foundMember = await repository.findByUserAndOrg(u3, testOrgId);
    expect(foundMember).not.toBeNull();
    expect(foundMember?.id).toBe(member.id);
  });

  test('should return null when finding by user and org if not found', async () => {
    const un = '00eebc99-9c0b-4ef8-bb6d-6bb9bd380a00';
    const foundMember = await repository.findByUserAndOrg(un, testOrgId);
    expect(foundMember).toBeNull();
  });

  test('should find all members in an organization', async () => {
    const u4 = '40eebc99-9c0b-4ef8-bb6d-6bb9bd380a04';
    const u5 = '50eebc99-9c0b-4ef8-bb6d-6bb9bd380a05';
    await seedTestUser(testDb, u4, 'u4@e.com', 'User ' + u4);
    await seedTestUser(testDb, u5, 'u5@e.com', 'User ' + u5);
    const member1 = createValidMember(u4);
    const member2 = createValidMember(u5);
    await repository.create(member1);
    await repository.create(member2);
    const members = await repository.findByOrganizationId(testOrgId);
    expect(members.some((m) => m.member.id === member1.id)).toBeTrue();
    expect(members.some((m) => m.member.id === member2.id)).toBeTrue();
    const m1WithDetails = members.find((m) => m.member.id === member1.id);
    expect(m1WithDetails?.userEmail).toBe('u4@e.com');
  });

  test('should throw ConflictError on duplicate user in org', async () => {
    const u6 = '60eebc99-9c0b-4ef8-bb6d-6bb9bd380a06';
    await seedTestUser(testDb, u6, 'u6@e.com', 'User ' + u6);
    const member = createValidMember(u6);
    await repository.create(member);
    const duplicateMember = Member.create({
      organizationId: testOrgId,
      userId: u6,
      role: 'viewer',
    });
    await expect(repository.create(duplicateMember)).rejects.toThrow(
      ConflictError
    );
  });

  test('should update a member successfully', async () => {
    const u7 = '70eebc99-9c0b-4ef8-bb6d-6bb9bd380a07';
    await seedTestUser(testDb, u7, 'u7@e.com', 'User ' + u7);
    const member = createValidMember(u7);
    await repository.create(member);
    member.updateRole('admin', 'dummy-requester-id');
    await repository.update(member);
    const updatedMember = await repository.findById(member.id, testOrgId);
    expect(updatedMember?.role).toBe('admin');
  });

  test('should delete a member successfully', async () => {
    const u8 = '80eebc99-9c0b-4ef8-bb6d-6bb9bd380a08';
    await seedTestUser(testDb, u8, 'u8@e.com', 'User ' + u8);
    const member = createValidMember(u8);
    await repository.create(member);
    await repository.delete(member.id, testOrgId);
    const foundMember = await repository.findById(member.id, testOrgId);
    expect(foundMember).toBeNull();
  });

  test('should count admins correctly', async () => {
    const u9 = '90eebc99-9c0b-4ef8-bb6d-6bb9bd380a09';
    await seedTestUser(testDb, u9, 'u9@e.com', 'User ' + u9);
    const adminMember = Member.create({
      organizationId: testOrgId,
      userId: u9,
      role: 'admin',
    });
    await repository.create(adminMember);
    const count = await repository.countAdmins(testOrgId);
    expect(count).toBeGreaterThan(0);
  });
});
