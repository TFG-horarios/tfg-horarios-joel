import { describe, expect, test } from 'bun:test';
import { SubjectDistributionConstraint } from './subject-distribution.constraint';
import type { ConstraintContext } from '../constraint.interface';
import type { Assignment } from '../../types';

describe('SubjectDistributionConstraint', () => {
  const constraint = new SubjectDistributionConstraint();

  const createAssignment = (
    id: string,
    subjectId: string,
    subjectGroupId: string,
    groupType: string,
    dayOfWeek: number,
    slotIndex: number,
    duration: number,
  ): Assignment =>
    ({
      id,
      subjectId,
      subjectGroupId,
      groupType,
      degreeId: 'deg-1',
      courseYear: 1,
      shift: 'morning',
      dayOfWeek,
      slotIndex,
      duration,
      isCommon: true,
      itineraryName: null,
    } as Assignment);

  test('should return 0 penalty if subject has 2h on the same day', () => {
    const context = {
      assignments: [
        createAssignment('a1', 'sub-1', 'sg-1', 'theory', 1, 0, 1),
        createAssignment('a2', 'sub-1', 'sg-1', 'theory', 1, 1, 1),
      ],
    } as unknown as ConstraintContext;

    const result = constraint.calculatePenalty(context);
    expect(result.penalty).toBe(0);
  });

  test('should penalize if subject has 4h on the same day', () => {
    const context = {
      assignments: [
        createAssignment('a1', 'sub-1', 'sg-1', 'theory', 1, 0, 1),
        createAssignment('a2', 'sub-1', 'sg-1', 'theory', 1, 1, 1),
        createAssignment('a3', 'sub-1', 'sg-1', 'theory', 1, 2, 1),
        createAssignment('a4', 'sub-1', 'sg-1', 'theory', 1, 3, 1),
      ],
    } as unknown as ConstraintContext;

    const result = constraint.calculatePenalty(context);
    expect(result.penalty).toBe(40);
  });

  test('should return 0 penalty if 4h are distributed across 2 days', () => {
    const context = {
      assignments: [
        createAssignment('a1', 'sub-1', 'sg-1', 'theory', 1, 0, 1),
        createAssignment('a2', 'sub-1', 'sg-1', 'theory', 1, 1, 1),
        createAssignment('a3', 'sub-1', 'sg-1', 'theory', 2, 0, 1),
        createAssignment('a4', 'sub-1', 'sg-1', 'theory', 2, 1, 1),
      ],
    } as unknown as ConstraintContext;

    const result = constraint.calculatePenalty(context);
    expect(result.penalty).toBe(0);
  });

  test('should penalize if theory and practices total > 2h on the same day', () => {
    const context = {
      assignments: [
        createAssignment('a1', 'sub-1', 'sg-1', 'theory', 1, 0, 2),
        createAssignment('a2', 'sub-1', 'sg-2', 'practices', 1, 2, 2),
      ],
    } as unknown as ConstraintContext;

    const result = constraint.calculatePenalty(context);
    expect(result.penalty).toBe(40);
  });

  test('should return 0 penalty if multiple parallel practice groups are on the same day', () => {
    const context = {
      assignments: [
        createAssignment('p1', 'sub-1', 'sg-p1', 'practices', 1, 0, 2),
        createAssignment('p2', 'sub-1', 'sg-p2', 'practices', 1, 2, 2),
        createAssignment('p3', 'sub-1', 'sg-p3', 'practices', 1, 4, 2),
      ],
    } as unknown as ConstraintContext;

    const result = constraint.calculatePenalty(context);
    expect(result.penalty).toBe(0);
  });

  test('should penalize correctly for parallel practice groups combined with theory', () => {
    const context = {
      assignments: [
        createAssignment('t1', 'sub-1', 'sg-t1', 'theory', 1, 0, 2),
        createAssignment('p1', 'sub-1', 'sg-p1', 'practices', 1, 2, 1),
        createAssignment('p2', 'sub-1', 'sg-p2', 'practices', 1, 3, 2),
      ],
    } as unknown as ConstraintContext;

    const result = constraint.calculatePenalty(context);
    expect(result.penalty).toBe(40);
  });
});
