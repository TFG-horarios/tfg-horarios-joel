import { describe, expect, test } from 'bun:test';
import { ValidationError } from '@/core/errors/app.error';
import { Itinerary } from './itinerary.entity';

describe('Itinerary', () => {
  const baseProps = {
    organizationId: 'org-1',
    degreeId: 'deg-1',
    name: 'Software Engineering',
    code: 'SE',
  };

  test('creates an itinerary with generated identity and timestamps', () => {
    const itinerary = Itinerary.create(baseProps);
    expect(itinerary.organizationId).toBe(baseProps.organizationId);
    expect(itinerary.degreeId).toBe(baseProps.degreeId);
    expect(itinerary.name).toBe(baseProps.name);
    expect(itinerary.code).toBe('SE');
    expect(itinerary.id).toBeString();
    expect(itinerary.createdAt).toBeInstanceOf(Date);
    expect(itinerary.updatedAt).toBeInstanceOf(Date);
    expect(itinerary.deletedAt).toBeNull();
  });

  test('capitalizes the code when creating', () => {
    const itinerary = Itinerary.create({ ...baseProps, code: 'se' });
    expect(itinerary.code).toBe('SE');
  });

  test('reconstitutes an itinerary from persisted props', () => {
    const date = new Date();
    const persistedProps = {
      id: 'iti-1',
      organizationId: 'org-1',
      degreeId: 'deg-1',
      name: 'Software Engineering',
      code: 'SE',
      createdAt: date,
      updatedAt: date,
      deletedAt: null,
    };
    const itinerary = Itinerary.reconstitute(persistedProps);
    expect(itinerary.id).toBe(persistedProps.id);
    expect(itinerary.name).toBe(persistedProps.name);
  });

  test('updates itinerary data and refreshes updatedAt', () => {
    const itinerary = Itinerary.reconstitute({
      id: 'iti-1',
      organizationId: 'org-1',
      degreeId: 'deg-1',
      name: 'Old Name',
      code: 'ON',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      deletedAt: null,
    });
    const previousUpdatedAt = itinerary.updatedAt;
    itinerary.update('New Name', 'nn');
    expect(itinerary.name).toBe('New Name');
    expect(itinerary.code).toBe('NN');
    expect(itinerary.updatedAt.getTime()).toBeGreaterThanOrEqual(
      previousUpdatedAt.getTime()
    );
  });

  test('throws when creating with short name', () => {
    expect(() => Itinerary.create({ ...baseProps, name: 'A ' })).toThrow(
      ValidationError
    );
  });

  test('throws when creating with empty code', () => {
    expect(() => Itinerary.create({ ...baseProps, code: '  ' })).toThrow(
      ValidationError
    );
  });

  test('throws when updating with short name', () => {
    const itinerary = Itinerary.create(baseProps);
    expect(() => itinerary.update('A ', 'SE')).toThrow(ValidationError);
  });

  test('throws when updating with empty code', () => {
    const itinerary = Itinerary.create(baseProps);
    expect(() => itinerary.update('Software Engineering', '   ')).toThrow(
      ValidationError
    );
  });
});
