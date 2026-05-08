import { type Assignment, type ClassroomMap } from './types';

export class PenaltyCalculator {
  constructor(
    private readonly classroomsCache: ClassroomMap,
    private readonly maxMorningSlots: number
  ) {}

  public calculatePenalty(assignments: Assignment[]): number {
    let penalty = 0;

    const timeSlots = new Map<string, Assignment[]>();

    for (const assignment of assignments) {
      const slotKey = `${assignment.dayOfWeek}-${assignment.startSlot}`;
      if (!timeSlots.has(slotKey)) {
        timeSlots.set(slotKey, []);
      }
      timeSlots.get(slotKey)!.push(assignment);
    }

    for (const [, classesAtThisTime] of timeSlots.entries()) {
      const seenClassrooms = new Set<string>();
      const seenGroups = new Set<string>();

      const commonTheoryIds = new Set<string>();
      const itineraryTheoryIds = new Map<string, Set<string>>();

      for (const assignment of classesAtThisTime) {
        // RESTRICCIÓN DURA 1: el grupo debe estar en el turno que le corresponde
        const isMorningSlot = assignment.startSlot < this.maxMorningSlots;
        if (assignment.shift === 'morning' && !isMorningSlot) penalty += 1000;
        if (assignment.shift === 'afternoon' && isMorningSlot) penalty += 1000;

        // Para RESTRICCIÓN DURA 5
        if (assignment.groupType === 'theory') {
          if (assignment.isCommon) {
            commonTheoryIds.add(assignment.subjectGroupId);
          } else if (assignment.itineraryName) {
            if (!itineraryTheoryIds.has(assignment.itineraryName)) {
              itineraryTheoryIds.set(assignment.itineraryName, new Set());
            }
            itineraryTheoryIds
              .get(assignment.itineraryName)!
              .add(assignment.subjectGroupId);
          }
        }
      }

      for (const assignment of classesAtThisTime) {
        // RESTRICCIÓN DURA 2: la capacidad de un aula no puede ser sobrepasada
        const roomCapacity =
          this.classroomsCache[assignment.classroomId]?.capacity || 0;
        if (assignment.numberOfStudents > roomCapacity) {
          penalty += 1000;
        }

        // RESTRICCIÓN DURA 3: un aula no puede albergar a más de 1 grupo al mismo tiempo
        if (seenClassrooms.has(assignment.classroomId)) {
          penalty += 1000;
        }
        seenClassrooms.add(assignment.classroomId);

        // RESTRICCIÓN DURA 4: un mismo grupo exacto no puede estar en 2 aulas al mismo tiempo
        if (seenGroups.has(assignment.subjectGroupId)) {
          penalty += 1000;
        }
        seenGroups.add(assignment.subjectGroupId);

        // RESTRICCIÓN DURA 5: un mismo grupo de teoría común (no específica de itinerario) no puede coincidir con otro grupo de teoría común,
        // ni con ningún otro grupo de teoría de su mismo itinerario
        if (commonTheoryIds.size > 0) {
          if (
            commonTheoryIds.size > 1 ||
            !commonTheoryIds.has(assignment.subjectGroupId)
          ) {
            penalty += 1000;
          }
        } else {
          if (assignment.groupType === 'theory' && assignment.itineraryName) {
            const theoriesForMyItin = itineraryTheoryIds.get(
              assignment.itineraryName
            )!;
            if (theoriesForMyItin.size > 1) penalty += 1000;
          } else if (assignment.groupType !== 'theory') {
            if (assignment.isCommon && itineraryTheoryIds.size > 0)
              penalty += 1000;
            else if (
              assignment.itineraryName &&
              itineraryTheoryIds.has(assignment.itineraryName)
            )
              penalty += 1000;
          }
        }
      }
    }

    return penalty;
  }
}
