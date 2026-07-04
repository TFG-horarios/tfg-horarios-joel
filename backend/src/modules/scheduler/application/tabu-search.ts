import {
  type Solution,
  type ClassroomMap,
  type Assignment,
  type ScheduleTimeGridMap,
} from '../domain/types';
import {
  type ScheduleTimeGrid,
} from '@tfg-horarios/shared';
import { PenaltyCalculator } from '../domain/penalty-calculator';
import {
  InitialSolution,
  type GroupInitialData,
} from '../domain/initial-solution';
import type { IRandomGenerator } from '../domain/random-generator';
import {
  isBetterSolution,
  isBetterHardSolution,
} from './multi-start-tabu-search';
import { TabuList, type MoveAttribute, type TabuMove } from './tabu-list';
import {
  buildAssignmentTimeCandidates,
  getTabuSearchClassrooms,
} from '../domain/placement-candidates';

type ProposedMove = {
  assignment: Assignment;
  tabu: Omit<TabuMove, 'expiresAtIteration'>;
};

export class TabuSearchEngine {
  private readonly MAX_ITERATIONS = 1000;
  private readonly NEIGHBORHOOD_SIZE = 150;
  private readonly MIN_TABU_TENURE = 15;
  private readonly MAX_TABU_TENURE = 25;
  private readonly MAX_STAGNANT_ITERATIONS = 200;
  private readonly MAX_INITIAL_REPAIR_PASSES = 12;
  private readonly MAX_REPAIR_TARGETS_PER_PASS = 8;
  private readonly MAX_REPAIR_CLASSROOMS = 8;

  private readonly timeGrids: ScheduleTimeGridMap;
  private readonly timeCandidatesCache = new Map<
    string,
    { dayOfWeek: number; slotIndex: number }[]
  >();
  private readonly classroomsForAssignmentCache = new Map<string, string[]>();

  constructor(
    private readonly penaltyCalculator: PenaltyCalculator,
    private readonly initialSolutionGen: InitialSolution,
    private readonly availableClassrooms: string[],
    private readonly classroomsCache: ClassroomMap,
    timeGrids: ScheduleTimeGridMap,
    private readonly random: IRandomGenerator
  ) {
    this.timeGrids = timeGrids;
  }

