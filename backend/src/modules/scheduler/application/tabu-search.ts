import {
  type Solution,
  type ClassroomMap,
  type Assignment,
} from '../domain/types';
import { PenaltyCalculator } from '../domain/penalty-calculator';
import {
  InitialSolution,
  type GroupInitialData,
} from '../domain/initial-solution';
import type { IRandomGenerator } from '../domain/random-generator';
import { isBetterSolution, isBetterHardSolution } from './multi-start-tabu-search';

interface TabuMove {
  assignmentId: string;
  attribute: 'room' | 'time' | 'both';
  forbiddenValue: string | number;
  expiresAtIteration: number;
}

type MoveAttribute = TabuMove['attribute'];

export class TabuSearchEngine {
  private readonly MAX_ITERATIONS = 1000;
  private readonly NEIGHBORHOOD_SIZE = 60;
  private readonly TABU_TENURE = 20;
  private readonly MAX_STAGNANT_ITERATIONS = 200;
  private readonly MAX_INITIAL_REPAIR_PASSES = 12;
  private readonly MAX_REPAIR_TARGETS_PER_PASS = 8;
  private readonly MAX_REPAIR_CLASSROOMS = 8;

  constructor(
    private readonly penaltyCalculator: PenaltyCalculator,
    private readonly initialSolutionGen: InitialSolution,
    private readonly availableClassrooms: string[],
    private readonly classroomsCache: ClassroomMap,
    private readonly maxMorningSlots: number,
    private readonly maxSlotsPerDay: number,
    private readonly random: IRandomGenerator
  ) {}

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

    const tabuList: TabuMove[] = [];
    let i = 0;
    let stagnantIterations = 0;

