import { describe, expect, test } from 'bun:test';
import { PasswordPolicy } from './password.vo';
import { ValidationError } from '@/core/errors/app.error';

describe('PasswordPolicy', () => {
  test('creates successfully', () => {
    const p = PasswordPolicy.create('validPassword123');
    expect(p.getValue()).toBe('validPassword123');
  });

  test('throws if too short', () => {
    expect(() => PasswordPolicy.create('short12')).toThrow(ValidationError);
  });

  test('throws if too long', () => {
    const long = 'a'.repeat(129);
    expect(() => PasswordPolicy.create(long)).toThrow(ValidationError);
  });
});