  public run(
    groups: GroupInitialData[],
    lockedAssignments: Assignment[] = []
  ): Solution {
    let currentSolution = this.initialSolutionGen.generate(
      groups,
      lockedAssignments
    );
    let bestGlobalSolution = currentSolution;

    currentSolution = this.improveConflictedAssignments(
      currentSolution,
      lockedAssignments
    );
    if (isBetterHardSolution(currentSolution, bestGlobalSolution)) {
      bestGlobalSolution = currentSolution;
    }

    const tabuList = new TabuList();
    let i = 0;
    let stagnantIterations = 0;

    while (
      i < this.MAX_ITERATIONS &&
      stagnantIterations < this.MAX_STAGNANT_ITERATIONS &&
      (bestGlobalSolution.unassigned > 0 ||
        bestGlobalSolution.hardPenalty > 0) &&
      currentSolution.assignments.length > 0
    ) {
      tabuList.expire(i);

      let bestNeighbor: Solution | null = null;
      let bestMoveData: TabuMove | null = null;
      const conflictAssignmentIds =
        this.getConflictAssignmentIds(currentSolution);

      for (let j = 0; j < this.NEIGHBORHOOD_SIZE; ++j) {
        const targetIndex = this.pickTargetIndex(
          currentSolution.assignments,
          conflictAssignmentIds
        );
        const original = currentSolution.assignments[targetIndex]!;

        if (original.dayOfWeek === null || original.slotIndex === null)
          continue;

        const proposedMove = this.proposeMove(
          original,
          this.pickMoveAttribute(original, currentSolution)
        );
        if (!proposedMove) continue;
        const mutated = proposedMove.assignment;

        currentSolution.assignments[targetIndex] = mutated;

        const penalties = this.penaltyCalculator.evaluateHard(
          currentSolution.assignments,
          lockedAssignments
        );

        const introducesRoomOverlap = penalties.conflicts.some(
          (conflict) =>
            conflict.type === 'ROOM_OVERLAP' &&
            (conflict.assignmentId === mutated.id ||
              conflict.subjectGroupId === mutated.subjectGroupId)
        );
        if (introducesRoomOverlap) {
          currentSolution.assignments[targetIndex] = original;
          continue;
        }

        const neighbor: Solution = {
          assignments: currentSolution.assignments,
          unassigned: currentSolution.assignments.filter(
            (assignment) =>
              assignment.classroomId === null ||
              assignment.dayOfWeek === null ||
              assignment.slotIndex === null
          ).length,
          penalty: penalties.hardPenalty,
          hardPenalty: penalties.hardPenalty,
          conflicts: penalties.conflicts,
        };

        const isTabu = tabuList.contains(proposedMove.tabu);

        const isTabuButBestMove =
          isTabu && isBetterHardSolution(neighbor, bestGlobalSolution);

        if (!isTabu || isTabuButBestMove) {
          if (!bestNeighbor || isBetterHardSolution(neighbor, bestNeighbor)) {
            bestNeighbor = {
              assignments: [...currentSolution.assignments],
              unassigned: neighbor.unassigned,
              penalty: neighbor.penalty,
              hardPenalty: neighbor.hardPenalty,
              conflicts: neighbor.conflicts,
            };
            bestMoveData = {
              ...proposedMove.tabu,
              expiresAtIteration:
                i +
                this.MIN_TABU_TENURE +
                this.random.randomInt(
                  this.MAX_TABU_TENURE - this.MIN_TABU_TENURE + 1
                ),
            };
          }
        }

        currentSolution.assignments[targetIndex] = original;
      }

      if (bestNeighbor && bestMoveData) {
        currentSolution = bestNeighbor;
        tabuList.add(bestMoveData);

        if (isBetterHardSolution(currentSolution, bestGlobalSolution)) {
          bestGlobalSolution = currentSolution;
          stagnantIterations = 0;
        } else {
          stagnantIterations++;
        }
      } else {
        stagnantIterations++;
      }

      ++i;
    }

    if (
      bestGlobalSolution.unassigned > 0 ||
      bestGlobalSolution.hardPenalty > 0
    ) {
      const repairedSolution = this.improveConflictedAssignments(
        bestGlobalSolution,
        lockedAssignments
      );
      if (isBetterHardSolution(repairedSolution, bestGlobalSolution)) {
        bestGlobalSolution = repairedSolution;
      }
    }

    return bestGlobalSolution;
  }

  public runSoftPhase(
    solution: Solution,
    lockedAssignments: Assignment[] = []
  ): Solution {
    if (!this.penaltyCalculator.hasSoftConstraints()) {
      return solution;
    }

    let currentSolution = { ...solution };

    const initialPenalties = this.penaltyCalculator.evaluate(
      currentSolution.assignments,
      lockedAssignments
    );
    currentSolution.penalty = initialPenalties.totalPenalty;
    currentSolution.hardPenalty = initialPenalties.hardPenalty;
    currentSolution.conflicts = initialPenalties.conflicts;

    let bestGlobalSolution = currentSolution;

    if (currentSolution.hardPenalty === 0 && currentSolution.penalty === 0) {
      return currentSolution;
    }

    const MAX_SOFT_ITERATIONS = 500;
    const MAX_SOFT_STAGNANT = 150;

    const tabuList = new TabuList();
    let i = 0;
    let stagnantIterations = 0;

    while (
      i < MAX_SOFT_ITERATIONS &&
      stagnantIterations < MAX_SOFT_STAGNANT &&
      bestGlobalSolution.penalty > 0
    ) {
      tabuList.expire(i);

      let bestNeighbor: Solution | null = null;
      let bestMoveData: TabuMove | null = null;

      for (let j = 0; j < this.NEIGHBORHOOD_SIZE; ++j) {
        const targetIndex = this.random.randomInt(
          currentSolution.assignments.length
        );
        const original = currentSolution.assignments[targetIndex]!;

        if (original.dayOfWeek === null || original.slotIndex === null)
          continue;

        const proposedMove = this.proposeMove(
          original,
          this.pickRandomMoveAttribute()
        );
        if (!proposedMove) continue;
        const mutated = proposedMove.assignment;

        currentSolution.assignments[targetIndex] = mutated;

        const hardPenalties = this.penaltyCalculator.evaluateHard(
          currentSolution.assignments,
          lockedAssignments
        );

        if (hardPenalties.hardPenalty > 0) {
          currentSolution.assignments[targetIndex] = original;
          continue;
        }

        const softPenalties = this.penaltyCalculator.evaluateSoft(
          currentSolution.assignments,
          lockedAssignments
        );

        const neighbor: Solution = {
          assignments: currentSolution.assignments,
          unassigned: 0,
          penalty: softPenalties.softPenalty,
          hardPenalty: 0,
          conflicts: [],
        };

        const isTabu = tabuList.contains(proposedMove.tabu);

        const isTabuButBestMove =
          isTabu && isBetterSolution(neighbor, bestGlobalSolution);

        if (!isTabu || isTabuButBestMove) {
          if (!bestNeighbor || isBetterSolution(neighbor, bestNeighbor)) {
            bestNeighbor = {
              assignments: [...currentSolution.assignments],
              unassigned: 0,
              penalty: neighbor.penalty,
              hardPenalty: 0,
              conflicts: [],
            };
            bestMoveData = {
              ...proposedMove.tabu,
              expiresAtIteration:
                i +
                this.MIN_TABU_TENURE +
                this.random.randomInt(
                  this.MAX_TABU_TENURE - this.MIN_TABU_TENURE + 1
                ),
            };
          }
        }

        currentSolution.assignments[targetIndex] = original;
      }

      if (bestNeighbor && bestMoveData) {
        currentSolution = bestNeighbor;
        tabuList.add(bestMoveData);

        if (isBetterSolution(currentSolution, bestGlobalSolution)) {
          bestGlobalSolution = currentSolution;
          stagnantIterations = 0;
        } else {
          stagnantIterations++;
        }
      } else {
        stagnantIterations++;
      }

      ++i;
    }

    return bestGlobalSolution;
  }

