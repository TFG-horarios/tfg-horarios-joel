import { describe, expect, test } from 'bun:test';
import { CourseOverlapConstraint } from './course-overlap.constraint';
import type { ConstraintContext } from '../constraint.interface';
import type { Assignment } from '../../types';

describe('CourseOverlapConstraint', () => {
  const constraint = new CourseOverlapConstraint();

  const createMockContext = (classes: Assignment[]): ConstraintContext => {
    const timeSlotsForDegree = new Map<string, Assignment[]>();
    timeSlotsForDegree.set('1', classes);
    const degreeGroups = new Map<string, Map<string, Assignment[]>>();
    degreeGroups.set('deg-1_1', timeSlotsForDegree);

    return {
      degreeGroups,
      timeSlots: new Map(),
      assignments: [],
      classroomsCache: {},
      maxMorningSlots: 6,
      maxSlotsPerDay: 12,
    };
  };

  test('should return 0 penalty if no overlap', () => {
    const ctx = createMockContext([
      {
        id: '1',
        subjectGroupId: 'sg-1',
        isCommon: true,
        groupType: 'theory',
        subjectId: 'sub-1',
      } as Assignment,
    ]);
    const result = constraint.calculatePenalty(ctx);
    expect(result.penalty).toBe(0);
    expect(result.conflicts).toHaveLength(0);
  });

  test('should return penalty if theory overlaps with anything', () => {
    const ctx = createMockContext([
      {
        id: '1',
        subjectGroupId: 'sg-1',
        isCommon: true,
        groupType: 'theory',
        subjectId: 'sub-1',
      } as Assignment,
      {
        id: '2',
        subjectGroupId: 'sg-2',
        isCommon: true,
        groupType: 'practices',
        subjectId: 'sub-2',
      } as Assignment,
    ]);
    const result = constraint.calculatePenalty(ctx);
    expect(result.penalty).toBeGreaterThan(0);
    expect(result.conflicts).toHaveLength(2);
  });

  test('should return penalty if same subject overlaps', () => {
    const ctx = createMockContext([
      {
        id: '1',
        subjectGroupId: 'sg-1',
        isCommon: true,
        groupType: 'practices',
        subjectId: 'sub-1',
      } as Assignment,
      {
        id: '2',
        subjectGroupId: 'sg-2',
        isCommon: true,
        groupType: 'practices',
        subjectId: 'sub-1',
      } as Assignment,
    ]);
    const result = constraint.calculatePenalty(ctx);
    expect(result.penalty).toBeGreaterThan(0);
  });

  test('should not return penalty if different subjects and different group types', () => {
    const ctx = createMockContext([
      {
        id: '1',
        subjectGroupId: 'sg-1',
        isCommon: true,
        groupType: 'practices',
        subjectId: 'sub-1',
      } as Assignment,
      {
        id: '2',
        subjectGroupId: 'sg-2',
        isCommon: true,
        groupType: 'practices',
        subjectId: 'sub-2',
      } as Assignment,
    ]);
    const result = constraint.calculatePenalty(ctx);
    expect(result.penalty).toBe(0);
  });
});
