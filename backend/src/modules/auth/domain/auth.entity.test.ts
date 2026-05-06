import { describe, it, expect } from 'bun:test';
import { AuthUser } from './auth.entity';

describe('AuthUser Entity', () => {
  const mockInput = {
    name: 'Joel Saavedra Páez',
    email: 'joel@saavedra.com',
    passwordHash: 'hashed_password',
  };

  describe('create()', () => {
    it('should create a user with a generated ID and current dates', () => {
      const user = AuthUser.create(mockInput);
      expect(user.id).toBeDefined();
      expect(user.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
      expect(user.name).toBe(mockInput.name);
      expect(user.email).toBe(mockInput.email);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('reconstitute()', () => {
    it('should reconstitute a user with existing data (e.g., from the database)', () => {
      const existingProps = {
        id: 'fixed-id',
        name: 'Joel Saavedra Páez',
        email: 'joel@saavedra.com',
        passwordHash: 'hashed_password',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      };

      const user = AuthUser.reconstitute(existingProps);
      expect(user.id).toBe('fixed-id');
      expect(user.name).toBe('Joel Saavedra Páez');
      expect(user.createdAt.getFullYear()).toBe(2023);
    });
  });

  it('should have getters working for all properties', () => {
    const user = AuthUser.create(mockInput);
    expect(user.passwordHash).toBe(mockInput.passwordHash);
  });
});
