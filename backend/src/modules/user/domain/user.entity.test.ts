import { describe, expect, test } from 'bun:test';
import { ValidationError } from '@/core/errors/app.error';
import { User } from './user.entity';

describe('User Entity', () => {
  const baseProps = {
    name: 'John Doe',
    email: 'john@example.com',
    passwordHash: 'hash',
  };

  test('creates a user successfully', () => {
    const user = User.create(baseProps);
    expect(user.name).toBe('John Doe');
    expect(user.email).toBe('john@example.com');
    expect(user.id).toBeString();
  });

  test('normalizes email to lowercase and trims', () => {
    const user = User.create({ ...baseProps, email: ' John@EXAMPLE.com ' });
    expect(user.email).toBe('john@example.com');
  });

  test('throws ValidationError if email is invalid', () => {
    expect(() => User.create({ ...baseProps, email: 'invalid' })).toThrow(
      ValidationError
    );
  });

  test('throws ValidationError if name is too short', () => {
    expect(() => User.create({ ...baseProps, name: 'a' })).toThrow(
      ValidationError
    );
  });

  test('reconstitutes user from persisted props', () => {
    const date = new Date();
    const user = User.reconstitute({
      ...baseProps,
      id: 'u-1',
      createdAt: date,
      updatedAt: date,
    });
    expect(user.id).toBe('u-1');
  });

  test('updates name successfully', () => {
    const user = User.create(baseProps);
    user.updateName('Jane Doe');
    expect(user.name).toBe('Jane Doe');
  });

  test('throws ValidationError if updated name is too short', () => {
    const user = User.create(baseProps);
    expect(() => user.updateName(' a ')).toThrow(ValidationError);
  });
});
