import type {
  ScheduleConflictDetailDTO,
  ScheduleConflictType,
} from '@tfg-horarios/shared';

export const conflictTranslationKeys: Record<ScheduleConflictType, string> = {
  ROOM_OVERLAP: 'ERR_ROOM_OVERLAP',
  COURSE_OVERLAP: 'ERR_OVERLAP_DUPLICATE_GROUP',
  COURSE_OVERLAP_THEORY: 'ERR_OVERLAP_THEORY',
  COURSE_OVERLAP_SINGLE_GROUP: 'ERR_OVERLAP_SINGLE_GROUP',
  COURSE_OVERLAP_DIFFERENT_GROUP_TYPES: 'ERR_OVERLAP_DIFFERENT_GROUP_TYPES',
  COURSE_OVERLAP_COMMON_ITINERARY: 'ERR_OVERLAP_COMMON_ITINERARY',
  COURSE_OVERLAP_SAME_SUBJECT: 'ERR_OVERLAP_SAME_SUBJECT',
  ROOM_CAPACITY: 'ERR_ROOM_CAPACITY',
  ROOM_TYPE: 'ERR_COMPUTER_LAB_REQUIRED',
  SHIFT_MORNING: 'ERR_SHIFT_MORNING',
  SHIFT_AFTERNOON: 'ERR_SHIFT_AFTERNOON',
  SHIFT_EXCEEDS_DAY: 'ERR_SHIFT_EXCEEDS_DAY',
  UNASSIGNED: 'ERR_SCHEDULE_HAS_UNASSIGNED_SLOTS',
  UNASSIGNED_NO_ROOMS_OF_TYPE: 'ERR_UNASSIGNED_NO_ROOMS_OF_TYPE',
  UNASSIGNED_ROOM_CAPACITY: 'ERR_UNASSIGNED_ROOM_CAPACITY',
  UNASSIGNED_NO_COMPATIBLE_SLOTS: 'ERR_UNASSIGNED_NO_COMPATIBLE_SLOTS',
};

type TranslateConflict = (
  key: string,
  values?: Record<string, string | number>
) => string;

export function formatConflictMessage(
  conflict: ScheduleConflictDetailDTO,
  groupCapacity: number,
  translate: TranslateConflict,
  subjectLabels?: ReadonlyMap<string, string>,
  classroomLabels?: ReadonlyMap<string, string>
): string {
  const values =
    conflict.type === 'UNASSIGNED_ROOM_CAPACITY'
      ? { capacity: groupCapacity }
      : undefined;
  let message = translate(conflictTranslationKeys[conflict.type], values);
  const relatedLabels = conflict.relatedSubjectGroupIds
    ?.map((id) => subjectLabels?.get(id) ?? id)
    .filter((label, index, all) => all.indexOf(label) === index);

  if (relatedLabels?.length) {
    message += ` ${translate('conflictWith', {
      subjects: relatedLabels.join(', '),
    })}`;
  }
  if (conflict.classroomId) {
    message += ` ${translate('conflictClassroom', {
      classroom:
        classroomLabels?.get(conflict.classroomId) ?? conflict.classroomId,
    })}`;
  }
  return message;
}
