import { describe, expect, test } from 'bun:test';
import type { GroupType, Shift } from '@tfg-horarios/shared';
import type { ConstraintContext } from '../constraint.interface';
import type { Assignment } from '../../types';
import { GroupTypeOrderConstraint } from './group-type-order.constraint';

describe('GroupTypeOrderConstraint', () => {
  const constraint = new GroupTypeOrderConstraint();
  let assignmentId = 0;

  const createAssignment = (
    groupType: GroupType,
    slotIndex: number | null,
    overrides: Partial<Assignment> = {}
  ): Assignment => ({
    id: `assignment-${assignmentId++}`,
    subjectGroupId: `group-${assignmentId}`,
    subjectId: `subject-${assignmentId}`,
    degreeId: 'degree-1',
    courseYear: 1,
    shift: 'morning',
    groupType,
    isCommon: true,
    itineraryName: null,
    itineraryId: null,
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

  test('does not penalize the preferred order, gaps, or practical subtypes', () => {
    const assignments = [
      createAssignment('theory', 0),
      createAssignment('theory', 3),
      createAssignment('problems', 5),
      createAssignment('practices', 7),
      createAssignment('tutoring', 8),
      createAssignment('reduced_practices', 9),
    ];

    expect(calculatePenalty(assignments)).toBe(0);
  });

  test('penalizes each backwards transition', () => {
    const singleInversion = [
      createAssignment('problems', 0),
      createAssignment('theory', 1),
    ];
    const fullyReversed = [
      createAssignment('practices', 0),
      createAssignment('problems', 1),
      createAssignment('theory', 2),
    ];

    expect(calculatePenalty(singleInversion)).toBe(10);
    expect(calculatePenalty(fullyReversed)).toBe(20);
  });

  test('penalizes interleaving more than a simple inversion', () => {
    const assignments = [
      createAssignment('theory', 0),
      createAssignment('problems', 1),
      createAssignment('theory', 2),
    ];

    expect(calculatePenalty(assignments)).toBe(30);
  });

  test('accumulates multiple type reappearances', () => {
    const assignments = [
      createAssignment('theory', 0),
      createAssignment('problems', 1),
      createAssignment('theory', 2),
      createAssignment('problems', 3),
    ];

    expect(calculatePenalty(assignments)).toBe(50);
  });

  test('evaluates common classes with each itinerary independently', () => {
    const assignments = [
      createAssignment('problems', 1, { isCommon: true }),
      createAssignment('theory', 2, {
        isCommon: false,
        itineraryId: 'itinerary-a',
      }),
      createAssignment('practices', 2, {
        isCommon: false,
        itineraryId: 'itinerary-b',
      }),
    ];

    expect(calculatePenalty(assignments)).toBe(10);
  });

  test('does not mix different itineraries', () => {
    const assignments = [
      createAssignment('theory', 0, { isCommon: true }),
      createAssignment('practices', 1, {
        isCommon: false,
        itineraryId: 'itinerary-a',
      }),
      createAssignment('problems', 2, {
        isCommon: false,
        itineraryId: 'itinerary-b',
      }),
    ];

    expect(calculatePenalty(assignments)).toBe(0);
  });

  test('isolates days and schedule dimensions', () => {
    const dimensions: Array<Partial<Assignment>> = [
      { dayOfWeek: 2 },
      { degreeId: 'degree-2' },
      { courseYear: 2 },
      { shift: 'afternoon' as Shift },
    ];
    const assignments = [createAssignment('theory', 1)];

    for (const dimension of dimensions) {
      assignments.push(createAssignment('problems', 0, dimension));
    }

    expect(calculatePenalty(assignments)).toBe(0);
  });

  test('ignores unassigned classes', () => {
    const assignments = [
      createAssignment('theory', 1),
      createAssignment('problems', null),
      createAssignment('practices', 0, { dayOfWeek: null }),
    ];

    expect(calculatePenalty(assignments)).toBe(0);
  });
});
