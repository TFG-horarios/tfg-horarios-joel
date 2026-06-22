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

interface TabuMove {
  assignmentId: string;
  attribute: 'room' | 'time' | 'both';
  forbiddenValue: string | number;
  expiresAtIteration: number;
}

type MoveAttribute = TabuMove['attribute'];

export class TabuSearchEngine {
  // TODO: Buscar la mejor combinación de hiperparámetros
  private readonly MAX_ITERATIONS = 5000;
  private readonly NEIGHBORHOOD_SIZE = 150;
  private readonly TABU_TENURE = 20;

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
    if (currentSolution.penalty < bestGlobalSolution.penalty) {
      bestGlobalSolution = currentSolution;
    }

    const tabuList: TabuMove[] = [];
    let i = 0;

    while (
      i < this.MAX_ITERATIONS &&
      bestGlobalSolution.penalty > 0 &&
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

        const moveAttribute = this.pickMoveAttribute(
          original,
          currentSolution
        );
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
          const requiredType =
            ['practices', 'reduced_practices', 'tutoring'].includes(original.groupType) ? 'lab' : 'theory';
          const compatibleClassrooms = this.availableClassrooms.filter(
            (id) => this.classroomsCache[id]?.type === requiredType
          );
          let classroomsToSearch =
            compatibleClassrooms.length > 0
              ? compatibleClassrooms
              : this.availableClassrooms;

          if (['practices', 'reduced_practices', 'tutoring'].includes(original.groupType)) {
            const theoryRooms = this.availableClassrooms.filter(
              (id) => this.classroomsCache[id]?.type === 'theory'
            );
            classroomsToSearch = Array.from(
              new Set([...classroomsToSearch, ...theoryRooms])
            );
          } else {
            const labRooms = this.availableClassrooms.filter(
              (id) => this.classroomsCache[id]?.type === 'lab'
            );
            classroomsToSearch = Array.from(
              new Set([...classroomsToSearch, ...labRooms])
            );
          }

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

        const penalties = this.penaltyCalculator.evaluate(
          currentSolution.assignments,
          lockedAssignments
        );

        const neighbor: Solution = {
          assignments: currentSolution.assignments,
          penalty: penalties.totalPenalty,
          hardPenalty: penalties.hardPenalty,
          conflicts: penalties.conflicts,
        };

        const isTabu = tabuList.some(
          (t) => {
            if (t.assignmentId !== mutated.id) return false;
            if (t.attribute === 'time' && tabuAttribute === 'time') {
              return `${mutated.dayOfWeek}-${mutated.slotIndex}` === t.forbiddenValue;
            }
            if (t.attribute === 'room' && tabuAttribute === 'room') {
              return mutated.classroomId === t.forbiddenValue;
            }
            if (t.attribute === 'both' && tabuAttribute === 'both') {
              return `${mutated.dayOfWeek}-${mutated.slotIndex}-${mutated.classroomId}` === t.forbiddenValue;
            }
            return false;
          }
        );

        const isTabuButBestMove =
          isTabu && neighbor.penalty < bestGlobalSolution.penalty;

        if (!isTabu || isTabuButBestMove) {
          if (!bestNeighbor || neighbor.penalty < bestNeighbor.penalty) {
            bestNeighbor = {
              assignments: [...currentSolution.assignments],
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

        if (currentSolution.penalty < bestGlobalSolution.penalty) {
          bestGlobalSolution = currentSolution;
        }
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
      return conflictingIndexes[this.random.randomInt(conflictingIndexes.length)]!;
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
          conflict.type === 'ROOM_OVERLAP' ||
          conflict.type === 'ROOM_CAPACITY'
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

    for (
      let pass = 0;
      pass < current.assignments.length && current.penalty > 0;
      pass++
    ) {
      const conflictAssignmentIds = this.getConflictAssignmentIds(current);
      const targetIndexes = current.assignments
        .map((assignment, index) =>
          conflictAssignmentIds.has(assignment.id) ? index : null
        )
        .filter((index): index is number => index !== null)
        .sort((a, b) => {
          const assignmentA = current.assignments[a]!;
          const assignmentB = current.assignments[b]!;
          if (assignmentA.isCommon !== assignmentB.isCommon) {
            return assignmentA.isCommon ? -1 : 1;
          }
          return 0;
        });

      let bestCandidate: Solution | null = null;

      for (const targetIndex of targetIndexes) {
        const candidate = this.findBestRelocation(
          current,
          targetIndex,
          lockedAssignments
        );

        if (
          candidate &&
          candidate.penalty < current.penalty &&
          (!bestCandidate || candidate.penalty < bestCandidate.penalty)
        ) {
          bestCandidate = candidate;
        }
      }

      if (!bestCandidate) break;
      current = bestCandidate;
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

    const classroomsToSearch = this.getClassroomsForAssignment(original);
    if (classroomsToSearch.length === 0) return null;

    const spannedSlots = Math.ceil(original.duration);
    const startLimit =
      original.shift === 'morning' ? 0 : this.maxMorningSlots;
    const endLimit =
      original.shift === 'morning'
        ? this.maxMorningSlots
        : this.maxSlotsPerDay;

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

          const penalties = this.penaltyCalculator.evaluate(
            assignments,
            lockedAssignments
          );

          if (!bestSolution || penalties.totalPenalty < bestSolution.penalty) {
            bestSolution = {
              assignments,
              penalty: penalties.totalPenalty,
              hardPenalty: penalties.hardPenalty,
              conflicts: penalties.conflicts,
            };
          }
        }
      }
    }

    return bestSolution;
  }

  private getClassroomsForAssignment(assignment: Assignment): string[] {
    const requiredType =
      ['practices', 'reduced_practices', 'tutoring'].includes(
        assignment.groupType
      )
        ? 'lab'
        : 'theory';
    const compatibleClassrooms = this.availableClassrooms.filter(
      (id) => this.classroomsCache[id]?.type === requiredType
    );
    let classroomsToSearch =
      compatibleClassrooms.length > 0
        ? compatibleClassrooms
        : this.availableClassrooms;

    if (
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
    } else {
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
