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
  attribute: 'room' | 'time';
  forbiddenValue: string | number;
  expiresAtIteration: number;
}

export class TabuSearchEngine {
  // TODO: Buscar la mejor combinación de hiperparámetros
  private readonly MAX_ITERATIONS = 2000;
  private readonly NEIGHBORHOOD_SIZE = 50;
  private readonly TABU_TENURE = 15;

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

    const tabuList: TabuMove[] = [];
    let i = 0;

    while (i < this.MAX_ITERATIONS && bestGlobalSolution.penalty > 0) {
      this.cleanTabuList(tabuList, i);

      let bestNeighbor: Solution | null = null;
      let bestMoveData: TabuMove | null = null;

      for (let j = 0; j < this.NEIGHBORHOOD_SIZE; ++j) {
        const targetIndex = this.random.randomInt(
          currentSolution.assignments.length
        );
        const original = currentSolution.assignments[targetIndex]!;

        if (original.dayOfWeek === null || original.slotIndex === null)
          continue;

        const isTimeMove = this.random.random() > 0.5;
        const mutated = { ...original };
        let tabuAttribute: 'room' | 'time';
        let forbiddenVal: string | number;

        if (isTimeMove) {
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

          tabuAttribute = 'time';
          forbiddenVal = `${original.dayOfWeek}-${original.slotIndex}`;
        } else {
          const requiredType =
            original.groupType === 'practices' ? 'lab' : 'theory';
          const compatibleClassrooms = this.availableClassrooms.filter(
            (id) => this.classroomsCache[id]?.type === requiredType
          );
          const classroomsToSearch =
            compatibleClassrooms.length > 0
              ? compatibleClassrooms
              : this.availableClassrooms;

          const classroomIndex = this.random.randomInt(
            classroomsToSearch.length
          );
          mutated.classroomId = classroomsToSearch[classroomIndex]!;
          tabuAttribute = 'room';
          forbiddenVal = original.classroomId ?? '';
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
          (t) =>
            t.assignmentId === mutated.id &&
            t.attribute === tabuAttribute &&
            (isTimeMove
              ? `${mutated.dayOfWeek}-${mutated.slotIndex}` === t.forbiddenValue
              : mutated.classroomId === t.forbiddenValue)
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
}
