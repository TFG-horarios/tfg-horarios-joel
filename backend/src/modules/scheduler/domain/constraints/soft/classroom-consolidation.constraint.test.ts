import { describe, expect, test } from 'bun:test';
import { ClassroomConsolidationConstraint } from './classroom-consolidation.constraint';
import type { ConstraintContext } from '../constraint.interface';

describe('ClassroomConsolidationConstraint', () => {
  const constraint = new ClassroomConsolidationConstraint();

  test('should penalize based on number of unique classrooms', () => {
    const context = {
      assignments: [
        { classroomId: 'c1' },
        { classroomId: 'c1' },
        { classroomId: 'c2' },
        { classroomId: null },
      ],
    } as unknown as ConstraintContext;

    const result = constraint.calculatePenalty(context);
    expect(result.penalty).toBe(40);
    expect(result.conflicts).toHaveLength(0);
  });

  test('should return 0 penalty if no classrooms are assigned', () => {
    const context = {
      assignments: [{ classroomId: null }],
    } as unknown as ConstraintContext;

    const result = constraint.calculatePenalty(context);
    expect(result.penalty).toBe(0);
    expect(result.conflicts).toHaveLength(0);
  });
});
