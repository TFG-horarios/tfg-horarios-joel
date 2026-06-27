import { describe, expect, test, mock, spyOn } from 'bun:test';
import { TabuSearchEngine } from './tabu-search';
import { PenaltyCalculator } from '../domain/penalty-calculator';
import { InitialSolution } from '../domain/initial-solution';
import type { IRandomGenerator } from '../domain/random-generator';
import type { Solution } from '../domain/types';
import { CourseOverlapConstraint } from '../domain/constraints/hard/course-overlap.constraint';
import { buildScheduleTimeGrid } from '@tfg-horarios/shared';

describe('TabuSearchEngine', () => {
  const timeGrids = {
    'tc-1': buildScheduleTimeGrid(
      { slotDurationMinutes: 60, breakDurationMinutes: 0 },
      {
        startTime: '08:00',
        endTime: '14:00',
        hasBreak: false,
        breakAfterSlot: null,
      }
    ),
  };
  const penaltyCalculator = new PenaltyCalculator([], [], {}, {});
  const initialGen = new InitialSolution(
    penaltyCalculator,
    [],
    {},
    timeGrids,
    undefined,
    1
  );

  const evaluateHardSpy = spyOn(
    penaltyCalculator,
    'evaluateHard'
  ).mockReturnValue({
    hardPenalty: 0,
    conflicts: [],
  });

  const evaluateSpy = spyOn(penaltyCalculator, 'evaluate').mockReturnValue({
    hardPenalty: 0,
    softPenalty: 0,
    totalPenalty: 0,
    conflicts: [],
  });

  const generateSpy = spyOn(initialGen, 'generate').mockImplementation(() => ({
    assignments: [],
    unassigned: 0,
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
    {},
    randomGen
  );

  test('returns initial solution if penalty is 0', () => {
    const sol: Solution = {
      assignments: [],
      unassigned: 0,
      penalty: 0,
      hardPenalty: 0,
      conflicts: [],
    };
    generateSpy.mockReturnValueOnce(sol);
    const result = engine.run([]);
    expect(result).toBe(sol);
  });

  test('runs iterations and improves solution in hard phase', () => {
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
          needsComputerLab: false,
          degreeId: 'deg-1',
          courseYear: 1,
          groupType: 'theory',
          duration: 1,
          timeConfigId: 'tc-1',
        },
      ],
      unassigned: 0,
      penalty: 100,
      hardPenalty: 100,
      conflicts: [],
    };
    generateSpy.mockReturnValueOnce(initialSol);
    evaluateHardSpy.mockReturnValue({
      hardPenalty: 50,
      conflicts: [],
    });
    const result = engine.run([]);
    expect(result.hardPenalty).toBe(50);
  });

  test('repairs common course overlaps before tabu iterations', () => {
    const calculator = new PenaltyCalculator(
      [new CourseOverlapConstraint()],
      [],
      {},
      timeGrids
    );
    const initialSolutionGen = new InitialSolution(
      calculator,
      ['c-1'],
      {},
      timeGrids,
      undefined,
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
          needsComputerLab: false,
          degreeId: 'deg-1',
          courseYear: 1,
          groupType: 'theory',
          duration: 1,
          timeConfigId: 'tc-1',
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
          needsComputerLab: false,
          degreeId: 'deg-1',
          courseYear: 1,
          groupType: 'theory',
          duration: 1,
          timeConfigId: 'tc-1',
        },
      ],
      unassigned: 0,
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
      {
        'c-1': {
          capacity: 40,
          type: 'theory',
          floor: 0,
        },
      },
      timeGrids,
      randomGen
    );

    const result = repairEngine.run([]);
    const commonAssignment = result.assignments.find(
      (assignment) => assignment.id === 'common-1'
    );

    expect(result.hardPenalty).toBe(0);
    expect(commonAssignment?.slotIndex).not.toBe(0);
  });

  test('tries to place assignments left unassigned by the greedy solution', () => {
    const calculator = new PenaltyCalculator(
      [],
      [],
      {
        'c-1': { capacity: 40, type: 'theory', floor: 0 },
      },
      timeGrids
    );
    const generator = new InitialSolution(
      calculator,
      ['c-1'],
      { 'c-1': { capacity: 40, type: 'theory', floor: 0 } },
      timeGrids,
      undefined,
      60
    );
    spyOn(generator, 'generate').mockReturnValueOnce({
      assignments: [
        {
          id: 'a-1',
          subjectGroupId: 'sg-1',
          subjectId: 's-1',
          shift: 'morning',
          groupType: 'theory',
          isCommon: true,
          itineraryName: null,
          numberOfStudents: 20,
          needsComputerLab: false,
          degreeId: 'deg-1',
          courseYear: 1,
          classroomId: null,
          dayOfWeek: null,
          slotIndex: null,
          duration: 1,
          timeConfigId: 'tc-1',
        },
      ],
      unassigned: 1,
      penalty: 0,
      hardPenalty: 0,
      conflicts: [],
    });
    const repairEngine = new TabuSearchEngine(
      calculator,
      generator,
      ['c-1'],
      { 'c-1': { capacity: 40, type: 'theory', floor: 0 } },
      timeGrids,
      randomGen
    );

    const result = repairEngine.run([]);

    expect(result.unassigned).toBe(0);
    expect(result.assignments[0]?.classroomId).toBe('c-1');
  });

  test('runSoftPhase rejects neighbors with hard conflicts and stops at limit', () => {
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
          needsComputerLab: false,
          degreeId: 'deg-1',
          courseYear: 1,
          groupType: 'theory',
          duration: 1,
          timeConfigId: 'tc-1',
        },
      ],
      unassigned: 0,
      penalty: 0,
      hardPenalty: 0,
      conflicts: [],
    };

    evaluateSpy.mockReturnValueOnce({
      hardPenalty: 0,
      softPenalty: 100,
      totalPenalty: 100,
      conflicts: [],
    });

    evaluateHardSpy.mockReturnValue({
      hardPenalty: 50,
      conflicts: [],
    });

    const result = engine.runSoftPhase(initialSol);

    expect(result.penalty).toBe(100);
    expect(result.hardPenalty).toBe(0);
  });
});
