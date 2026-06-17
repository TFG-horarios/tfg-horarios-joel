import { describe, expect, test, mock, spyOn } from 'bun:test';
import { TabuSearchEngine } from './tabu-search';
import { PenaltyCalculator } from '../domain/penalty-calculator';
import { InitialSolution } from '../domain/initial-solution';
import type { IRandomGenerator } from '../domain/random-generator';
import type { Solution } from '../domain/types';

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
});
