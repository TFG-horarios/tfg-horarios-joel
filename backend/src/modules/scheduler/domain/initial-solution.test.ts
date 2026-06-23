import { describe, expect, test, mock } from 'bun:test';
import { InitialSolution, type GroupInitialData } from './initial-solution';
import { PenaltyCalculator } from './penalty-calculator';
import { CourseOverlapConstraint } from './constraints/hard/course-overlap.constraint';
import { RoomOverlapConstraint } from './constraints/hard/room-overlap.constraint';

describe('InitialSolution', () => {
  const penaltyCalculator = new PenaltyCalculator([], [], {}, 6, 12);
  penaltyCalculator.calculatePenalty = mock(() => 0);
  const classroomsCache = {
    'c-1': {
      id: 'c-1',
      name: 'A',
      type: 'theory' as const,
      capacity: 40,
      floor: 1,
      organizationId: 'org-1',
    },
  };
  const initial = new InitialSolution(
    penaltyCalculator,
    ['c-1'],
    classroomsCache,
    12,
    6,
    60,
    [1]
  );

  test('generates solution placing groups', () => {
    const groups: GroupInitialData[] = [
      {
        subjectGroupId: 'sg-1',
        subjectId: 's-1',
        groupType: 'theory',
        isCommon: false,
        numberOfStudents: 30,
      needsComputerLab: false,
        shift: 'morning',
        weeklyHours: 2,
        degreeId: 'd-1',
        courseYear: 1,
      },
    ];
    const result = initial.generate(groups);
    expect(result.assignments).toHaveLength(2);
    expect(result.assignments[0]?.classroomId).toBe('c-1');
  });

  test('assigns null if no classroom fits', () => {
    const initialEmpty = new InitialSolution(
      penaltyCalculator,
      [],
      classroomsCache,
      12,
      6,
      60,
      [1]
    );
    const groups: GroupInitialData[] = [
      {
        subjectGroupId: 'sg-1',
        subjectId: 's-1',
        groupType: 'practices',
        isCommon: false,
        numberOfStudents: 30,
      needsComputerLab: false,
        shift: 'morning',
        weeklyHours: 1,
        degreeId: 'd-1',
        courseYear: 1,
      },
    ];
    const result = initialEmpty.generate(groups);
    expect(result.assignments[0]?.classroomId).toBeNull();
  });

  test('compacts different itineraries into shared cells outside common classes', () => {
    const compactClassrooms = {
      'c-1': { type: 'theory' as const, capacity: 40, floor: 1 },
      'c-2': { type: 'theory' as const, capacity: 40, floor: 1 },
    };
    const calculator = new PenaltyCalculator(
      [new RoomOverlapConstraint(), new CourseOverlapConstraint()],
      [],
      compactClassrooms,
      4,
      4
    );
    const generator = new InitialSolution(
      calculator,
      Object.keys(compactClassrooms),
      compactClassrooms,
      4,
      4,
      60,
      [1]
    );
    const common = {
      isCommon: true,
      itineraryName: null,
      itineraryId: null,
    };
    const groups: GroupInitialData[] = [
      {
        subjectGroupId: 'common-group',
        subjectId: 'common-subject',
        groupType: 'theory',
        numberOfStudents: 30,
      needsComputerLab: false,
        shift: 'morning',
        weeklyHours: 2,
        degreeId: 'degree-1',
        courseYear: 4,
        ...common,
      },
      {
        subjectGroupId: 'group-a',
        subjectId: 'subject-a',
        groupType: 'theory',
        isCommon: false,
        itineraryName: 'Itinerary A',
        itineraryId: 'itinerary-a',
        numberOfStudents: 30,
      needsComputerLab: false,
        shift: 'morning',
        weeklyHours: 2,
        degreeId: 'degree-1',
        courseYear: 4,
      },
      {
        subjectGroupId: 'group-b',
        subjectId: 'subject-b',
        groupType: 'theory',
        isCommon: false,
        itineraryName: 'Itinerary B',
        itineraryId: 'itinerary-b',
        numberOfStudents: 30,
      needsComputerLab: false,
        shift: 'morning',
        weeklyHours: 2,
        degreeId: 'degree-1',
        courseYear: 4,
      },
    ];

    const result = generator.generate(groups);
    const commonCells = new Set(
      result.assignments
        .filter((assignment) => assignment.isCommon)
        .map((assignment) => assignment.slotIndex)
    );
    const itineraryACells = new Set(
      result.assignments
        .filter((assignment) => assignment.itineraryId === 'itinerary-a')
        .map((assignment) => assignment.slotIndex)
    );
    const itineraryBCells = new Set(
      result.assignments
        .filter((assignment) => assignment.itineraryId === 'itinerary-b')
        .map((assignment) => assignment.slotIndex)
    );

    expect(result.hardPenalty).toBe(0);
    expect(itineraryACells).toEqual(itineraryBCells);
    expect([...itineraryACells].every((cell) => !commonCells.has(cell))).toBe(
      true
    );
  });
});
