import { describe, expect, test, mock } from 'bun:test';
import { MemberUserAdapter } from './member-user.adapter';

describe('MemberUserAdapter', () => {
  const userRepositoryMock = {
    findById: mock(),
    findByEmail: mock(),
    create: mock(),
    update: mock(),
    delete: mock(),
  };

  const adapter = new MemberUserAdapter(userRepositoryMock);

  test('should return null if user is not found', async () => {
    userRepositoryMock.findByEmail.mockResolvedValueOnce(null);
    const result = await adapter.getUserByEmail('test@test.com');
    expect(result).toBeNull();
  });

  test('should return user details if user is found', async () => {
    userRepositoryMock.findByEmail.mockResolvedValueOnce({
      id: 'user-1',
      name: 'John Doe',
      email: 'test@example.com',
    });
    const result = await adapter.getUserByEmail('test@test.com');
    expect(result?.id).toBe('user-1');
    expect(result?.name).toBe('John Doe');
    expect(result?.email).toBe('test@example.com');
  });
});
