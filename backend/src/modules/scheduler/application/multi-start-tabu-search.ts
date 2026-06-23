import type { Solution, Assignment } from '../domain/types';
import type { TabuSearchEngine } from './tabu-search';
import type { GroupInitialData } from '../domain/initial-solution';

export const MAX_GENERATION_ATTEMPTS = 5;

export const buildSeeds = (
  attempts: number = MAX_GENERATION_ATTEMPTS
): number[] => {
  return Array.from({ length: attempts }, () =>
    Math.floor(Math.random() * 4294967296)
  );
};

export const isBetterHardSolution = (
  candidate: Solution,
  reference: Solution
): boolean => {
  if (candidate.hardPenalty !== reference.hardPenalty) {
    return candidate.hardPenalty < reference.hardPenalty;
  }
  return candidate.unassigned < reference.unassigned;
};

export const isBetterSolution = (
  candidate: Solution,
  reference: Solution
): boolean => {
  if (candidate.hardPenalty !== reference.hardPenalty) {
    return candidate.hardPenalty < reference.hardPenalty;
  }
  if (candidate.unassigned !== reference.unassigned) {
    return candidate.unassigned < reference.unassigned;
  }
  
  if (candidate.unassigned === 0 && candidate.hardPenalty === 0) {
    return candidate.penalty < reference.penalty;
  }
  
  return false;
};

export const runMultiStartTabuSearch = (
  seeds: number[],
  buildEngine: (seed: number) => TabuSearchEngine,
  groups: GroupInitialData[],
  lockedAssignments: Assignment[] = []
): Solution => {
  if (seeds.length === 0) {
    throw new Error('At least one Tabu Search seed is required.');
  }

  let bestSolution: Solution | null = null;
  let bestEngine: TabuSearchEngine | null = null;

  for (const seed of seeds) {
    const engine = buildEngine(seed);
    const candidate = engine.run(groups, lockedAssignments);
    if (!bestSolution || isBetterHardSolution(candidate, bestSolution)) {
      bestSolution = candidate;
      bestEngine = engine;
    }
  }

  if (bestSolution!.unassigned === 0 && bestSolution!.hardPenalty === 0) {
    return bestEngine!.runSoftPhase(bestSolution!, lockedAssignments);
  }

  return bestSolution!;
};
