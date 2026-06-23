import { describe, expect, test } from 'bun:test';
import { ValidationError } from '@/core/errors/app.error';
import { SubjectGroup } from './subject-group.entity';

describe('SubjectGroup', () => {
  const baseProps = {
    organizationId: 'org-1',
    subjectId: 'sub-1',
    name: 'Theory 1',
    groupType: 'theory' as const,
    shift: 'morning' as const,
    groupNumber: 1,
    weeklyHours: 4,
    numberOfStudents: 30,
      needsComputerLab: false,
  };

  test('creates a subject group successfully', () => {
    const group = SubjectGroup.create(baseProps);
    expect(group.name).toBe('Theory 1');
    expect(group.id).toBeString();
  });

  test('throws ValidationError if groupNumber is invalid', () => {
    expect(() => SubjectGroup.create({ ...baseProps, groupNumber: 0 })).toThrow(
      ValidationError
    );
  });

  test('throws ValidationError if weeklyHours is invalid', () => {
    expect(() => SubjectGroup.create({ ...baseProps, weeklyHours: 0 })).toThrow(
      ValidationError
    );
  });

  test('throws ValidationError if numberOfStudents is negative', () => {
    expect(() =>
      SubjectGroup.create({ ...baseProps, numberOfStudents: -1 })
    ).toThrow(ValidationError);
  });

  test('reconstitutes subject group from persisted props', () => {
    const date = new Date();
    const group = SubjectGroup.reconstitute({
      ...baseProps,
      id: 'grp-1',
      createdAt: date,
      updatedAt: date,
      deletedAt: null,
    });
    expect(group.id).toBe('grp-1');
  });

  test('updates subject group successfully', () => {
    const group = SubjectGroup.create(baseProps);
    group.update({
      name: 'Practices 2',
      groupType: 'practices',
      shift: 'afternoon',
      groupNumber: 2,
      weeklyHours: 2,
      numberOfStudents: 15,
      needsComputerLab: false,
    });
    expect(group.name).toBe('Practices 2');
    expect(group.groupType).toBe('practices');
    expect(group.shift).toBe('afternoon');
  });
});
