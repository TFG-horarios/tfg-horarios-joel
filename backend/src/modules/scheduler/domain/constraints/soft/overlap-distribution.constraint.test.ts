import { describe, expect, test } from 'bun:test';
import { buildScheduleTimeGrid, type Shift } from '@tfg-horarios/shared';
import { ConstraintContext } from '../constraint.interface';
import type { Assignment } from '../../types';
import { OverlapDistributionConstraint } from './overlap-distribution.constraint';

describe('OverlapDistributionConstraint', () => {
  const constraint = new OverlapDistributionConstraint();
  let assignmentId = 0;

  const createAssignment = (
    slotIndex: number | null,
    overrides: Partial<Assignment> = {}
  ): Assignment => ({
    id: `assignment-${assignmentId++}`,
    subjectGroupId: `group-${assignmentId}`,
    subjectId: `subject-${assignmentId}`,
    degreeId: 'degree-1',
    courseYear: 1,
    shift: 'morning',
    groupType: 'theory',
    isCommon: false,
    itineraryName: `itinerary-${assignmentId}`,
    itineraryId: `itinerary-${assignmentId}`,
    numberOfStudents: 30,
    needsComputerLab: false,
    classroomId: 'classroom-1',
    dayOfWeek: 1,
    slotIndex,
    duration: 1,
    ...overrides,
  });

  const calculatePenalty = (assignments: Assignment[]): number =>
    constraint.calculatePenalty({ assignments } as ConstraintContext).penalty;

  test('does not penalize classes that do not overlap', () => {
    expect(calculatePenalty([createAssignment(0), createAssignment(1)])).toBe(
      0
    );
  });

  test('penalizes overlap peaks quadratically', () => {
    expect(
      calculatePenalty([
        createAssignment(0),
        createAssignment(0),
        createAssignment(0),
        createAssignment(0),
      ])
    ).toBe(45);
  });

  test('prefers distributed overlaps over concentrated peaks', () => {
    const concentrated = calculatePenalty([
      createAssignment(0),
      createAssignment(0),
      createAssignment(0),
      createAssignment(0),
      createAssignment(1),
    ]);
    const distributed = calculatePenalty([
      createAssignment(0),
      createAssignment(0),
      createAssignment(1),
      createAssignment(1),
      createAssignment(1),
    ]);

    expect(concentrated).toBe(45);
    expect(distributed).toBe(25);
    expect(distributed).toBeLessThan(concentrated);
  });

  test('isolates days and schedule dimensions', () => {
    const dimensions: Array<Partial<Assignment>> = [
      { dayOfWeek: 2 },
      { degreeId: 'degree-2' },
      { courseYear: 2 },
      { shift: 'afternoon' as Shift },
    ];
    const assignments = [createAssignment(0)];

    for (const dimension of dimensions) {
      assignments.push(createAssignment(0, dimension));
    }

    expect(calculatePenalty(assignments)).toBe(0);
  });

  test('ignores unassigned classes', () => {
    expect(
      calculatePenalty([
        createAssignment(0),
        createAssignment(null),
        createAssignment(0, { dayOfWeek: null }),
      ])
    ).toBe(0);
  });

  test('uses real minutes across desynchronized grids', () => {
    const earlyGrid = buildScheduleTimeGrid(
      { slotDurationMinutes: 60, breakDurationMinutes: 0 },
      {
        startTime: '08:00',
        endTime: '12:00',
        hasBreak: false,
        breakAfterSlot: null,
      }
    );
    const lateGrid = buildScheduleTimeGrid(
      { slotDurationMinutes: 60, breakDurationMinutes: 0 },
      {
        startTime: '08:30',
        endTime: '12:30',
        hasBreak: false,
        breakAfterSlot: null,
      }
    );

    const context = new ConstraintContext(
      [
        createAssignment(0, { timeConfigId: 'early' }),
        createAssignment(0, { timeConfigId: 'late' }),
      ],
      {},
      { early: earlyGrid, late: lateGrid }
    );

    expect(constraint.calculatePenalty(context).penalty).toBe(5);
  });
});
