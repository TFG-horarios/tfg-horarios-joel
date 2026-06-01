import { describe, expect, test, beforeAll, beforeEach } from 'bun:test';
import { DrizzleUserRepository } from './drizzle.user.repository';
import { User } from '../../domain/user.entity';
import { ConflictError } from '@/core/errors/app.error';
import { setupTestDb, cleanTestDb, testDb } from '@/tests/setup-db';
import { seedTestDb } from '@/tests/seed-db';

describe('DrizzleUserRepository Integration', () => {
  let repository: DrizzleUserRepository;

  beforeAll(async () => {
    await setupTestDb();
    repository = new DrizzleUserRepository(testDb);
  });

  beforeEach(async () => {
    await cleanTestDb();
    await seedTestDb(testDb);
  });

  const createValidUser = () =>
    User.create({
      name: 'John Doe',
      email: 'john@example.com',
      passwordHash: 'hashedpassword',
    });

  test('should create and retrieve a user by ID', async () => {
    const user = createValidUser();
    await repository.create(user);
    const foundUser = await repository.findById(user.id);
    expect(foundUser).not.toBeNull();
    expect(foundUser?.id).toBe(user.id);
    expect(foundUser?.name).toBe(user.name);
    expect(foundUser?.email).toBe(user.email);
  });

  test('should return null if user not found by ID', async () => {
    const foundUser = await repository.findById(
      '00000000-0000-0000-0000-000000000000'
    );
    expect(foundUser).toBeNull();
  });

  test('should find a user by email', async () => {
    const user = createValidUser();
    await repository.create(user);
    const foundUser = await repository.findByEmail('john@example.com');
    expect(foundUser).not.toBeNull();
    expect(foundUser?.id).toBe(user.id);
  });

  test('should return null if user not found by email', async () => {
    const foundUser = await repository.findByEmail('nobody@example.com');
    expect(foundUser).toBeNull();
  });

  test('should throw ConflictError on duplicate email', async () => {
    const user1 = createValidUser();
    await repository.create(user1);
    const user2 = User.create({
      name: 'Jane Doe',
      email: 'john@example.com',
      passwordHash: 'hashed2',
    });
    await expect(repository.create(user2)).rejects.toThrow(ConflictError);
  });

  test('should update a user name successfully', async () => {
    const user = createValidUser();
    await repository.create(user);
    user.updateName('John Updated');
    await repository.update(user);
    const updatedUser = await repository.findById(user.id);
    expect(updatedUser?.name).toBe('John Updated');
  });

  test('should delete a user successfully', async () => {
    const user = createValidUser();
    await repository.create(user);
    await repository.delete(user.id);
    const foundUser = await repository.findById(user.id);
    expect(foundUser).toBeNull();
  });
});
