import { Solution } from './types';
import { PenaltyCalculator } from './penalty-calculator';
import {
  InitialSolution,
  GroupInitialData,
} from './initial-solution';

interface TabuMove {
  assignmentId: string;
  attribute: 'room' | 'time';
  forbiddenValue: string | number;
  expiresAtIteration: number;
}

export class TabuSearchEngine {
  // TODO: ESTUDIAR BIEN ESTOS VALORES PARA VER SU IMPACTO EN LA CALIDAD DE LAS SOLUCIONES Y EL TIEMPO DE EJECUCIÓN
  // TODO: AÑADIR ESTE ESTUDIO A LA MEMORIA
  private readonly MAX_ITERATIONS = 1000;
  private readonly NEIGHBORHOOD_SIZE = 50;
  private readonly TABU_TENURE = 15;
  // private readonly MAX_ITERATIONS_WITHOUT_IMPROVEMENT = 100;

  constructor(
    private readonly penaltyCalculator: PenaltyCalculator,
    private readonly initialSolutionGen: InitialSolution,
    private readonly availableClassrooms: string[],
    private readonly maxSlotsPerDay: number
  ) {}

  public run(groups: GroupInitialData[]): Solution {
    // 1. Generamos un horario aleatorio como punto de partida
    let currentSolution = this.initialSolutionGen.generate(groups, 1)[0];
    let bestGlobalSolution = currentSolution;

    // Lista Tabú para recordar los movimientos prohibidos
    const tabuList: TabuMove[] = [];

    let i = 0;
    // let iterationsWithoutImprovement = 0;

    // 2. Bucle de búsqueda
    while (i < this.MAX_ITERATIONS && bestGlobalSolution.penalty > 0) {
      this.cleanTabuList(tabuList, i);

      // 3. Generamos lso vecinos (posibles movimientos desde el estado actual)
      let bestNeighbor: Solution | null = null;
      let bestMoveData: TabuMove | null = null;

      // Se generan NEIGHBORHOOD_SIZE vecinos probando mutaciones aleatorias en la solución actual
      for (let j = 0; j < this.NEIGHBORHOOD_SIZE; ++j) {
        // Hacemos una copia de la solución actual
        const neighborAssignments = [...currentSolution.assignments];
        // Elegimos aleatoriamente una asignación
        const targetAssignmentIndex = Math.floor(
          Math.random() * neighborAssignments.length
        );
        const originalAssignment = neighborAssignments[targetAssignmentIndex];

        // Decidimos aleatoriamente si mutamos el aula o la hora. 50% cada opción
        const isTimeMove = Math.random() > 0.5;
        const mutatedAssignment = { ...originalAssignment };
        let tabuAttribute: 'room' | 'time';
        let forbiddenVal: string | number;

        if (isTimeMove) {
          mutatedAssignment.dayOfWeek = Math.floor(Math.random() * 5) + 1;
          mutatedAssignment.startSlot = Math.floor(
            Math.random() * this.maxSlotsPerDay
          );
          tabuAttribute = 'time';
          forbiddenVal = `${originalAssignment.dayOfWeek}-${originalAssignment.startSlot}`;
        } else {
          const classroomIndex = Math.floor(
            Math.random() * this.availableClassrooms.length
          );
          mutatedAssignment.classroomId =
            this.availableClassrooms[classroomIndex];
          tabuAttribute = 'room';
          forbiddenVal = originalAssignment.classroomId;
        }

        // Aplicamos el cambio al vecino y evaluamos
        neighborAssignments[targetAssignmentIndex] = mutatedAssignment;
        const neighborPenalty =
          this.penaltyCalculator.calculatePenalty(neighborAssignments);
        const neighbor: Solution = {
          assignments: neighborAssignments,
          penalty: neighborPenalty,
        };

        // 4. Verificamos si el movimiento es Tabú
        const isTabu = tabuList.some(
          (t) =>
            t.assignmentId === mutatedAssignment.id &&
            t.attribute === tabuAttribute &&
            (isTimeMove
              ? `${mutatedAssignment.dayOfWeek}-${mutatedAssignment.startSlot}` ===
                t.forbiddenValue
              : mutatedAssignment.classroomId === t.forbiddenValue)
        );

        // 5. Si es Tabú pero este movimiento nos da la mejor solución que se ha encontrado lo aplicamos igual
        const isTabuButBestMove =
          isTabu && neighbor.penalty < bestGlobalSolution.penalty;

        if (!isTabu || isTabuButBestMove) {
          if (!bestNeighbor || neighbor.penalty < bestNeighbor.penalty) {
            bestNeighbor = neighbor;
            bestMoveData = {
              assignmentId: mutatedAssignment.id,
              attribute: tabuAttribute,
              forbiddenValue: forbiddenVal,
              expiresAtIteration: i + this.TABU_TENURE,
            };
          }
        }
      }

      // 6. Aplicamos el mejor movimiento encontrado en el vecindario
      if (bestNeighbor && bestMoveData) {
        currentSolution = bestNeighbor;
        tabuList.push(bestMoveData); // Lo anotamos en la memoria

        if (currentSolution.penalty < bestGlobalSolution.penalty) {
          bestGlobalSolution = currentSolution;
          // iterationsWithoutImprovement = 0;
        } /*else {
          ++iterationsWithoutImprovement;
        }*/
      }

      ++i;

      if (i % 50 === 0 || bestGlobalSolution.penalty === 0) {
        console.log(
          `Tabú Iteration ${i} | Best Penalty: ${bestGlobalSolution.penalty} | Tabú List: ${tabuList.length}`
        );
      }

      // TODO. Plantear más adelante si es necesario
      // Si se estanca mucho tiempo sin mejorar, reiniciamos con una nueva solución aleatoria.
      /* if (iterationsWithoutImprovement > this.MAX_ITERATIONS_WITHOUT_IMPROVEMENT) {
        currentSolution = this.initialSolutionGen.generate(groups, 1)[0];
        iterationsWithoutImprovement = 0;
      } */
    }

    console.log(
      `Penalty: ${bestGlobalSolution.penalty} in ${i} iterations.`
    );
    return bestGlobalSolution;
  }

  private cleanTabuList(tabuList: TabuMove[], currentIteration: number) {
    for (let i = tabuList.length - 1; i >= 0; i--) {
      if (tabuList[i].expiresAtIteration <= currentIteration) {
        tabuList.splice(i, 1);
      }
    }
  }
}
