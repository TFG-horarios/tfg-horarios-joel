import { describe, expect, test } from 'bun:test';
import { StudentGapsConstraint } from './student-gaps.constraint';
import type { ConstraintContext } from '../constraint.interface';
import type { Assignment } from '../../types';

describe('StudentGapsConstraint', () => {
  const constraint = new StudentGapsConstraint();

  const createAssignment = (
    id: string,
    dayOfWeek: number,
    slotIndex: number,
    duration: number,
    isCommon: boolean,
    itineraryName: string | null = null
  ): Assignment =>
    ({
      id,
      degreeId: 'deg-1',
      courseYear: 1,
      shift: 'morning',
      dayOfWeek,
      slotIndex,
      duration,
      isCommon,
      itineraryName,
    }) as Assignment;

  test('should return 0 penalty if schedule is compact', () => {
    const context = {
      assignments: [
        createAssignment('a1', 1, 0, 1, true),
        createAssignment('a2', 1, 1, 1, true),
        createAssignment('a3', 1, 2, 1, true),
      ],
    } as unknown as ConstraintContext;

    const result = constraint.calculatePenalty(context);
    expect(result.penalty).toBe(0);
  });

  test('should penalize gaps correctly', () => {
    const context = {
      assignments: [
        createAssignment('a1', 1, 0, 1, true),
        createAssignment('a2', 1, 3, 2, true),
      ],
    } as unknown as ConstraintContext;

    const result = constraint.calculatePenalty(context);
    expect(result.penalty).toBe(20);
  });

  test('should not penalize gaps across different itineraries', () => {
    const context = {
      assignments: [
        createAssignment('c1', 1, 0, 1, true),
        createAssignment('iA', 1, 1, 1, false, 'ItinA'),
        createAssignment('iB', 1, 2, 1, false, 'ItinB'),
      ],
    } as unknown as ConstraintContext;

    const result = constraint.calculatePenalty(context);
    expect(result.penalty).toBe(10);
  });

  test('should handle overlapping practices in the same cohort without creating false gaps', () => {
    const context = {
      assignments: [
        createAssignment('a1', 1, 0, 2, true),
        createAssignment('a2', 1, 1, 2, true),
      ],
    } as unknown as ConstraintContext;

    const result = constraint.calculatePenalty(context);
    expect(result.penalty).toBe(0);
  });
});
