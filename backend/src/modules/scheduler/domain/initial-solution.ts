import { type Assignment, type Solution } from './types';
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
}

export class InitialSolution {
  constructor(
    private readonly penaltyCalculator: PenaltyCalculator,
    private readonly availableClassrooms: string[],
    private readonly maxSlotsPerDay: number,
    private readonly days: number[] = [1, 2, 3, 4, 5]
  ) {}

  public generate(groups: GroupInitialData[], size: number): Solution[] {
    const solutions: Solution[] = [];

    for (let i = 0; i < size; i++) {
      const assignments: Assignment[] = [];

      for (const group of groups) {
        for (let h = 0; h < group.weeklyHours; h++) {
          assignments.push({
            id: crypto.randomUUID(),
            ...group,
            classroomId: this.getRandom(this.availableClassrooms),
            dayOfWeek: this.getRandom(this.days),
            startSlot: Math.floor(Math.random() * this.maxSlotsPerDay),
          });
        }
      }

      solutions.push({
        assignments: assignments,
        penalty: this.penaltyCalculator.calculatePenalty(assignments),
      });
    }
    return solutions;
  }

  private getRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }
}
