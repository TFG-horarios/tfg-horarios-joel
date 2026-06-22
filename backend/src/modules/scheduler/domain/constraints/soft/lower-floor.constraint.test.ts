import { describe, expect, test } from 'bun:test';
import { LowerFloorConstraint } from './lower-floor.constraint';
import type { ConstraintContext } from '../constraint.interface';

describe('LowerFloorConstraint', () => {
  const constraint = new LowerFloorConstraint();

  test('should return 0 penalty if all classrooms are on floor 0', () => {
    const context = {
      classroomsCache: {
        c1: { capacity: 30, type: 'theory', floor: 0 },
      },
      assignments: [
        { classroomId: 'c1' },
      ],
    } as unknown as ConstraintContext;

    const result = constraint.calculatePenalty(context);
    expect(result.penalty).toBe(0);
    expect(result.conflicts).toHaveLength(0);
  });

  test('should apply penalty proportional to the floor number', () => {
    const context = {
      classroomsCache: {
        c1: { capacity: 30, type: 'theory', floor: 1 },
        c2: { capacity: 30, type: 'theory', floor: 2 },
        c3: { capacity: 30, type: 'theory', floor: -1 },
      },
      assignments: [
        { classroomId: 'c1' },
        { classroomId: 'c2' },
        { classroomId: 'c3' },
        { classroomId: null },
      ],
    } as unknown as ConstraintContext;

    const result = constraint.calculatePenalty(context);
    expect(result.penalty).toBe(30);
    expect(result.conflicts).toHaveLength(0);
  });
});