  private getConflictAssignmentIds(solution: Solution): Set<string> {
    const ids = new Set<string>();
    const assignmentIdsByGroup = new Map<string, string[]>();
    for (const assignment of solution.assignments) {
      const groupAssignments =
        assignmentIdsByGroup.get(assignment.subjectGroupId) ?? [];
      groupAssignments.push(assignment.id);
      assignmentIdsByGroup.set(assignment.subjectGroupId, groupAssignments);
    }

    for (const assignment of solution.assignments) {
      if (
        assignment.classroomId === null ||
        assignment.dayOfWeek === null ||
        assignment.slotIndex === null
      ) {
        ids.add(assignment.id);
      }
    }

    for (const conflict of solution.conflicts ?? []) {
      if (conflict.assignmentId) {
        ids.add(conflict.assignmentId);
      }

      const assignmentIds = assignmentIdsByGroup.get(conflict.subjectGroupId);
      if (assignmentIds) {
        for (const assignmentId of assignmentIds) {
          ids.add(assignmentId);
        }
      }
    }

    return ids;
  }

  private pickTargetIndex(
    assignments: Assignment[],
    conflictAssignmentIds: Set<string>
  ): number {
    const conflictingIndexes = assignments
      .map((assignment, index) =>
        conflictAssignmentIds.has(assignment.id) ? index : null
      )
      .filter((index): index is number => index !== null);

    if (conflictingIndexes.length > 0 && this.random.random() < 0.85) {
      return conflictingIndexes[
        this.random.randomInt(conflictingIndexes.length)
      ]!;
    }

    return this.random.randomInt(assignments.length);
  }

  private pickMoveAttribute(
    assignment: Assignment,
    solution: Solution
  ): MoveAttribute {
    const conflicts = (solution.conflicts ?? []).filter(
      (conflict) =>
        conflict.assignmentId === assignment.id ||
        conflict.subjectGroupId === assignment.subjectGroupId
    );

    if (
      conflicts.some(
        (conflict) =>
          conflict.type.startsWith('COURSE_OVERLAP') ||
          conflict.type === 'SHIFT_MORNING' ||
          conflict.type === 'SHIFT_AFTERNOON' ||
          conflict.type === 'SHIFT_EXCEEDS_DAY'
      )
    ) {
      return this.random.random() < 0.85 ? 'time' : 'both';
    }

    if (
      conflicts.some(
        (conflict) =>
          conflict.type === 'ROOM_OVERLAP' || conflict.type === 'ROOM_CAPACITY'
      )
    ) {
      return this.random.random() < 0.75 ? 'room' : 'both';
    }

    const moveType = this.random.random();
    if (moveType < 0.45) return 'time';
    if (moveType < 0.8) return 'room';
    return 'both';
  }

