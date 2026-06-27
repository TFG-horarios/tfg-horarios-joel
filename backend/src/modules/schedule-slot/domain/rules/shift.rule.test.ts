import { describe, expect, test } from 'bun:test';
import {
  buildScheduleTimeGrid,
  projectAssignmentInterval,
} from '@tfg-horarios/shared';
import { ShiftRule } from './shift.rule';
import type { MoveValidationContext } from './move-validation';
import { ConflictError } from '@/core/errors/app.error';

describe('ShiftRule', () => {
  const rule = new ShiftRule();
  const grid = buildScheduleTimeGrid(
    { slotDurationMinutes: 55, breakDurationMinutes: 30 },
    {
      startTime: '08:00',
      endTime: '14:00',
      hasBreak: true,
      breakAfterSlot: 3,
    }
  );
  const baseContext = {
    timeGrids: { config: grid },
    projectIntervalForPlacement: (
      timeConfigId: string | null | undefined,
      slotIndex: number | null,
      duration: number
    ) =>
      timeConfigId && slotIndex !== null
        ? projectAssignmentInterval(grid, slotIndex, duration)
        : null,
  };

  test('does not throw if placement fits in the local time grid', () => {
    const ctx = {
      newSlotIndex: 1,
      movingAssignment: {
        shift: 'morning',
        duration: 2,
        timeConfigId: 'config',
      },
      ...baseContext,
    } as unknown as MoveValidationContext;

    expect(() => rule.validate(ctx)).not.toThrow();
  });

  test('throws ERR_BREAK_CROSSING if placement crosses the configured break', () => {
    const ctx = {
      newSlotIndex: 2,
      movingAssignment: {
        shift: 'morning',
        duration: 2,
        timeConfigId: 'config',
      },
      ...baseContext,
    } as unknown as MoveValidationContext;

    expect(() => rule.validate(ctx)).toThrow(
      new ConflictError('ERR_BREAK_CROSSING')
    );
  });

  test('throws ERR_SHIFT_EXCEEDS_DAY if placement does not fit in the local grid', () => {
    const ctx = {
      newSlotIndex: 5,
      movingAssignment: {
        shift: 'morning',
        duration: 2,
        timeConfigId: 'config',
      },
      ...baseContext,
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
