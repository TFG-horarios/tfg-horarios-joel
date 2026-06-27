import { describe, expect, test } from 'bun:test';
import { buildScheduleTimeGrid } from '@tfg-horarios/shared';
import { GroupOverlapConstraint } from './group-overlap.constraint';
import { ConstraintContext } from '../constraint.interface';
import type { Assignment } from '../../types';

describe('GroupOverlapConstraint', () => {
  const constraint = new GroupOverlapConstraint();

  test('should return penalty if same group has multiple assignments in same slot', () => {
    const assignmentA = { id: '1', subjectGroupId: 'sg-1' } as Assignment;
    const assignmentB = { id: '2', subjectGroupId: 'sg-1' } as Assignment;
    const ctx = {
      projectedAssignments: [
        {
          assignment: assignmentA,
          dayOfWeek: 1,
          startMinutes: 8 * 60,
          endMinutes: 9 * 60,
        },
        {
          assignment: assignmentB,
          dayOfWeek: 1,
          startMinutes: 8 * 60,
          endMinutes: 9 * 60,
        },
      ],
    } as ConstraintContext;
    const result = constraint.calculatePenalty(ctx);

    expect(result.penalty).toBe(1000);
    expect(result.conflicts).toHaveLength(1);
  });

  test('should return 0 penalty if different groups', () => {
    const assignmentA = { id: '1', subjectGroupId: 'sg-1' } as Assignment;
    const assignmentB = { id: '2', subjectGroupId: 'sg-2' } as Assignment;
    const ctx = {
      projectedAssignments: [
        {
          assignment: assignmentA,
          dayOfWeek: 1,
          startMinutes: 8 * 60,
          endMinutes: 9 * 60,
        },
        {
          assignment: assignmentB,
          dayOfWeek: 1,
          startMinutes: 8 * 60,
          endMinutes: 9 * 60,
        },
      ],
    } as ConstraintContext;
    const result = constraint.calculatePenalty(ctx);

    expect(result.penalty).toBe(0);
  });

  test('does not penalize same logical slot when real minutes do not overlap', () => {
    const earlyGrid = buildScheduleTimeGrid(
      { slotDurationMinutes: 30, breakDurationMinutes: 0 },
      {
        startTime: '08:00',
        endTime: '10:00',
        hasBreak: false,
        breakAfterSlot: null,
      }
    );
    const lateGrid = buildScheduleTimeGrid(
      { slotDurationMinutes: 30, breakDurationMinutes: 0 },
      {
        startTime: '09:00',
        endTime: '11:00',
        hasBreak: false,
        breakAfterSlot: null,
      }
    );

    const ctx = new ConstraintContext(
      [
        {
          id: '1',
          subjectGroupId: 'sg-1',
          dayOfWeek: 1,
          slotIndex: 0,
          duration: 1,
          timeConfigId: 'early',
        } as Assignment,
        {
          id: '2',
          subjectGroupId: 'sg-1',
          dayOfWeek: 1,
          slotIndex: 0,
          duration: 1,
          timeConfigId: 'late',
        } as Assignment,
      ],
      {},
      { early: earlyGrid, late: lateGrid }
    );

    const result = constraint.calculatePenalty(ctx);

    expect(result.penalty).toBe(0);
  });
});
