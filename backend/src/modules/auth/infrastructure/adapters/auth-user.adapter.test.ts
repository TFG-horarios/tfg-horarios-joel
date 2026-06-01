import { describe, expect, test, mock } from 'bun:test';
import { AuthUserAdapter } from './auth-user.adapter';
import { User } from '@/modules/user/domain/user.entity';

describe('AuthUserAdapter', () => {
  const userRepositoryMock = {
    findById: mock(),
    findByEmail: mock(),
    create: mock(),
    update: mock(),
    delete: mock(),
  };

  const adapter = new AuthUserAdapter(userRepositoryMock);

  test('findByEmail returns null if not found', async () => {
    userRepositoryMock.findByEmail.mockResolvedValueOnce(null);
    const result = await adapter.findByEmail('j@e.com');
    expect(result).toBeNull();
  });

  test('findByEmail returns record if found', async () => {
    const user = User.create({
      name: 'John',
      email: 'j@e.com',
      passwordHash: 'hash',
    });
    userRepositoryMock.findByEmail.mockResolvedValueOnce(user);
    const result = await adapter.findByEmail('j@e.com');
    expect(result?.id).toBe(user.id);
  });

  test('create creates a user and returns record', async () => {
    const result = await adapter.create({
      name: 'Jane',
      email: 'jane@e.com',
      passwordHash: 'hash',
    });
    expect(result.name).toBe('Jane');
    expect(userRepositoryMock.create).toHaveBeenCalled();
  });
});
