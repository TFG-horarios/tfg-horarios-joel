import { type Assignment, type Solution, type ClassroomMap } from './types';
import { PenaltyCalculator } from './penalty-calculator';

export interface GroupInitialData {
  subjectGroupId: string;
  subjectId: string;
  groupType: 'theory' | 'problems' | 'practices';
  isCommon: boolean;
  itineraryName?: string | null;
  numberOfStudents: number;
  shift: 'morning' | 'afternoon';
  weeklyHours: number;
  degreeId: string;
  courseYear: number;
}

export class InitialSolution {
  constructor(
    private readonly penaltyCalculator: PenaltyCalculator,
    private readonly availableClassrooms: string[],
    private readonly classroomsCache: ClassroomMap,
    private readonly maxSlotsPerDay: number,
    private readonly maxMorningSlots: number,
    private readonly slotDuration: number = 60,
    private readonly days: number[] = [1, 2, 3, 4, 5]
  ) {}

  public generate(groups: GroupInitialData[]): Solution {
    const sortedGroups = [...groups].sort((a, b) => {
      const isAPractices = a.groupType === 'practices' ? 1 : 0;
      const isBPractices = b.groupType === 'practices' ? 1 : 0;
      if (isAPractices !== isBPractices) return isBPractices - isAPractices;
      return b.numberOfStudents - a.numberOfStudents;
    });

    const assignments: Assignment[] = [];

    const occupiedClassrooms = new Set<string>();

    for (const group of sortedGroups) {
      const totalMinutes = group.weeklyHours * 60;
      const slotsCount = Math.floor(totalMinutes / this.slotDuration);
      const remainder = totalMinutes % this.slotDuration;
      const sessions = [];

      for (let i = 0; i < slotsCount - 1; i++) {
        sessions.push(1);
      }

      if (slotsCount > 0) {
        sessions.push(1 + remainder / this.slotDuration);
      } else if (remainder > 0) {
        sessions.push(remainder / this.slotDuration);
      }

      for (let h = 0; h < sessions.length; h++) {
        const sessionDuration = sessions[h]!;
        let bestPlacement: {
          classroomId: string;
          dayOfWeek: number;
          slotIndex: number;
        } | null = null;
        let minPenalty = Infinity;

        const requiredType = group.groupType === 'practices' ? 'lab' : 'theory';

        const compatibleClassrooms = this.availableClassrooms.filter((id) => {
          const cls = this.classroomsCache[id];
          return (
            cls &&
            cls.type === requiredType &&
            cls.capacity >= group.numberOfStudents
          );
        });

        const classroomsToSearch =
          compatibleClassrooms.length > 0
            ? compatibleClassrooms
            : this.availableClassrooms.filter(
                (id) => this.classroomsCache[id]?.type === requiredType
              );

        const startLimit = group.shift === 'morning' ? 0 : this.maxMorningSlots;
        const endLimit =
          group.shift === 'morning'
            ? this.maxMorningSlots
            : this.maxSlotsPerDay;

        const spannedSlots = Math.ceil(sessionDuration);

        for (const roomId of classroomsToSearch) {
          for (const day of this.days) {
            for (
              let slot = startLimit;
              slot <= endLimit - spannedSlots;
              slot++
            ) {
              let isOccupied = false;
              for (let d = 0; d < spannedSlots; d++) {
                if (occupiedClassrooms.has(`${roomId}_${day}_${slot + d}`)) {
                  isOccupied = true;
                  break;
                }
              }
              if (isOccupied) continue;

              const tempAssignment: Assignment = {
                id: `${group.subjectGroupId}_${h}`,
                subjectGroupId: group.subjectGroupId,
                subjectId: group.subjectId,
                shift: group.shift,
                groupType: group.groupType,
                isCommon: group.isCommon,
                itineraryName: group.itineraryName ?? null,
                numberOfStudents: group.numberOfStudents,
                degreeId: group.degreeId,
                courseYear: group.courseYear,
                classroomId: roomId,
                dayOfWeek: day,
                slotIndex: slot,
                duration: sessionDuration,
              };

              assignments.push(tempAssignment);
              const currentPenalty =
                this.penaltyCalculator.calculatePenalty(assignments);
              assignments.pop();

              if (currentPenalty < minPenalty) {
                minPenalty = currentPenalty;
                bestPlacement = {
                  classroomId: roomId,
                  dayOfWeek: day,
                  slotIndex: slot,
                };
              }

              if (currentPenalty === 0) break;
            }
            if (minPenalty === 0 && bestPlacement) break;
          }
          if (minPenalty === 0 && bestPlacement) break;
        }

        if (bestPlacement) {
          const spannedSlots = Math.ceil(sessionDuration);
          for (let d = 0; d < spannedSlots; d++) {
            occupiedClassrooms.add(
              `${bestPlacement.classroomId}_${bestPlacement.dayOfWeek}_${bestPlacement.slotIndex + d}`
            );
          }
          assignments.push({
            id: crypto.randomUUID(),
            subjectGroupId: group.subjectGroupId,
            subjectId: group.subjectId,
            shift: group.shift,
            groupType: group.groupType,
            isCommon: group.isCommon,
            itineraryName: group.itineraryName ?? null,
            numberOfStudents: group.numberOfStudents,
            degreeId: group.degreeId,
            courseYear: group.courseYear,
            classroomId: bestPlacement.classroomId,
            dayOfWeek: bestPlacement.dayOfWeek,
            slotIndex: bestPlacement.slotIndex,
            duration: sessionDuration,
          });
        } else {
          assignments.push({
            id: crypto.randomUUID(),
            subjectGroupId: group.subjectGroupId,
            subjectId: group.subjectId,
            shift: group.shift,
            groupType: group.groupType,
            isCommon: group.isCommon,
            itineraryName: group.itineraryName ?? null,
            numberOfStudents: group.numberOfStudents,
            degreeId: group.degreeId,
            courseYear: group.courseYear,
            classroomId: null,
            dayOfWeek: null,
            slotIndex: null,
            duration: sessionDuration,
          });
        }
      }
    }

    return {
      assignments,
      penalty: this.penaltyCalculator.calculatePenalty(assignments),
    };
  }
}
