import type { GroupType, ClassroomType, Shift } from '@tfg-horarios/shared';

export interface Assignment {
  id: string;
  subjectGroupId: string;
  subjectId: string;
  shift: Shift;
  groupType: GroupType;
  isCommon: boolean;
  itineraryName: string | null;
  numberOfStudents: number;
  degreeId: string;
  courseYear: number;
  classroomId: string | null;
  dayOfWeek: number | null;
  slotIndex: number | null;
  duration: number;
  isLocked?: boolean;
}

export interface Solution {
  assignments: Assignment[];
  penalty: number;
  hardPenalty: number;
}

export interface ClassroomMap {
  [classroomId: string]: {
    capacity: number;
    type: ClassroomType;
  };
}
