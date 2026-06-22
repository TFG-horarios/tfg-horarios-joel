import { describe, expect, test, mock, spyOn } from 'bun:test';
import { TabuSearchEngine } from './tabu-search';
import { PenaltyCalculator } from '../domain/penalty-calculator';
import { InitialSolution } from '../domain/initial-solution';
import type { IRandomGenerator } from '../domain/random-generator';
import type { Solution } from '../domain/types';
import { CourseOverlapConstraint } from '../domain/constraints/hard/course-overlap.constraint';

describe('TabuSearchEngine', () => {
  const penaltyCalculator = new PenaltyCalculator([], [], {}, 12, 12);
  const initialGen = new InitialSolution(penaltyCalculator, [], {}, 12, 12, 1);

  const evaluateSpy = spyOn(penaltyCalculator, 'evaluate').mockReturnValue({
    hardPenalty: 0,
    softPenalty: 0,
    totalPenalty: 0,
    conflicts: [],
  });

  const generateSpy = spyOn(initialGen, 'generate').mockImplementation(() => ({
    assignments: [],
    penalty: 0,
    hardPenalty: 0,
    conflicts: [],
  }));

  const randomGen: IRandomGenerator = {
    random: mock(() => 0.6),
    randomInt: mock(() => 0),
  };

  const engine = new TabuSearchEngine(
    penaltyCalculator,
    initialGen,
    ['c-1'],
    {},
    6,
    12,
    randomGen
  );

  test('returns initial solution if penalty is 0', () => {
    const sol: Solution = {
      assignments: [],
      penalty: 0,
      hardPenalty: 0,
      conflicts: [],
    };
    generateSpy.mockReturnValueOnce(sol);
    const result = engine.run([]);
    expect(result).toBe(sol);
  });

  test('runs iterations and improves solution', () => {
    const initialSol: Solution = {
      assignments: [
        {
          id: 'a-1',
          classroomId: 'c-1',
          dayOfWeek: 1,
          slotIndex: 1,
          subjectGroupId: 'sg-1',
          subjectId: 's-1',
          shift: 'morning',
          isCommon: false,
          itineraryName: null,
          numberOfStudents: 30,
          degreeId: 'deg-1',
          courseYear: 1,
          groupType: 'theory',
          duration: 1,
        },
      ],
      penalty: 100,
      hardPenalty: 100,
      conflicts: [],
    };
    generateSpy.mockReturnValueOnce(initialSol);
    evaluateSpy.mockReturnValue({
      hardPenalty: 50,
      softPenalty: 0,
      totalPenalty: 50,
      conflicts: [],
    });
    const result = engine.run([]);
    expect(result.penalty).toBe(50);
  });

  test('repairs common course overlaps before tabu iterations', () => {
    const calculator = new PenaltyCalculator(
      [new CourseOverlapConstraint()],
      [],
      {},
      3,
      6
    );
    const initialSolutionGen = new InitialSolution(
      calculator,
      ['c-1'],
      {},
      6,
      3,
      60
    );
    const initialSolution: Solution = {
      assignments: [
        {
          id: 'common-1',
          classroomId: 'c-1',
          dayOfWeek: 1,
          slotIndex: 0,
          subjectGroupId: 'sg-common',
          subjectId: 'sub-common',
          shift: 'morning',
          isCommon: true,
          itineraryName: null,
          numberOfStudents: 30,
          degreeId: 'deg-1',
          courseYear: 1,
          groupType: 'theory',
          duration: 1,
        },
        {
          id: 'itinerary-1',
          classroomId: 'c-1',
          dayOfWeek: 1,
          slotIndex: 0,
          subjectGroupId: 'sg-itinerary',
          subjectId: 'sub-itinerary',
          shift: 'morning',
          isCommon: false,
          itineraryName: 'Itinerary A',
          numberOfStudents: 30,
          degreeId: 'deg-1',
          courseYear: 1,
          groupType: 'theory',
          duration: 1,
        },
      ],
      penalty: 2000,
      hardPenalty: 2000,
      conflicts: [
        {
          type: 'COURSE_OVERLAP_COMMON_ITINERARY',
          subjectGroupId: 'sg-common',
          assignmentId: 'common-1',
          relatedSubjectGroupIds: ['sg-itinerary'],
        },
      ],
    };
    spyOn(initialSolutionGen, 'generate').mockReturnValueOnce(initialSolution);

    const repairEngine = new TabuSearchEngine(
      calculator,
      initialSolutionGen,
      ['c-1'],
      {},
      3,
      6,
      randomGen
    );

    const result = repairEngine.run([]);
    const commonAssignment = result.assignments.find(
      (assignment) => assignment.id === 'common-1'
    );

    expect(result.penalty).toBe(0);
    expect(commonAssignment?.slotIndex).not.toBe(0);
  });
});
