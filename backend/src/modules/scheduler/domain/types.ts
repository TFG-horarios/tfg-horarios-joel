export interface Assignment {
  id: string;
  subjectGroupId: string;
  subjectId: string;
  shift: 'morning' | 'afternoon';
  groupType: 'theory' | 'practices' | 'problems';
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
    type: 'theory' | 'lab';
  };
}
