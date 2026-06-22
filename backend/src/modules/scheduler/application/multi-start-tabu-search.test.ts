import { describe, expect, mock, test } from 'bun:test';
import {
  isBetterSolution,
  runMultiStartTabuSearch,
} from './multi-start-tabu-search';
import type { Solution } from '../domain/types';

const solution = (hardPenalty: number, penalty = hardPenalty): Solution => ({
  assignments: [],
  hardPenalty,
  penalty,
  conflicts: [],
});

describe('multi-start Tabu Search', () => {
  test('retries until it finds a conflict-free solution', () => {
    const runAttempt = mock((seed: number) =>
      seed === 3 ? solution(0) : solution(1000)
    );

    const result = runMultiStartTabuSearch([1, 2, 3, 4], runAttempt);

    expect(result.hardPenalty).toBe(0);
    expect(runAttempt).toHaveBeenCalledTimes(3);
  });

  test('keeps the lowest hard penalty after exhausting all attempts', () => {
    const penalties = new Map([
      [1, solution(3000)],
      [2, solution(1000, 1020)],
      [3, solution(1000, 1010)],
    ]);

    const result = runMultiStartTabuSearch(
      [1, 2, 3],
      (seed) => penalties.get(seed)!
    );

    expect(result).toBe(penalties.get(3)!);
  });

  test('always prioritizes hard constraints over soft penalty', () => {
    expect(isBetterSolution(solution(0, 50), solution(1000, 10))).toBe(true);
  });
});