  private pickRandomMoveAttribute(): MoveAttribute {
    const moveType = this.random.random();
    if (moveType < 0.33) return 'time';
    if (moveType < 0.66) return 'room';
    return 'both';
  }

  private proposeMove(
    original: Assignment,
    moveAttribute: MoveAttribute
  ): ProposedMove | null {
    const mutated = { ...original };
    let tabuAttribute = moveAttribute;
    let forbiddenValue: string | number = '';

    if (moveAttribute === 'time' || moveAttribute === 'both') {
      const candidate = this.pickRandomTime(original);
      if (!candidate) return null;
      mutated.dayOfWeek = candidate.dayOfWeek;
      mutated.slotIndex = candidate.slotIndex;

      if (moveAttribute === 'time') {
        tabuAttribute = 'time';
        forbiddenValue = `${original.dayOfWeek}-${original.slotIndex}`;
      }
    }

    if (moveAttribute === 'room' || moveAttribute === 'both') {
      const classroomsToSearch = this.getClassroomsForAssignment(original);

      if (classroomsToSearch.length === 0) return null;

      const classroomIndex = this.random.randomInt(classroomsToSearch.length);
      mutated.classroomId = classroomsToSearch[classroomIndex]!;

      if (moveAttribute === 'room') {
        tabuAttribute = 'room';
        forbiddenValue = original.classroomId ?? '';
      }
    }

    if (moveAttribute === 'both') {
      tabuAttribute = 'both';
      forbiddenValue = `${original.dayOfWeek}-${original.slotIndex}-${original.classroomId}`;
    }

    return {
      assignment: mutated,
      tabu: {
        assignmentId: mutated.id,
        attribute: tabuAttribute,
        forbiddenValue,
      },
    };
  }

  private improveConflictedAssignments(
    solution: Solution,
    lockedAssignments: Assignment[]
  ): Solution {
    let current: Solution = {
      ...solution,
      assignments: [...solution.assignments],
      conflicts: solution.conflicts ?? [],
    };

    const maxPasses = Math.min(
      current.assignments.length,
      Math.max(this.MAX_INITIAL_REPAIR_PASSES, current.unassigned)
    );

    for (
      let pass = 0;
      pass < maxPasses && (current.unassigned > 0 || current.hardPenalty > 0);
      pass++
    ) {
      const conflictAssignmentIds = this.getConflictAssignmentIds(current);
      const sortedTargetIndexes = current.assignments
        .map((assignment, index) =>
          conflictAssignmentIds.has(assignment.id) ? index : null
        )
        .filter((index): index is number => index !== null)
        .sort((a, b) => {
          const assignmentA = current.assignments[a]!;
          const assignmentB = current.assignments[b]!;
          const aIsUnassigned =
            assignmentA.classroomId === null ||
            assignmentA.dayOfWeek === null ||
            assignmentA.slotIndex === null;
          const bIsUnassigned =
            assignmentB.classroomId === null ||
            assignmentB.dayOfWeek === null ||
            assignmentB.slotIndex === null;
          if (aIsUnassigned !== bIsUnassigned) {
            return aIsUnassigned ? -1 : 1;
          }
          if (assignmentA.isCommon !== assignmentB.isCommon) {
            return assignmentA.isCommon ? -1 : 1;
          }
          return 0;
        });
      const unassignedTargetIndexes = sortedTargetIndexes.filter((index) => {
        const assignment = current.assignments[index]!;
        return (
          assignment.classroomId === null ||
          assignment.dayOfWeek === null ||
          assignment.slotIndex === null
        );
      });
      const assignedTargetIndexes = sortedTargetIndexes
        .filter((index) => !unassignedTargetIndexes.includes(index))
        .slice(0, this.MAX_REPAIR_TARGETS_PER_PASS);
      const targetIndexes = [
        ...unassignedTargetIndexes,
        ...assignedTargetIndexes,
      ];

      let improved = false;

      for (const targetIndex of targetIndexes) {
        const candidate = this.findBestRelocation(
          current,
          targetIndex,
          lockedAssignments
        );

        if (candidate && isBetterHardSolution(candidate, current)) {
          current = candidate;
          improved = true;
          break;
        }
      }

      if (!improved) break;
    }

    return current;
  }

