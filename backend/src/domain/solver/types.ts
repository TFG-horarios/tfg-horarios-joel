export interface Assignment {
  id: string;
  subjectGroupId: string;
  subjectId: string;
  shift: 'morning' | 'afternoon';
  groupType: "theory" | "practices" | "problems";
  isCommon: boolean;
  itineraryName?: string | null;
  numberOfStudents: number;
  classroomId: string;
  dayOfWeek: number;
  startSlot: number;
}

export interface Solution {
  assignments: Assignment[];
  penalty: number;
}

export interface ClassroomMap {
  [classroomId: string]: {
    capacity: number;
  };
}