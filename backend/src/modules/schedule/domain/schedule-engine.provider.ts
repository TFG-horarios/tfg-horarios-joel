import type {
  GroupType,
  ClassroomType,
  Shift,
  ScheduleConflictType,
} from '@tfg-horarios/shared';

export interface ScheduleEngineGroupData {
  subjectGroupId: string;
  subjectId: string;
  groupType: GroupType;
  isCommon: boolean;
  itineraryName?: string | null;
  itineraryId?: string | null;
  numberOfStudents: number;
  shift: Shift;
  weeklyHours: number;
  degreeId: string;
  courseYear: number;
}

export interface ScheduleEngineClassroomMap {
  [classroomId: string]: {
    capacity: number;
    type: ClassroomType;
  };
}

export interface ScheduleEngineConflictDetail {
  type: ScheduleConflictType;
  subjectGroupId: string;
  assignmentId?: string;
  relatedSubjectGroupIds?: string[];
  classroomId?: string;
  message?: string;
}

export interface ScheduleEngineAssignment {
  id: string;
  subjectGroupId: string;
  subjectId: string;
  shift: Shift;
  groupType: GroupType;
  isCommon: boolean;
  itineraryName: string | null;
  itineraryId?: string | null;
  numberOfStudents: number;
  degreeId: string;
  courseYear: number;
  classroomId: string | null;
  dayOfWeek: number | null;
  slotIndex: number | null;
  duration: number;
  isLocked?: boolean;
  conflicts?: ScheduleEngineConflictDetail[];
}

export interface ScheduleEngineSolution {
  assignments: ScheduleEngineAssignment[];
  penalty: number;
  hardPenalty: number;
}

export interface IScheduleEngineProvider {
  runGeneration(
    groupsData: ScheduleEngineGroupData[],
    classroomsCache: ScheduleEngineClassroomMap,
    availableClassrooms: string[],
    maxMorningSlots: number,
    maxAfternoonSlots: number,
    slotDuration: number,
    lockedAssignments?: ScheduleEngineAssignment[]
  ): Promise<ScheduleEngineSolution>;
}
