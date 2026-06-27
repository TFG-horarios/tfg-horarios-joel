import type {
  AssignmentInterval,
  GroupType,
  ClassroomType,
  ScheduleTimeGrid,
  Shift,
} from '@tfg-horarios/shared';

export interface ValidationAssignment {
  id: string;
  subjectGroupId: string;
  subjectId: string;
  shift: Shift;
  groupType: GroupType;
  isCommon: boolean;
  itineraryName: string | null;
  numberOfStudents: number;
  needsComputerLab: boolean;
  duration: number;
  dayOfWeek: number | null;
  slotIndex: number | null;
  timeConfigId?: string | null;
}

interface ValidationClassroom {
  capacity: number;
  type: ClassroomType;
}

type ValidationClassroomMap = Record<string, ValidationClassroom>;

export interface MoveValidationContext {
  organizationId: string;
  movingAssignment: ValidationAssignment;
  newClassroomId: string | null;
  newDayOfWeek: number | null;
  newSlotIndex: number | null;
  assignments: ValidationAssignment[];
  classroomsCache: ValidationClassroomMap;
  timeGrids?: Record<string, ScheduleTimeGrid>;
  movingInterval?: AssignmentInterval | null;
  projectIntervalForPlacement?: (
    timeConfigId: string | null | undefined,
    slotIndex: number | null,
    duration: number
  ) => AssignmentInterval | null;
  resolveScheduleTimeConfigId?: (
    scheduleId: string
  ) => Promise<string | null> | string | null;
  academicYearId: string;
  period: number;
  shift: Shift;
}

export interface IMoveValidationRule {
  validate(context: MoveValidationContext): Promise<void> | void;
}
