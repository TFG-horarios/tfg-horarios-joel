import { describe, expect, test } from 'bun:test';
import { buildScheduleTimeGrid } from '@tfg-horarios/shared';
import { ShiftConstraint } from './shift.constraint';
import { ConstraintContext } from '../constraint.interface';
import type { Assignment } from '../../types';

const grid = buildScheduleTimeGrid(
  { slotDurationMinutes: 60, breakDurationMinutes: 30 },
  {
    startTime: '08:00',
    endTime: '12:30',
    hasBreak: true,
    breakAfterSlot: 2,
  }
);

const assignment = (overrides: Partial<Assignment> = {}): Assignment =>
  ({
    id: 'a-1',
    subjectGroupId: 'sg-1',
    subjectId: 'subject-1',
    shift: 'morning',
    groupType: 'theory',
    isCommon: true,
    itineraryName: null,
    itineraryId: null,
    numberOfStudents: 30,
    needsComputerLab: false,
    degreeId: 'degree-1',
    courseYear: 1,
    timeConfigId: 'config-1',
    classroomId: 'room-1',
    dayOfWeek: 1,
    slotIndex: 0,
    duration: 1,
    ...overrides,
  }) as Assignment;

describe('ShiftConstraint', () => {
  const constraint = new ShiftConstraint();

  test('accepts assignments that fit inside their time config', () => {
    const ctx = new ConstraintContext([assignment()], {}, { 'config-1': grid });

    const result = constraint.calculatePenalty(ctx);

    expect(result.penalty).toBe(0);
    expect(result.conflicts).toHaveLength(0);
  });

  test('rejects assignments that exceed the local grid', () => {
    const ctx = new ConstraintContext(
      [assignment({ slotIndex: 3, duration: 2 })],
      {},
      { 'config-1': grid }
    );

    const result = constraint.calculatePenalty(ctx);

    expect(result.penalty).toBe(1000);
    expect(result.conflicts[0]?.type).toBe('SHIFT_EXCEEDS_DAY');
  });

  test('rejects assignments that cross the configured break', () => {
    const ctx = new ConstraintContext(
      [assignment({ slotIndex: 1, duration: 2 })],
      {},
      { 'config-1': grid }
    );

    const result = constraint.calculatePenalty(ctx);

    expect(result.penalty).toBe(1000);
    expect(result.conflicts[0]?.type).toBe('BREAK_CROSSING');
  });
});
