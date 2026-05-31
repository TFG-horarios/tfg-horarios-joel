import { describe, expect, test } from 'bun:test';
import { UserMapper } from './user.mapper';
import { User } from '../domain/user.entity';

describe('UserMapper', () => {
  test('should map User to UserDTO', () => {
    const date = new Date();
    const user = User.reconstitute({
      id: 'u-1',
      name: 'John Doe',
      email: 'j@e.com',
      passwordHash: 'hash',
      createdAt: date,
      updatedAt: date,
    });
    const dto = UserMapper.toDTO(user);
    expect(dto).toEqual({
      id: 'u-1',
      name: 'John Doe',
      email: 'j@e.com',
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
    });
  });
});
