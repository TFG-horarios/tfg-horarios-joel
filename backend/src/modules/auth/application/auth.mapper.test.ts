import { describe, expect, test } from 'bun:test';
import { AuthMapper } from './auth.mapper';

describe('AuthMapper', () => {
  test('maps to dto', () => {
    const user = {
      id: 'u-1',
      name: 'John',
      email: 'j@e.com',
      passwordHash: 'hash',
    };
    const dto = AuthMapper.toDTO(user, 'token123');
    expect(dto).toEqual({
      user: { id: 'u-1', name: 'John', email: 'j@e.com' },
      token: 'token123',
    });
  });
});
