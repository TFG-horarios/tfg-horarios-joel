import { describe, expect, test } from 'bun:test';
import { ValidationError } from '@/core/errors/app.error';
import { Organization } from './organization.entity';

describe('Organization', () => {
  const baseProps = {
    name: 'Test Org',
  };

  test('creates an organization with generated identity and timestamps', () => {
    const org = Organization.create(baseProps);
    expect(org.name).toBe(baseProps.name);
    expect(org.id).toBeString();
    expect(org.createdAt).toBeInstanceOf(Date);
    expect(org.updatedAt).toBeInstanceOf(Date);
  });

  test('reconstitutes an organization from persisted props', () => {
    const date = new Date();
    const persistedProps = {
      ...baseProps,
      id: 'org-1',
      createdAt: date,
      updatedAt: date,
    };
    const org = Organization.reconstitute(persistedProps);
    expect(org.id).toBe('org-1');
    expect(org.name).toBe(baseProps.name);
  });

  test('updates organization data and refreshes updatedAt', () => {
    const org = Organization.reconstitute({
      ...baseProps,
      id: 'org-1',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    });
    const previousUpdatedAt = org.updatedAt;
    org.update({
      ...baseProps,
      name: 'New Org',
    });
    expect(org.name).toBe('New Org');
    expect(org.updatedAt.getTime()).toBeGreaterThanOrEqual(
      previousUpdatedAt.getTime()
    );
  });

  test('throws ValidationError when creating with short name', () => {
    expect(() => Organization.create({ ...baseProps, name: 'A' })).toThrow(
      ValidationError
    );
  });

  test('throws ValidationError when updating with invalid values', () => {
    const org = Organization.create(baseProps);
    expect(() => org.update({ ...baseProps, name: 'A' })).toThrow(
      ValidationError
    );
  });
});
