import type { GroupType, ClassroomType, Shift } from '@tfg-horarios/shared';
import type { ConflictDetail } from './constraints/constraint.interface';

export interface Assignment {
  id: string;
  subjectGroupId: string;
  subjectId: string;
  shift: Shift;
  groupType: GroupType;
  isCommon: boolean;
  itineraryName: string | null;
  itineraryId?: string | null;
  numberOfStudents: number;
  needsComputerLab: boolean;
  degreeId: string;
  courseYear: number;
  classroomId: string | null;
  dayOfWeek: number | null;
  slotIndex: number | null;
  duration: number;
  isLocked?: boolean;
  conflicts?: ConflictDetail[];
}

export interface Solution {
  assignments: Assignment[];
  unassigned: number;
  penalty: number;
  hardPenalty: number;
  conflicts: ConflictDetail[];
}

export interface ClassroomMap {
  [classroomId: string]: {
    capacity: number;
    type: ClassroomType;
    floor: number;
  };
}
