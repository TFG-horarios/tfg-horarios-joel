import { describe, expect, test } from 'bun:test';
import { ShiftConstraint } from './shift.constraint';
import type { ConstraintContext } from './constraint.interface';

describe('ShiftConstraint', () => {
  const constraint = new ShiftConstraint();

  test('should return penalty if morning shift in afternoon slot', () => {
    const ctx = {
      maxMorningSlots: 6,
      maxSlotsPerDay: 12,
      assignments: [
        {
          id: '1',
          shift: 'morning',
          slotIndex: 7,
          duration: 2,
          subjectGroupId: 'sg-1',
        },
      ],
    } as unknown as ConstraintContext;

    const result = constraint.calculatePenalty(ctx);
    expect(result.penalty).toBe(1000);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0]?.type).toBe('SHIFT_MORNING');
  });

  test('should return penalty if morning shift bleeds into afternoon', () => {
    const ctx = {
      maxMorningSlots: 6,
      maxSlotsPerDay: 12,
      assignments: [
        {
          id: '1',
          shift: 'morning',
          slotIndex: 5,
          duration: 2,
          subjectGroupId: 'sg-1',
        },
      ],
    } as unknown as ConstraintContext;

    const result = constraint.calculatePenalty(ctx);
    expect(result.penalty).toBe(1000);
    expect(result.conflicts[0]?.type).toBe('SHIFT_MORNING');
  });

  test('should return penalty if afternoon shift in morning slot', () => {
    const ctx = {
      maxMorningSlots: 6,
      maxSlotsPerDay: 12,
      assignments: [
        {
          id: '1',
          shift: 'afternoon',
          slotIndex: 3,
          duration: 2,
          subjectGroupId: 'sg-1',
        },
      ],
    } as unknown as ConstraintContext;

    const result = constraint.calculatePenalty(ctx);
    expect(result.penalty).toBe(1000);
    expect(result.conflicts[0]?.type).toBe('SHIFT_AFTERNOON');
  });

  test('should return penalty if afternoon shift bleeds out of day', () => {
    const ctx = {
      maxMorningSlots: 6,
      maxSlotsPerDay: 12,
      assignments: [
        {
          id: '1',
          shift: 'afternoon',
          slotIndex: 11,
          duration: 2,
          subjectGroupId: 'sg-1',
        },
      ],
    } as unknown as ConstraintContext;

    const result = constraint.calculatePenalty(ctx);
    expect(result.penalty).toBe(1000);
    expect(result.conflicts[0]?.type).toBe('SHIFT_EXCEEDS_DAY');
  });

  test('should return 0 penalty if shift matches slot', () => {
    const ctx = {
      maxMorningSlots: 6,
      maxSlotsPerDay: 12,
      assignments: [
        {
          id: '1',
          shift: 'morning',
          slotIndex: 1,
          duration: 2,
          subjectGroupId: 'sg-1',
        },
        {
          id: '2',
          shift: 'afternoon',
          slotIndex: 7,
          duration: 2,
          subjectGroupId: 'sg-2',
        },
      ],
    } as unknown as ConstraintContext;

    const result = constraint.calculatePenalty(ctx);
    expect(result.penalty).toBe(0);
  });
});