    while (
      i < this.MAX_ITERATIONS &&
      stagnantIterations < this.MAX_STAGNANT_ITERATIONS &&
      (bestGlobalSolution.unassigned > 0 || bestGlobalSolution.hardPenalty > 0) &&
      currentSolution.assignments.length > 0
    ) {
      this.cleanTabuList(tabuList, i);

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

        const moveAttribute = this.pickMoveAttribute(original, currentSolution);
        const mutated = { ...original };
        let tabuAttribute = moveAttribute;
        let forbiddenVal: string | number = '';

        if (moveAttribute === 'time' || moveAttribute === 'both') {
          mutated.dayOfWeek = this.random.randomInt(5) + 1;

          const spannedSlots = Math.ceil(original.duration) - 1;

          if (original.shift === 'morning') {
            mutated.slotIndex = this.random.randomInt(
              this.maxMorningSlots - spannedSlots
            );
          } else if (original.shift === 'afternoon') {
            mutated.slotIndex =
              this.maxMorningSlots +
              this.random.randomInt(
                this.maxSlotsPerDay - this.maxMorningSlots - spannedSlots
              );
          } else {
            mutated.slotIndex = this.random.randomInt(
              this.maxSlotsPerDay - spannedSlots
            );
          }

          if (moveAttribute === 'time') {
            tabuAttribute = 'time';
            forbiddenVal = `${original.dayOfWeek}-${original.slotIndex}`;
          }
        }

        if (moveAttribute === 'room' || moveAttribute === 'both') {
          const classroomsToSearch = this.getClassroomsForAssignment(original);

          if (classroomsToSearch.length === 0) continue;

          const classroomIndex = this.random.randomInt(
            classroomsToSearch.length
          );
          mutated.classroomId = classroomsToSearch[classroomIndex]!;

          if (moveAttribute === 'room') {
            tabuAttribute = 'room';
            forbiddenVal = original.classroomId ?? '';
          }
        }

        if (moveAttribute === 'both') {
          tabuAttribute = 'both';
          forbiddenVal = `${original.dayOfWeek}-${original.slotIndex}-${original.classroomId}`;
        }

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

        const isTabu = tabuList.some((t) => {
          if (t.assignmentId !== mutated.id) return false;
          if (t.attribute === 'time' && tabuAttribute === 'time') {
            return (
              `${mutated.dayOfWeek}-${mutated.slotIndex}` === t.forbiddenValue
            );
          }
          if (t.attribute === 'room' && tabuAttribute === 'room') {
            return mutated.classroomId === t.forbiddenValue;
          }
          if (t.attribute === 'both' && tabuAttribute === 'both') {
            return (
              `${mutated.dayOfWeek}-${mutated.slotIndex}-${mutated.classroomId}` ===
              t.forbiddenValue
            );
          }
          return false;
        });

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
              assignmentId: mutated.id,
              attribute: tabuAttribute,
              forbiddenValue: forbiddenVal,
              expiresAtIteration: i + this.TABU_TENURE,
            };
          }
        }

        currentSolution.assignments[targetIndex] = original;
      }

      if (bestNeighbor && bestMoveData) {
        currentSolution = bestNeighbor;
        tabuList.push(bestMoveData);

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

    if (bestGlobalSolution.unassigned > 0 || bestGlobalSolution.hardPenalty > 0) {
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
    let currentSolution = { ...solution };
    
    const initialPenalties = this.penaltyCalculator.evaluate(
      currentSolution.assignments,
      lockedAssignments
    );
    currentSolution.penalty = initialPenalties.totalPenalty;
    currentSolution.hardPenalty = initialPenalties.hardPenalty;
    currentSolution.conflicts = initialPenalties.conflicts;
    
    let bestGlobalSolution = currentSolution;

    const MAX_SOFT_ITERATIONS = 200;
    const MAX_SOFT_STAGNANT = 50;

    const tabuList: TabuMove[] = [];
    let i = 0;
    let stagnantIterations = 0;

    while (
      i < MAX_SOFT_ITERATIONS &&
      stagnantIterations < MAX_SOFT_STAGNANT
    ) {
      this.cleanTabuList(tabuList, i);

      let bestNeighbor: Solution | null = null;
      let bestMoveData: TabuMove | null = null;

      for (let j = 0; j < this.NEIGHBORHOOD_SIZE; ++j) {
        const targetIndex = this.random.randomInt(currentSolution.assignments.length);
        const original = currentSolution.assignments[targetIndex]!;

        if (original.dayOfWeek === null || original.slotIndex === null)
          continue;

        const moveType = this.random.random();
        let moveAttribute: MoveAttribute = 'both';
        if (moveType < 0.33) moveAttribute = 'time';
        else if (moveType < 0.66) moveAttribute = 'room';

        const mutated = { ...original };
        let tabuAttribute = moveAttribute;
        let forbiddenVal: string | number = '';

        if (moveAttribute === 'time' || moveAttribute === 'both') {
          mutated.dayOfWeek = this.random.randomInt(5) + 1;
          const spannedSlots = Math.ceil(original.duration) - 1;

          if (original.shift === 'morning') {
            mutated.slotIndex = this.random.randomInt(this.maxMorningSlots - spannedSlots);
          } else if (original.shift === 'afternoon') {
            mutated.slotIndex = this.maxMorningSlots + this.random.randomInt(this.maxSlotsPerDay - this.maxMorningSlots - spannedSlots);
          } else {
            mutated.slotIndex = this.random.randomInt(this.maxSlotsPerDay - spannedSlots);
          }

          if (moveAttribute === 'time') {
            tabuAttribute = 'time';
            forbiddenVal = `${original.dayOfWeek}-${original.slotIndex}`;
          }
        }

        if (moveAttribute === 'room' || moveAttribute === 'both') {
          const classroomsToSearch = this.getClassroomsForAssignment(original);

          if (classroomsToSearch.length === 0) continue;

          const classroomIndex = this.random.randomInt(classroomsToSearch.length);
          mutated.classroomId = classroomsToSearch[classroomIndex]!;

          if (moveAttribute === 'room') {
            tabuAttribute = 'room';
            forbiddenVal = original.classroomId ?? '';
          }
        }

        if (moveAttribute === 'both') {
          tabuAttribute = 'both';
          forbiddenVal = `${original.dayOfWeek}-${original.slotIndex}-${original.classroomId}`;
        }

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

        const isTabu = tabuList.some((t) => {
          if (t.assignmentId !== mutated.id) return false;
          if (t.attribute === 'time' && tabuAttribute === 'time') return `${mutated.dayOfWeek}-${mutated.slotIndex}` === t.forbiddenValue;
          if (t.attribute === 'room' && tabuAttribute === 'room') return mutated.classroomId === t.forbiddenValue;
          if (t.attribute === 'both' && tabuAttribute === 'both') return `${mutated.dayOfWeek}-${mutated.slotIndex}-${mutated.classroomId}` === t.forbiddenValue;
          return false;
        });

        const isTabuButBestMove = isTabu && isBetterSolution(neighbor, bestGlobalSolution);

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
              assignmentId: mutated.id,
              attribute: tabuAttribute,
              forbiddenValue: forbiddenVal,
              expiresAtIteration: i + this.TABU_TENURE,
            };
          }
        }

        currentSolution.assignments[targetIndex] = original;
      }

      if (bestNeighbor && bestMoveData) {
        currentSolution = bestNeighbor;
        tabuList.push(bestMoveData);

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

  private cleanTabuList(tabuList: TabuMove[], currentIteration: number) {
    for (let i = tabuList.length - 1; i >= 0; i--) {
      if (tabuList[i]!.expiresAtIteration <= currentIteration) {
        tabuList.splice(i, 1);
      }
    }
  }

  private getConflictAssignmentIds(solution: Solution): Set<string> {
    const ids = new Set<string>();
    const assignmentIdsByGroup = new Map(
      solution.assignments.map((assignment) => [
        assignment.subjectGroupId,
        assignment.id,
      ])
    );

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

      const assignmentId = assignmentIdsByGroup.get(conflict.subjectGroupId);
      if (assignmentId) {
        ids.add(assignmentId);
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

    const spannedSlots = Math.ceil(original.duration);
    const startLimit = original.shift === 'morning' ? 0 : this.maxMorningSlots;
    const endLimit =
      original.shift === 'morning' ? this.maxMorningSlots : this.maxSlotsPerDay;

    let bestSolution: Solution | null = null;

    for (const classroomId of classroomsToSearch) {
      for (let dayOfWeek = 1; dayOfWeek <= 5; dayOfWeek++) {
        for (
          let slotIndex = startLimit;
          slotIndex <= endLimit - spannedSlots;
          slotIndex++
        ) {
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
    }

    return bestSolution;
  }

  private getClassroomsForAssignment(assignment: Assignment): string[] {
    const requiredType = assignment.needsComputerLab
      ? 'computer_lab'
      : ['practices', 'reduced_practices', 'tutoring'].includes(
            assignment.groupType
          )
        ? 'lab'
        : 'theory';
    const compatibleClassrooms = this.availableClassrooms.filter(
      (id) => this.classroomsCache[id]?.type === requiredType
    );
    let classroomsToSearch = assignment.needsComputerLab
      ? compatibleClassrooms
      : compatibleClassrooms.length > 0
        ? compatibleClassrooms
        : this.availableClassrooms;

    if (
      !assignment.needsComputerLab &&
      ['practices', 'reduced_practices', 'tutoring'].includes(
        assignment.groupType
      )
    ) {
      const theoryRooms = this.availableClassrooms.filter(
        (id) => this.classroomsCache[id]?.type === 'theory'
      );
      classroomsToSearch = Array.from(
        new Set([...classroomsToSearch, ...theoryRooms])
      );
    } else if (!assignment.needsComputerLab) {
      const labRooms = this.availableClassrooms.filter(
        (id) => this.classroomsCache[id]?.type === 'lab'
      );
      classroomsToSearch = Array.from(
        new Set([...classroomsToSearch, ...labRooms])
      );
    }

    return classroomsToSearch;
  }
}
