interface ValidationAssignment {
  id: string;
  subjectGroupId: string;
  subjectId: string;
  shift: 'morning' | 'afternoon';
  groupType: 'theory' | 'problems' | 'practices';
  isCommon: boolean;
  itineraryName: string | null;
  numberOfStudents: number;
  duration: number;
  dayOfWeek: number | null;
  slotIndex: number | null;
}

interface ValidationClassroom {
  capacity: number;
  type: 'theory' | 'lab';
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
  shift: 'morning' | 'afternoon';
}

export interface IMoveValidationRule {
  validate(context: MoveValidationContext): Promise<void> | void;
}
