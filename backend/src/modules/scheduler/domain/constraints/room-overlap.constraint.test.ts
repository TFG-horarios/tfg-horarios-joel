import { describe, expect, test } from 'bun:test';
import { RoomOverlapConstraint } from './room-overlap.constraint';
import type { ConstraintContext } from './constraint.interface';
import type { Assignment } from '../types';

describe('RoomOverlapConstraint', () => {
  const constraint = new RoomOverlapConstraint();

  test('should return penalty if room is assigned to multiple groups in same slot', () => {
    const timeSlots = new Map<string, Assignment[]>();
    timeSlots.set('1-1', [
      { id: '1', classroomId: 'room-1', subjectGroupId: 'sg-1' } as Assignment,
      { id: '2', classroomId: 'room-1', subjectGroupId: 'sg-2' } as Assignment,
    ]);

    const ctx = { timeSlots } as unknown as ConstraintContext;
    const result = constraint.calculatePenalty(ctx);

    expect(result.penalty).toBe(1000);
    expect(result.conflicts).toHaveLength(2);
  });

  test('should return 0 penalty if different rooms', () => {
    const timeSlots = new Map<string, Assignment[]>();
    timeSlots.set('1-1', [
      { id: '1', classroomId: 'room-1', subjectGroupId: 'sg-1' } as Assignment,
      { id: '2', classroomId: 'room-2', subjectGroupId: 'sg-2' } as Assignment,
    ]);

    const ctx = { timeSlots } as unknown as ConstraintContext;
    const result = constraint.calculatePenalty(ctx);

    expect(result.penalty).toBe(0);
  });
});
