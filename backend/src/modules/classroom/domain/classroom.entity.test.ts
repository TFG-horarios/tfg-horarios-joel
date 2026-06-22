import { describe, expect, test } from 'bun:test';
import { ValidationError } from '@/core/errors/app.error';
import { Classroom, type ClassroomProps } from './classroom.entity';

describe('Classroom', () => {
  const baseProps: Omit<
    ClassroomProps,
    'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
  > = {
    organizationId: 'org-1',
    name: 'Physics Lab',
    capacity: 30,
    floor: 1,
    type: 'lab',
  };

  test('creates a classroom with generated identity and timestamps', () => {
    const classroom = Classroom.create(baseProps);
    expect(classroom.organizationId).toBe(baseProps.organizationId);
    expect(classroom.name).toBe(baseProps.name);
    expect(classroom.capacity).toBe(baseProps.capacity);
    expect(classroom.floor).toBe(baseProps.floor);
    expect(classroom.type).toBe(baseProps.type);
    expect(classroom.id).toBeString();
    expect(classroom.id.length).toBeGreaterThan(0);
    expect(classroom.createdAt).toBeInstanceOf(Date);
    expect(classroom.updatedAt).toBeInstanceOf(Date);
    expect(classroom.deletedAt).toBeNull();
  });

  test('reconstitutes a classroom from persisted props', () => {
    const persistedProps: ClassroomProps = {
      id: 'classroom-1',
      organizationId: 'org-1',
      name: 'Theory Room',
      capacity: 40,
      floor: 0,
      type: 'theory',
      createdAt: new Date('2025-01-01T10:00:00.000Z'),
      updatedAt: new Date('2025-01-02T10:00:00.000Z'),
      deletedAt: null,
    };
    const classroom = Classroom.reconstitute(persistedProps);
    expect(classroom.id).toBe(persistedProps.id);
    expect(classroom.organizationId).toBe(persistedProps.organizationId);
    expect(classroom.name).toBe(persistedProps.name);
    expect(classroom.capacity).toBe(persistedProps.capacity);
    expect(classroom.floor).toBe(persistedProps.floor);
    expect(classroom.type).toBe(persistedProps.type);
    expect(classroom.createdAt).toBe(persistedProps.createdAt);
    expect(classroom.updatedAt).toBe(persistedProps.updatedAt);
    expect(classroom.deletedAt).toBeNull();
  });

  test('updates classroom data and refreshes the updatedAt timestamp', () => {
    const classroom = Classroom.reconstitute({
      id: 'classroom-1',
      organizationId: 'org-1',
      name: 'Old Name',
      capacity: 20,
      floor: 0,
      type: 'theory',
      createdAt: new Date('2025-01-01T10:00:00.000Z'),
      updatedAt: new Date('2025-01-02T10:00:00.000Z'),
      deletedAt: null,
    });
    const previousUpdatedAt = classroom.updatedAt;
    classroom.update('New Name', 35, 2, 'lab');
    expect(classroom.name).toBe('New Name');
    expect(classroom.capacity).toBe(35);
    expect(classroom.floor).toBe(2);
    expect(classroom.type).toBe('lab');
    expect(classroom.updatedAt).not.toBe(previousUpdatedAt);
    expect(classroom.updatedAt.getTime()).toBeGreaterThanOrEqual(
      previousUpdatedAt.getTime()
    );
  });

  test('throws when creating with invalid capacity', () => {
    expect(() =>
      Classroom.create({
        ...baseProps,
        capacity: 0,
      })
    ).toThrow(ValidationError);
  });

  test('throws when creating with empty name', () => {
    expect(() =>
      Classroom.create({
        ...baseProps,
        name: '   ',
      })
    ).toThrow(ValidationError);
  });

  test('throws when updating with invalid capacity', () => {
    const classroom = Classroom.reconstitute({
      id: 'classroom-1',
      organizationId: 'org-1',
      name: 'Old Name',
      capacity: 20,
      floor: 0,
      type: 'theory',
      createdAt: new Date('2025-01-01T10:00:00.000Z'),
      updatedAt: new Date('2025-01-02T10:00:00.000Z'),
      deletedAt: null,
    });
    expect(() => classroom.update('New Name', 0, 1, 'lab')).toThrow(
      ValidationError
    );
  });

  test('throws when updating with empty name', () => {
    const classroom = Classroom.reconstitute({
      id: 'classroom-1',
      organizationId: 'org-1',
      name: 'Old Name',
      capacity: 20,
      floor: 0,
      type: 'theory',
      createdAt: new Date('2025-01-01T10:00:00.000Z'),
      updatedAt: new Date('2025-01-02T10:00:00.000Z'),
      deletedAt: null,
    });
    expect(() => classroom.update('   ', 10, 1, 'lab')).toThrow(
      ValidationError
    );
  });

  test('throws when floor is not an integer', () => {
    expect(() =>
      Classroom.create({
        ...baseProps,
        floor: 1.5,
      })
    ).toThrow(ValidationError);
  });
});
