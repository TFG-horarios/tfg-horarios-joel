import { describe, expect, test } from 'bun:test';
import { ShiftRule } from './shift.rule';
import type { MoveValidationContext } from './move-validation';
import { ConflictError } from '@/core/errors/app.error';

describe('ShiftRule', () => {
  const rule = new ShiftRule();

  test('does not throw if morning shift is valid', () => {
    const ctx = {
      newSlotIndex: 1,
      movingAssignment: { shift: 'morning', duration: 2 },
      maxMorningSlots: 6,
      maxSlotsPerDay: 12,
    } as unknown as MoveValidationContext;

    expect(() => rule.validate(ctx)).not.toThrow();
  });

  test('throws ERR_SHIFT_MORNING if morning shift bleeds into afternoon', () => {
    const ctx = {
      newSlotIndex: 5,
      movingAssignment: { shift: 'morning', duration: 2 },
      maxMorningSlots: 6,
      maxSlotsPerDay: 12,
    } as unknown as MoveValidationContext;

    expect(() => rule.validate(ctx)).toThrow(
      new ConflictError('ERR_SHIFT_MORNING')
    );
  });

  test('throws ERR_SHIFT_MORNING if morning shift starts in afternoon', () => {
    const ctx = {
      newSlotIndex: 7,
      movingAssignment: { shift: 'morning', duration: 2 },
      maxMorningSlots: 6,
      maxSlotsPerDay: 12,
    } as unknown as MoveValidationContext;

    expect(() => rule.validate(ctx)).toThrow(
      new ConflictError('ERR_SHIFT_MORNING')
    );
  });

  test('throws ERR_SHIFT_AFTERNOON if afternoon shift starts in morning', () => {
    const ctx = {
      newSlotIndex: 3,
      movingAssignment: { shift: 'afternoon', duration: 2 },
      maxMorningSlots: 6,
      maxSlotsPerDay: 12,
    } as unknown as MoveValidationContext;

    expect(() => rule.validate(ctx)).toThrow(
      new ConflictError('ERR_SHIFT_AFTERNOON')
    );
  });

  test('throws ERR_SHIFT_EXCEEDS_DAY if afternoon shift bleeds out of day', () => {
    const ctx = {
      newSlotIndex: 11,
      movingAssignment: { shift: 'afternoon', duration: 2 },
      maxMorningSlots: 6,
      maxSlotsPerDay: 12,
    } as unknown as MoveValidationContext;

    expect(() => rule.validate(ctx)).toThrow(
      new ConflictError('ERR_SHIFT_EXCEEDS_DAY')
    );
  });

  test('does not throw if newSlotIndex is null', () => {
    const ctx = {
      newSlotIndex: null,
      movingAssignment: { shift: 'morning', duration: 2 },
    } as unknown as MoveValidationContext;

    expect(() => rule.validate(ctx)).not.toThrow();
  });
});
