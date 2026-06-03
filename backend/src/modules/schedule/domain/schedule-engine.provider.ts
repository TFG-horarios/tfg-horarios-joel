export interface ScheduleEngineGroupData {
  subjectGroupId: string;
  subjectId: string;
  groupType: 'theory' | 'problems' | 'practices';
  isCommon: boolean;
  itineraryName?: string | null;
  itineraryId?: string | null;
  numberOfStudents: number;
  shift: 'morning' | 'afternoon';
  weeklyHours: number;
  degreeId: string;
  courseYear: number;
}

export interface ScheduleEngineClassroomMap {
  [classroomId: string]: {
    capacity: number;
    type: 'theory' | 'lab';
  };
}

interface ScheduleEngineAssignment {
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
}

export interface ScheduleEngineSolution {
  assignments: ScheduleEngineAssignment[];
  penalty: number;
}

export interface IScheduleEngineProvider {
  runGeneration(
    groupsData: ScheduleEngineGroupData[],
    classroomsCache: ScheduleEngineClassroomMap,
    availableClassrooms: string[],
    maxMorningSlots: number,
    maxAfternoonSlots: number,
    slotDuration: number
  ): Promise<ScheduleEngineSolution>;
}
