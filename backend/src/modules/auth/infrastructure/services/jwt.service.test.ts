import { describe, expect, test } from 'bun:test';
import { JwtService } from './jwt.service';

describe('JwtService', () => {
  const service = new JwtService('secret123', 3600);

  test('generates and validates token', async () => {
    const payload = { id: 'u-1', name: 'John', email: 'j@e.com' };
    const token = await service.generate(payload);
    expect(token).toBeString();

    const decoded = await service.validate(token);
    expect(decoded?.id).toBe(payload.id);
    expect(decoded?.name).toBe(payload.name);
    expect(decoded?.email).toBe(payload.email);
  });

  test('validate returns null for invalid token', async () => {
    const result = await service.validate('invalid.token.here');
    expect(result).toBeNull();
  });
});
