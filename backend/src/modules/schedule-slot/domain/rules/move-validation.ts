import type { GroupType, ClassroomType, Shift } from '@tfg-horarios/shared';

interface ValidationAssignment {
  id: string;
  subjectGroupId: string;
  subjectId: string;
  shift: Shift;
  groupType: GroupType;
  isCommon: boolean;
  itineraryName: string | null;
  numberOfStudents: number;
  duration: number;
  dayOfWeek: number | null;
  slotIndex: number | null;
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
  maxMorningSlots: number;
  maxSlotsPerDay: number;
  academicYearId: string;
  period: number;
  shift: Shift;
}

export interface IMoveValidationRule {
  validate(context: MoveValidationContext): Promise<void> | void;
}
