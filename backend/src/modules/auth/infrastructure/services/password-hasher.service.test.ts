import { describe, expect, test } from 'bun:test';
import { PasswordHasherService } from './password-hasher.service';

describe('PasswordHasherService', () => {
  const service = new PasswordHasherService();

  test('hashes password and verifies correctly', async () => {
    const password = 'mySecretPassword123';
    const hash = await service.hash(password);
    expect(hash).not.toBe(password);
    const isValid = await service.verify(password, hash);
    expect(isValid).toBeTrue();
  });

  test('verify returns false for incorrect password', async () => {
    const hash = await service.hash('password123');
    const isValid = await service.verify('wrongpassword', hash);
    expect(isValid).toBeFalse();
  });
});
