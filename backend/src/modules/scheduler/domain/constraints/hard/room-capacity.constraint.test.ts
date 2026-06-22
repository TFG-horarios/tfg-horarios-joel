import { describe, expect, test } from 'bun:test';
import { RoomCapacityConstraint } from './room-capacity.constraint';
import type { ConstraintContext } from '../constraint.interface';

describe('RoomCapacityConstraint', () => {
  const constraint = new RoomCapacityConstraint();

  test('should return penalty if capacity exceeded', () => {
    const ctx = {
      assignments: [
        {
          id: '1',
          classroomId: 'room-1',
          numberOfStudents: 50,
          subjectGroupId: 'sg-1',
        },
      ],
      classroomsCache: {
        'room-1': { capacity: 30 },
      },
    } as unknown as ConstraintContext;

    const result = constraint.calculatePenalty(ctx);
    expect(result.penalty).toBe(1000);
    expect(result.conflicts).toHaveLength(1);
  });

  test('should return 0 penalty if capacity not exceeded', () => {
    const ctx = {
      assignments: [
        {
          id: '1',
          classroomId: 'room-1',
          numberOfStudents: 20,
          subjectGroupId: 'sg-1',
        },
      ],
      classroomsCache: {
        'room-1': { capacity: 30 },
      },
    } as unknown as ConstraintContext;

    const result = constraint.calculatePenalty(ctx);
    expect(result.penalty).toBe(0);
  });
});
