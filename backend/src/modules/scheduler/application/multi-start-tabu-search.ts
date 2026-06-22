import type { Solution } from '../domain/types';

export const MAX_GENERATION_ATTEMPTS = 5;

export const buildSeeds = (
  attempts: number = MAX_GENERATION_ATTEMPTS
): number[] => {
  return Array.from({ length: attempts }, () =>
    Math.floor(Math.random() * 4294967296)
  );
};

export const isBetterSolution = (
  candidate: Solution,
  reference: Solution
): boolean =>
  candidate.hardPenalty < reference.hardPenalty ||
  (candidate.hardPenalty === reference.hardPenalty &&
    candidate.penalty < reference.penalty);

export const runMultiStartTabuSearch = (
  seeds: number[],
  runAttempt: (seed: number) => Solution
): Solution => {
  if (seeds.length === 0) {
    throw new Error('At least one Tabu Search seed is required.');
  }

  let bestSolution: Solution | null = null;

  for (const seed of seeds) {
    const candidate = runAttempt(seed);
    if (!bestSolution || isBetterSolution(candidate, bestSolution)) {
      bestSolution = candidate;
    }
    if (bestSolution.hardPenalty === 0) {
      return bestSolution;
    }
  }

  return bestSolution!;
};
