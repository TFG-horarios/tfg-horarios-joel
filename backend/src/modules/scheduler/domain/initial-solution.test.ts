import { describe, expect, test, mock } from 'bun:test';
import { InitialSolution, type GroupInitialData } from './initial-solution';
import { PenaltyCalculator } from './penalty-calculator';

describe('InitialSolution', () => {
  const penaltyCalculator = new PenaltyCalculator([], {}, 12, 12);
  penaltyCalculator.calculatePenalty = mock(() => 0);
  const classroomsCache = {
    'c-1': {
      id: 'c-1',
      name: 'A',
      type: 'theory' as const,
      capacity: 40,
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
    const groups: GroupInitialData[] = [
      {
        subjectGroupId: 'sg-1',
        subjectId: 's-1',
        groupType: 'practices',
        isCommon: false,
        numberOfStudents: 30,
        shift: 'morning',
        weeklyHours: 1,
        degreeId: 'd-1',
        courseYear: 1,
      },
    ];

    const result = initial.generate(groups);
    expect(result.assignments[0]?.classroomId).toBeNull();
  });
});
