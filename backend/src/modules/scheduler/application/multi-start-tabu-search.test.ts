import { describe, expect, mock, test } from 'bun:test';
import {
  isBetterHardSolution,
  isBetterSolution,
  runMultiStartTabuSearch,
} from './multi-start-tabu-search';
import type { Solution } from '../domain/types';
import { TabuSearchEngine } from './tabu-search';

const solution = (
  hardPenalty: number,
  penalty = hardPenalty,
  unassigned = 0
): Solution => ({
  assignments: [],
  unassigned,
  hardPenalty,
  penalty,
  conflicts: [],
});

describe('multi-start Tabu Search Comparators', () => {
  test('isBetterHardSolution prioritizes hardPenalty over unassigned', () => {
    expect(isBetterHardSolution(solution(0, 0, 1), solution(100, 100, 1))).toBe(
      true
    );
    expect(isBetterHardSolution(solution(0, 0, 0), solution(0, 0, 1))).toBe(
      true
    );
  });

  test('isBetterHardSolution ignores soft penalty', () => {
    expect(isBetterHardSolution(solution(10, 10), solution(10, 1000))).toBe(
      false
    );
  });

  test('isBetterSolution uses soft penalty ONLY when unassigned === 0 && hardPenalty === 0', () => {
    expect(isBetterSolution(solution(0, 10, 0), solution(0, 50, 0))).toBe(true);
    expect(isBetterSolution(solution(0, 50, 0), solution(10, 10, 0))).toBe(
      true
    );
    expect(isBetterSolution(solution(10, 10, 0), solution(10, 50, 0))).toBe(
      false
    );
  });
});

describe('runMultiStartTabuSearch Orchestrator', () => {
  test('executes run for all seeds and runs soft phase ONLY on the best if feasible', () => {
    const mockEngine1 = {
      run: () => solution(100),
      runSoftPhase: mock(),
    } as unknown as TabuSearchEngine;
    const mockEngine2 = {
      run: () => solution(0, 50),
      runSoftPhase: mock(() => solution(0, 10)),
    } as unknown as TabuSearchEngine;
    const mockEngine3 = {
      run: () => solution(50),
      runSoftPhase: mock(),
    } as unknown as TabuSearchEngine;

    const buildEngine = mock((seed: number) => {
      if (seed === 1) return mockEngine1;
      if (seed === 2) return mockEngine2;
      return mockEngine3;
    });

    const result = runMultiStartTabuSearch([1, 2, 3], buildEngine, [], [], {
      enableSoftPhase: true,
    });

    expect(buildEngine).toHaveBeenCalledTimes(3);
    expect(mockEngine2.runSoftPhase).toHaveBeenCalledTimes(1);
    expect(mockEngine1.runSoftPhase).toHaveBeenCalledTimes(0);
    expect(mockEngine3.runSoftPhase).toHaveBeenCalledTimes(0);
    expect(result.penalty).toBe(10);
  });

  test('returns best hard solution and skips soft phase if no feasible solution found', () => {
    const mockEngine1 = {
      run: () => solution(100),
      runSoftPhase: mock(),
    } as unknown as TabuSearchEngine;
    const mockEngine2 = {
      run: () => solution(50),
      runSoftPhase: mock(),
    } as unknown as TabuSearchEngine;

    const buildEngine = mock((seed: number) =>
      seed === 1 ? mockEngine1 : mockEngine2
    );

    const result = runMultiStartTabuSearch([1, 2], buildEngine, []);

    expect(mockEngine1.runSoftPhase).toHaveBeenCalledTimes(0);
    expect(mockEngine2.runSoftPhase).toHaveBeenCalledTimes(0);
    expect(result.hardPenalty).toBe(50);
  });

  test('stops after first hard-feasible seed when soft phase is disabled', () => {
    const mockEngine1 = {
      run: mock(() => solution(0)),
      runSoftPhase: mock(),
    } as unknown as TabuSearchEngine;
    const mockEngine2 = {
      run: mock(() => solution(0)),
      runSoftPhase: mock(),
    } as unknown as TabuSearchEngine;

    const buildEngine = mock((seed: number) =>
      seed === 1 ? mockEngine1 : mockEngine2
    );

    const result = runMultiStartTabuSearch([1, 2], buildEngine, [], [], {
      enableSoftPhase: false,
    });

    expect(result.hardPenalty).toBe(0);
    expect(buildEngine).toHaveBeenCalledTimes(1);
    expect(mockEngine1.runSoftPhase).toHaveBeenCalledTimes(0);
    expect(mockEngine2.runSoftPhase).toHaveBeenCalledTimes(0);
  });
});
