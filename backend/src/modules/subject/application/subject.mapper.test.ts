import { describe, expect, test } from 'bun:test';
import { SubjectMapper } from './subject.mapper';
import { Subject } from '../domain/subject.entity';

describe('SubjectMapper', () => {
  test('should map Subject to SubjectDTO', () => {
    const date = new Date();
    const subject = Subject.reconstitute({
      id: 'sub-1',
      organizationId: 'org-1',
      degreeId: 'deg-1',
      itineraryId: null,
      name: 'Math',
      code: 'MATH',
      availableShifts: ['morning'],
      numberOfStudents: 30,
      courseYear: 1,
      period: 1,
      weeklyHours: 4,
      isCommon: true,
      createdAt: date,
      updatedAt: date,
      deletedAt: null,
    });
    const dto = SubjectMapper.toDTO(subject);
    expect(dto).toEqual({
      id: 'sub-1',
      organizationId: 'org-1',
      degreeId: 'deg-1',
      itineraryId: undefined,
      name: 'Math',
      code: 'MATH',
      availableShifts: ['morning'],
      numberOfStudents: 30,
      courseYear: 1,
      period: 1,
      weeklyHours: 4,
      isCommon: true,
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
    });
  });
});
