import { describe, expect, test } from 'bun:test';
import { GroupOverlapConstraint } from './group-overlap.constraint';
import type { ConstraintContext } from './constraint.interface';
import type { Assignment } from '../types';

describe('GroupOverlapConstraint', () => {
  const constraint = new GroupOverlapConstraint();

  test('should return penalty if same group has multiple assignments in same slot', () => {
    const timeSlots = new Map<string, Assignment[]>();
    timeSlots.set('1-1', [
      { id: '1', subjectGroupId: 'sg-1' } as Assignment,
      { id: '2', subjectGroupId: 'sg-1' } as Assignment,
    ]);

    const ctx = { timeSlots } as unknown as ConstraintContext;
    const result = constraint.calculatePenalty(ctx);

    expect(result.penalty).toBe(1000);
    expect(result.conflicts).toHaveLength(1);
  });

  test('should return 0 penalty if different groups', () => {
    const timeSlots = new Map<string, Assignment[]>();
    timeSlots.set('1-1', [
      { id: '1', subjectGroupId: 'sg-1' } as Assignment,
      { id: '2', subjectGroupId: 'sg-2' } as Assignment,
    ]);

    const ctx = { timeSlots } as unknown as ConstraintContext;
    const result = constraint.calculatePenalty(ctx);

    expect(result.penalty).toBe(0);
  });
});
