import { describe, expect, test } from 'bun:test';
import { ValidationError } from '@/core/errors/app.error';
import { Degree } from './degree.entity';

describe('Degree', () => {
  const baseProps = {
    organizationId: 'org-1',
    name: 'Computer Science',
    code: 'CS',
  };

  test('creates a degree with generated identity and timestamps', () => {
    const degree = Degree.create(baseProps);
    expect(degree.organizationId).toBe(baseProps.organizationId);
    expect(degree.name).toBe(baseProps.name);
    expect(degree.code).toBe(baseProps.code);
    expect(degree.id).toBeString();
    expect(degree.createdAt).toBeInstanceOf(Date);
    expect(degree.updatedAt).toBeInstanceOf(Date);
    expect(degree.deletedAt).toBeNull();
  });

  test('reconstitutes a degree from persisted props', () => {
    const date = new Date();
    const persistedProps = {
      id: 'deg-1',
      organizationId: 'org-1',
      name: 'Software Eng',
      code: 'SE',
      createdAt: date,
      updatedAt: date,
      deletedAt: null,
    };
    const degree = Degree.reconstitute(persistedProps);
    expect(degree.id).toBe(persistedProps.id);
    expect(degree.name).toBe(persistedProps.name);
  });

  test('updates degree data and refreshes updatedAt', () => {
    const degree = Degree.reconstitute({
      id: 'deg-1',
      organizationId: 'org-1',
      name: 'Old Name',
      code: 'ON',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      deletedAt: null,
    });
    const previousUpdatedAt = degree.updatedAt;
    degree.update('New Name', 'NN');
    expect(degree.name).toBe('New Name');
    expect(degree.code).toBe('NN');
    expect(degree.updatedAt.getTime()).toBeGreaterThanOrEqual(
      previousUpdatedAt.getTime()
    );
  });

  test('throws when creating with short name', () => {
    expect(() => Degree.create({ ...baseProps, name: 'A ' })).toThrow(
      ValidationError
    );
  });

  test('throws when creating with short code', () => {
    expect(() => Degree.create({ ...baseProps, code: 'A' })).toThrow(
      ValidationError
    );
  });

  test('throws when updating with short name', () => {
    const degree = Degree.create(baseProps);
    expect(() => degree.update('A ', 'CS')).toThrow(ValidationError);
  });

  test('throws when updating with short code', () => {
    const degree = Degree.create(baseProps);
    expect(() => degree.update('Computer Science', 'C')).toThrow(
      ValidationError
    );
  });
});
