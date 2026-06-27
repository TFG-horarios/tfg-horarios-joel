import { describe, expect, test } from 'bun:test';
import { CourseOverlapConstraint } from './course-overlap.constraint';
import type { ConstraintContext } from '../constraint.interface';
import type { Assignment } from '../../types';

describe('CourseOverlapConstraint', () => {
  const constraint = new CourseOverlapConstraint();

  const createMockContext = (classes: Assignment[]): ConstraintContext => {
    return {
      assignments: classes,
      classroomsCache: {},
      projectedAssignments: classes.map((assignment) => ({
        assignment,
        dayOfWeek: 1,
        startMinutes: 8 * 60,
        endMinutes: 9 * 60,
      })),
      invalidAssignments: [],
      timeGrids: {},
    } as ConstraintContext;
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
    expect(result.conflicts[0]?.type).toBe('COURSE_OVERLAP_THEORY');
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
    expect(result.conflicts[0]?.type).toBe('COURSE_OVERLAP_SAME_SUBJECT');
  });

  test('should return penalty if same practice type has a single group', () => {
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
    expect(result.penalty).toBeGreaterThan(0);
    expect(result.conflicts[0]?.type).toBe('COURSE_OVERLAP_SINGLE_GROUP');
  });

  test('should return penalty if common overlaps with itinerary', () => {
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
        isCommon: false,
        itineraryName: 'Itin A',
        groupType: 'practices',
        subjectId: 'sub-2',
      } as Assignment,
    ]);
    const result = constraint.calculatePenalty(ctx);
    expect(result.penalty).toBeGreaterThan(0);
    expect(result.conflicts[0]?.type).toBe('COURSE_OVERLAP_COMMON_ITINERARY');
  });

  test('should return penalty if different practices overlap', () => {
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
        groupType: 'problems',
        subjectId: 'sub-2',
      } as Assignment,
    ]);
    const result = constraint.calculatePenalty(ctx);
    expect(result.penalty).toBeGreaterThan(0);
    expect(result.conflicts[0]?.type).toBe('COURSE_OVERLAP_SINGLE_GROUP');
  });
});
