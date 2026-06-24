import { describe, expect, test } from 'bun:test';
import type { GroupType, Shift } from '@tfg-horarios/shared';
import { PenaltyCalculator } from '../../penalty-calculator';
import type { Assignment } from '../../types';
import type { ConstraintContext } from '../constraint.interface';
import { SubjectDailyDispersionConstraint } from './subject-daily-dispersion.constraint';

describe('SubjectDailyDispersionConstraint', () => {
  const constraint = new SubjectDailyDispersionConstraint();
  let assignmentId = 0;

  const createAssignment = (
    overrides: Partial<Assignment> = {}
  ): Assignment => ({
    id: `assignment-${assignmentId++}`,
    subjectGroupId: 'group-1',
    subjectId: 'subject-1',
    degreeId: 'degree-1',
    courseYear: 1,
    shift: 'morning',
    groupType: 'theory',
    isCommon: true,
    itineraryName: null,
    itineraryId: null,
    numberOfStudents: 30,
    needsComputerLab: false,
    classroomId: 'classroom-1',
    dayOfWeek: 1,
    slotIndex: 0,
    duration: 1,
    ...overrides,
  });

  const calculatePenalty = (assignments: Assignment[]): number =>
    constraint.calculatePenalty({ assignments } as ConstraintContext).penalty;

  test('spreads repeated sessions of a group across different days', () => {
    const spread = [
      createAssignment({ dayOfWeek: 1 }),
      createAssignment({ dayOfWeek: 2 }),
      createAssignment({ dayOfWeek: 3 }),
    ];
    const twoPlusOne = [
      createAssignment({ dayOfWeek: 1 }),
      createAssignment({ dayOfWeek: 1 }),
      createAssignment({ dayOfWeek: 2 }),
    ];
    const concentrated = [
      createAssignment({ dayOfWeek: 1 }),
      createAssignment({ dayOfWeek: 1 }),
      createAssignment({ dayOfWeek: 1 }),
    ];

    expect(calculatePenalty(spread)).toBe(0);
    expect(calculatePenalty(twoPlusOne)).toBe(10);
    expect(calculatePenalty(concentrated)).toBe(20);
  });

  test('penalizes each additional group type of a subject on the same day', () => {
    const assignments = [
      createAssignment({ subjectGroupId: 'theory', groupType: 'theory' }),
      createAssignment({ subjectGroupId: 'problems', groupType: 'problems' }),
      createAssignment({ subjectGroupId: 'practices', groupType: 'practices' }),
    ];

    expect(calculatePenalty(assignments.slice(0, 1))).toBe(0);
    expect(calculatePenalty(assignments.slice(0, 2))).toBe(10);
    expect(calculatePenalty(assignments)).toBe(20);
  });

  test('treats every real group type independently', () => {
    const groupTypes: GroupType[] = [
      'theory',
      'problems',
      'practices',
      'reduced_practices',
      'tutoring',
    ];
    const assignments = groupTypes.map((groupType) =>
      createAssignment({ subjectGroupId: groupType, groupType })
    );

    expect(calculatePenalty(assignments)).toBe(40);
  });

  test('does not count parallel groups of the same type twice', () => {
    const assignments = [
      createAssignment({
        subjectGroupId: 'practice-1',
        groupType: 'practices',
      }),
      createAssignment({
        subjectGroupId: 'practice-2',
        groupType: 'practices',
      }),
    ];

    expect(calculatePenalty(assignments)).toBe(0);
  });

  test('isolates subjects, days, and shifts', () => {
    const assignments = [
      createAssignment({ subjectGroupId: 'base', groupType: 'theory' }),
      createAssignment({
        subjectGroupId: 'other-subject',
        subjectId: 'subject-2',
        groupType: 'problems',
      }),
      createAssignment({
        subjectGroupId: 'other-day',
        dayOfWeek: 2,
        groupType: 'practices',
      }),
      createAssignment({
        subjectGroupId: 'other-shift',
        shift: 'afternoon' as Shift,
        groupType: 'reduced_practices',
      }),
    ];

    expect(calculatePenalty(assignments)).toBe(0);
  });

  test('combines both rules and ignores unassigned sessions', () => {
    const assignments = [
      createAssignment({ subjectGroupId: 'theory', groupType: 'theory' }),
      createAssignment({
        subjectGroupId: 'theory',
        groupType: 'theory',
        slotIndex: 1,
      }),
      createAssignment({ subjectGroupId: 'practice', groupType: 'practices' }),
      createAssignment({ dayOfWeek: null }),
      createAssignment({ slotIndex: null }),
    ];

    expect(calculatePenalty(assignments)).toBe(20);
  });

  test('includes locked assignments through the penalty calculator context', () => {
    const calculator = new PenaltyCalculator([], [constraint], {}, 6, 12);
    const generated = createAssignment({
      subjectGroupId: 'theory',
      groupType: 'theory',
    });
    const locked = createAssignment({
      subjectGroupId: 'practice',
      groupType: 'practices',
      isLocked: true,
    });

    expect(calculator.evaluateSoft([generated], [locked]).softPenalty).toBe(10);
  });
});