  private findBestRelocation(
    solution: Solution,
    targetIndex: number,
    lockedAssignments: Assignment[]
  ): Solution | null {
    const original = solution.assignments[targetIndex];
    if (!original) return null;

    const allClassrooms = this.getClassroomsForAssignment(original);
    const fittingClassrooms = allClassrooms.filter(
      (classroomId) =>
        (this.classroomsCache[classroomId]?.capacity ?? 0) >=
        original.numberOfStudents
    );
    const isUnassigned =
      original.classroomId === null ||
      original.dayOfWeek === null ||
      original.slotIndex === null;
    const classroomsToSearch = isUnassigned
      ? fittingClassrooms
      : fittingClassrooms.slice(0, this.MAX_REPAIR_CLASSROOMS);
    if (classroomsToSearch.length === 0) return null;

    const timeCandidates = this.getTimeCandidates(original);
    if (timeCandidates.length === 0) return null;

    let bestSolution: Solution | null = null;

    for (const classroomId of classroomsToSearch) {
      for (const { dayOfWeek, slotIndex } of timeCandidates) {
        if (
          original.classroomId === classroomId &&
          original.dayOfWeek === dayOfWeek &&
          original.slotIndex === slotIndex
        ) {
          continue;
        }

        const assignments = [...solution.assignments];
        assignments[targetIndex] = {
          ...original,
          classroomId,
          dayOfWeek,
          slotIndex,
        };

        const penalties = this.penaltyCalculator.evaluateHard(
          assignments,
          lockedAssignments
        );

        const introducesRoomOverlap = penalties.conflicts.some(
          (conflict) =>
            conflict.type === 'ROOM_OVERLAP' &&
            (conflict.assignmentId === original.id ||
              conflict.subjectGroupId === original.subjectGroupId)
        );
        if (introducesRoomOverlap) continue;

        const candidate: Solution = {
          assignments,
          unassigned: assignments.filter(
            (assignment) =>
              assignment.classroomId === null ||
              assignment.dayOfWeek === null ||
              assignment.slotIndex === null
          ).length,
          penalty: penalties.hardPenalty,
          hardPenalty: penalties.hardPenalty,
          conflicts: penalties.conflicts,
        };

        if (!bestSolution || isBetterHardSolution(candidate, bestSolution)) {
          bestSolution = {
            ...candidate,
          };
        }
      }
    }

    return bestSolution;
  }

  private getClassroomsForAssignment(assignment: Assignment): string[] {
    const cacheKey = `${assignment.needsComputerLab}:${assignment.groupType}`;
    const cached = this.classroomsForAssignmentCache.get(cacheKey);
    if (cached) return cached;

    const classroomsToSearch = getTabuSearchClassrooms(
      assignment,
      this.availableClassrooms,
      this.classroomsCache
    );

    this.classroomsForAssignmentCache.set(cacheKey, classroomsToSearch);
    return classroomsToSearch;
  }

  private pickRandomTime(
    assignment: Assignment
  ): { dayOfWeek: number; slotIndex: number } | null {
    const candidates = this.getTimeCandidates(assignment);
    if (candidates.length === 0) return null;
    return candidates[this.random.randomInt(candidates.length)]!;
  }

  private getTimeCandidates(
    assignment: Assignment
  ): { dayOfWeek: number; slotIndex: number }[] {
    const cacheKey = `${assignment.timeConfigId ?? 'none'}:${assignment.duration}`;
    const cached = this.timeCandidatesCache.get(cacheKey);
    if (cached) return cached;

    const grid = this.getGridForAssignment(assignment);
    const candidates = buildAssignmentTimeCandidates(
      assignment,
      grid,
      [1, 2, 3, 4, 5]
    );
    this.timeCandidatesCache.set(cacheKey, candidates);
    return candidates;
  }

  private getGridForAssignment(
    assignment: Assignment
  ): ScheduleTimeGrid | undefined {
    return assignment.timeConfigId
      ? this.timeGrids[assignment.timeConfigId]
      : undefined;
  }
}
