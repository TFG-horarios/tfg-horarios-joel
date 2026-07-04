import type { Assignment } from './types';
import type { GroupInitialData } from './initial-solution';

export type AssignmentPlacement = {
  classroomId: string | null;
  dayOfWeek: number | null;
  slotIndex: number | null;
};

export const createAssignmentFromGroup = (
  group: GroupInitialData,
  duration: number,
  placement: AssignmentPlacement,
  id: string = crypto.randomUUID()
): Assignment => ({
  id,
  subjectGroupId: group.subjectGroupId,
  subjectId: group.subjectId,
  shift: group.shift,
  groupType: group.groupType,
  isCommon: group.isCommon,
  itineraryName: group.itineraryName ?? null,
  itineraryId: group.itineraryId ?? null,
  numberOfStudents: group.numberOfStudents,
  needsComputerLab: group.needsComputerLab,
  degreeId: group.degreeId,
  courseYear: group.courseYear,
  timeConfigId: group.timeConfigId,
  classroomId: placement.classroomId,
  dayOfWeek: placement.dayOfWeek,
  slotIndex: placement.slotIndex,
  duration,
});
