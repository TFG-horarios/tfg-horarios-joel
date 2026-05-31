import { describe, expect, test } from 'bun:test';
import { ValidationError } from '@/core/errors/app.error';
import { Subject } from './subject.entity';

describe('Subject', () => {
  const baseProps = {
    organizationId: 'org-1',
    degreeId: 'deg-1',
    name: 'Math',
    code: 'MATH101',
    availableShifts: ['morning' as const],
    numberOfStudents: 30,
    courseYear: 1,
    period: 1,
    weeklyHours: 4,
  };

  test('creates a common subject successfully', () => {
    const subject = Subject.create({
      ...baseProps,
      isCommon: true,
      itineraryId: null,
    });
    expect(subject.isCommon).toBeTrue();
    expect(subject.itineraryId).toBeNull();
    expect(subject.id).toBeString();
  });

  test('creates a specific subject successfully', () => {
    const subject = Subject.create({
      ...baseProps,
      isCommon: false,
      itineraryId: 'itin-1',
    });
    expect(subject.isCommon).toBeFalse();
    expect(subject.itineraryId).toBe('itin-1');
  });

  test('throws ValidationError if common subject has itineraryId', () => {
    expect(() =>
      Subject.create({ ...baseProps, isCommon: true, itineraryId: 'itin-1' })
    ).toThrow(ValidationError);
  });

  test('throws ValidationError if specific subject has no itineraryId', () => {
    expect(() =>
      Subject.create({ ...baseProps, isCommon: false, itineraryId: null })
    ).toThrow(ValidationError);
  });

  test('throws ValidationError if no available shifts', () => {
    expect(() =>
      Subject.create({
        ...baseProps,
        isCommon: true,
        itineraryId: null,
        availableShifts: [],
      })
    ).toThrow(ValidationError);
  });

  test('reconstitutes subject from persisted props', () => {
    const date = new Date();
    const subject = Subject.reconstitute({
      ...baseProps,
      id: 'sub-1',
      isCommon: true,
      itineraryId: null,
      createdAt: date,
      updatedAt: date,
      deletedAt: null,
    });
    expect(subject.id).toBe('sub-1');
  });

  test('updates subject successfully', () => {
    const subject = Subject.create({
      ...baseProps,
      isCommon: true,
      itineraryId: null,
    });
    subject.update({
      name: 'Physics',
      code: 'PHYS101',
      availableShifts: ['afternoon'],
      numberOfStudents: 40,
      courseYear: 2,
      period: 2,
      weeklyHours: 6,
      isCommon: false,
      itineraryId: 'itin-1',
    });
    expect(subject.name).toBe('Physics');
    expect(subject.code).toBe('PHYS101');
    expect(subject.availableShifts).toEqual(['afternoon']);
    expect(subject.isCommon).toBeFalse();
    expect(subject.itineraryId).toBe('itin-1');
  });

  test('updates clears itineraryId if changed to common', () => {
    const subject = Subject.create({
      ...baseProps,
      isCommon: false,
      itineraryId: 'itin-1',
    });
    subject.update({
      name: 'Math',
      code: 'MATH101',
      availableShifts: ['morning'],
      numberOfStudents: 30,
      courseYear: 1,
      period: 1,
      weeklyHours: 4,
      isCommon: true,
      itineraryId: 'itin-1',
    });
    expect(subject.isCommon).toBeTrue();
    expect(subject.itineraryId).toBeNull();
  });
});
