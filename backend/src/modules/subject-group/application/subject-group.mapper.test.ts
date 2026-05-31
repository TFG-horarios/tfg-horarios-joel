import { describe, expect, test } from 'bun:test';
import { SubjectGroupMapper } from './subject-group.mapper';
import { SubjectGroup } from '../domain/subject-group.entity';

describe('SubjectGroupMapper', () => {
  test('should map SubjectGroup to SubjectGroupDTO', () => {
    const date = new Date();
    const group = SubjectGroup.reconstitute({
      id: 'grp-1',
      organizationId: 'org-1',
      subjectId: 'sub-1',
      name: 'T1',
      groupType: 'theory',
      shift: 'morning',
      groupNumber: 1,
      weeklyHours: 4,
      numberOfStudents: 30,
      createdAt: date,
      updatedAt: date,
      deletedAt: null,
    });
    const dto = SubjectGroupMapper.toDTO(group);
    expect(dto).toEqual({
      id: 'grp-1',
      organizationId: 'org-1',
      subjectId: 'sub-1',
      name: 'T1',
      groupType: 'theory',
      shift: 'morning',
      groupNumber: 1,
      weeklyHours: 4,
      numberOfStudents: 30,
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
      deletedAt: null,
    });
  });
});
