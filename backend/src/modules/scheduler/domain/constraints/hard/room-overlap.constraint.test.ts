import { describe, expect, test } from 'bun:test';
import { buildScheduleTimeGrid } from '@tfg-horarios/shared';
import { RoomOverlapConstraint } from './room-overlap.constraint';
import { ConstraintContext } from '../constraint.interface';
import type { Assignment } from '../../types';

describe('RoomOverlapConstraint', () => {
  const constraint = new RoomOverlapConstraint();

  test('should return penalty if room is assigned to multiple groups in same slot', () => {
    const assignmentA = {
      id: '1',
      classroomId: 'room-1',
      subjectGroupId: 'sg-1',
    } as Assignment;
    const assignmentB = {
      id: '2',
      classroomId: 'room-1',
      subjectGroupId: 'sg-2',
    } as Assignment;
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
    expect(result.conflicts).toHaveLength(2);
  });

  test('should return 0 penalty if different rooms', () => {
    const assignmentA = {
      id: '1',
      classroomId: 'room-1',
      subjectGroupId: 'sg-1',
    } as Assignment;
    const assignmentB = {
      id: '2',
      classroomId: 'room-2',
      subjectGroupId: 'sg-2',
    } as Assignment;
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

  test('detects room overlap by real minutes across desynchronized grids', () => {
    const gridA = buildScheduleTimeGrid(
      { slotDurationMinutes: 60, breakDurationMinutes: 0 },
      {
        startTime: '08:00',
        endTime: '12:00',
        hasBreak: false,
        breakAfterSlot: null,
      }
    );
    const gridB = buildScheduleTimeGrid(
      { slotDurationMinutes: 60, breakDurationMinutes: 0 },
      {
        startTime: '08:30',
        endTime: '12:30',
        hasBreak: false,
        breakAfterSlot: null,
      }
    );

    const base = {
      classroomId: 'room-1',
      dayOfWeek: 1,
      slotIndex: 0,
      duration: 1,
      shift: 'morning',
      groupType: 'theory',
      isCommon: true,
      itineraryName: null,
      numberOfStudents: 20,
      needsComputerLab: false,
      degreeId: 'degree-1',
      courseYear: 1,
    } satisfies Partial<Assignment>;

    const ctx = new ConstraintContext(
      [
        {
          ...base,
          id: 'a',
          subjectGroupId: 'sg-a',
          subjectId: 'subject-a',
          timeConfigId: 'config-a',
        } as Assignment,
        {
          ...base,
          id: 'b',
          subjectGroupId: 'sg-b',
          subjectId: 'subject-b',
          timeConfigId: 'config-b',
        } as Assignment,
      ],
      {},
      { 'config-a': gridA, 'config-b': gridB }
    );

    const result = constraint.calculatePenalty(ctx);

    expect(result.penalty).toBe(1000);
    expect(result.conflicts).toHaveLength(2);
  });
});
