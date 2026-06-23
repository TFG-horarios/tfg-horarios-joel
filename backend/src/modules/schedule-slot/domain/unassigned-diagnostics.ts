export interface DiagnosableAssignment {
  needsComputerLab: boolean;
  groupType: string;
  numberOfStudents: number;
}

export interface CachedClassroom {
  type: string;
  capacity: number;
}

export function getUnassignedDiagnostics(
  assignment: DiagnosableAssignment,
  classroomsCache: Record<string, CachedClassroom>,
  availableClassrooms: string[]
): {
  type:
    | 'UNASSIGNED_NO_ROOMS_OF_TYPE'
    | 'UNASSIGNED_ROOM_CAPACITY'
    | 'UNASSIGNED_NO_COMPATIBLE_SLOTS';
  message: string;
} {
  const requiredType = assignment.needsComputerLab
    ? 'computer_lab'
    : ['practices', 'reduced_practices', 'tutoring'].includes(
          assignment.groupType
        )
      ? 'lab'
      : 'theory';

  const classroomsOfType = availableClassrooms.filter(
    (id) => classroomsCache[id]?.type === requiredType
  );

  if (classroomsOfType.length === 0) {
    return {
      type: 'UNASSIGNED_NO_ROOMS_OF_TYPE',
      message: 'ERR_UNASSIGNED_NO_ROOMS_OF_TYPE',
    };
  }

  const classroomsWithCapacity = classroomsOfType.filter(
    (id) => (classroomsCache[id]?.capacity || 0) >= assignment.numberOfStudents
  );

  if (classroomsWithCapacity.length === 0) {
    return {
      type: 'UNASSIGNED_ROOM_CAPACITY',
      message: 'ERR_UNASSIGNED_ROOM_CAPACITY',
    };
  }

  return {
    type: 'UNASSIGNED_NO_COMPATIBLE_SLOTS',
    message: 'ERR_UNASSIGNED_NO_COMPATIBLE_SLOTS',
  };
}
