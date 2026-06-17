import type { GroupType, ClassroomType, Shift } from '@tfg-horarios/shared';

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

export interface ScheduleEngineAssignment {
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
