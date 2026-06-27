import type {
  ScheduleConflictDetailDTO,
  ScheduleConflictType,
} from '@tfg-horarios/shared';
import { ConflictError } from '@/core/errors/app.error';

export const conflictCodeToType = (
  code: string
): ScheduleConflictType | null => {
  switch (code) {
    case 'ERR_ROOM_CAPACITY':
      return 'ROOM_CAPACITY';
    case 'ERR_COMPUTER_LAB_REQUIRED':
      return 'ROOM_TYPE';
    case 'ERR_ROOM_OVERLAP':
      return 'ROOM_OVERLAP';
    case 'ERR_OVERLAP_COMMON_ITINERARY':
      return 'COURSE_OVERLAP_COMMON_ITINERARY';
    case 'ERR_OVERLAP_THEORY':
      return 'COURSE_OVERLAP_THEORY';
    case 'ERR_OVERLAP_SINGLE_GROUP':
      return 'COURSE_OVERLAP_SINGLE_GROUP';
    case 'ERR_OVERLAP_DIFFERENT_GROUP_TYPES':
      return 'COURSE_OVERLAP_DIFFERENT_GROUP_TYPES';
    case 'ERR_OVERLAP_SAME_SUBJECT':
      return 'COURSE_OVERLAP_SAME_SUBJECT';
    case 'ERR_SHIFT_EXCEEDS_DAY':
      return 'SHIFT_EXCEEDS_DAY';
    case 'ERR_BREAK_CROSSING':
      return 'BREAK_CROSSING';
    case 'ERR_UNASSIGNED_NO_ROOMS_OF_TYPE':
      return 'UNASSIGNED_NO_ROOMS_OF_TYPE';
    case 'ERR_UNASSIGNED_ROOM_CAPACITY':
      return 'UNASSIGNED_ROOM_CAPACITY';
    case 'ERR_UNASSIGNED_NO_COMPATIBLE_SLOTS':
      return 'UNASSIGNED_NO_COMPATIBLE_SLOTS';
    default:
      return null;
  }
};

export class ScheduleSlotConflictError extends ConflictError {
  constructor(public readonly details: ScheduleConflictDetailDTO[]) {
    super(details.map((detail) => detail.message ?? detail.type).join('\n'));
    this.name = 'ScheduleSlotConflictError';
  }
}
