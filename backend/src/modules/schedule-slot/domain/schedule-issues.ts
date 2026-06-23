import type {
  ScheduleConflictDetailDTO,
  ScheduleConflictType,
} from '@tfg-horarios/shared';

export const UNASSIGNED_CONFLICT_TYPES = new Set<ScheduleConflictType>([
  'UNASSIGNED',
  'UNASSIGNED_NO_ROOMS_OF_TYPE',
  'UNASSIGNED_ROOM_CAPACITY',
  'UNASSIGNED_NO_COMPATIBLE_SLOTS',
]);

export function isUnassignedConflictType(type: ScheduleConflictType): boolean {
  return UNASSIGNED_CONFLICT_TYPES.has(type);
}

export function countSchedulingConflicts(
  conflicts: ScheduleConflictDetailDTO[]
): number {
  return conflicts.filter(
    (conflict) => !isUnassignedConflictType(conflict.type)
  ).length;
}

export function isUnassignedPlacement(location: {
  classroomId: string | null;
  dayOfWeek: number | null;
  slotIndex: number | null;
}): boolean {
  return (
    location.classroomId === null ||
    location.dayOfWeek === null ||
    location.slotIndex === null
  );
}
