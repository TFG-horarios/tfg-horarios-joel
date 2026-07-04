import {
  projectAssignmentInterval,
  type AssignmentInterval,
  type ScheduleTimeGrid,
} from '@tfg-horarios/shared';
import type { Assignment, ClassroomMap } from './types';
import type { GroupInitialData } from './initial-solution';

const LAB_GROUP_TYPES = ['practices', 'reduced_practices', 'tutoring'];

export type TimeCandidate = {
  day: number;
  slot: number;
  interval: AssignmentInterval;
};

export type AssignmentTimeCandidate = {
  dayOfWeek: number;
  slotIndex: number;
};

export const getInitialSolutionClassrooms = (
  group: GroupInitialData,
  availableClassrooms: string[],
  classroomsCache: ClassroomMap
) => {
  const requiredType = group.needsComputerLab
    ? 'computer_lab'
    : LAB_GROUP_TYPES.includes(group.groupType)
      ? 'lab'
      : 'theory';

  const compatibleClassrooms = availableClassrooms.filter((id) => {
    const classroom = classroomsCache[id];
    return (
      classroom &&
      classroom.type === requiredType &&
      classroom.capacity >= group.numberOfStudents
    );
  });

  let classroomsToSearch = compatibleClassrooms;

  if (!group.needsComputerLab && LAB_GROUP_TYPES.includes(group.groupType)) {
    classroomsToSearch = [
      ...classroomsToSearch,
      ...availableClassrooms.filter((id) => {
        const classroom = classroomsCache[id];
        return (
          classroom &&
          classroom.type === 'theory' &&
          classroom.capacity >= group.numberOfStudents
        );
      }),
    ];
  } else if (!group.needsComputerLab) {
    classroomsToSearch = [
      ...classroomsToSearch,
      ...availableClassrooms.filter((id) => {
        const classroom = classroomsCache[id];
        return (
          classroom &&
          classroom.type === 'lab' &&
          classroom.capacity >= group.numberOfStudents
        );
      }),
    ];
  }

  if (group.groupType === 'reduced_practices') {
    classroomsToSearch.sort((a, b) => {
      const capA = classroomsCache[a]?.capacity || 0;
      const capB = classroomsCache[b]?.capacity || 0;
      return capA - capB;
    });
  }

  return classroomsToSearch;
};

export const getTabuSearchClassrooms = (
  assignment: Assignment,
  availableClassrooms: string[],
  classroomsCache: ClassroomMap
) => {
  const requiredType = assignment.needsComputerLab
    ? 'computer_lab'
    : LAB_GROUP_TYPES.includes(assignment.groupType)
      ? 'lab'
      : 'theory';
  const compatibleClassrooms = availableClassrooms.filter(
    (id) => classroomsCache[id]?.type === requiredType
  );
  let classroomsToSearch = assignment.needsComputerLab
    ? compatibleClassrooms
    : compatibleClassrooms.length > 0
      ? compatibleClassrooms
      : availableClassrooms;

  if (
    !assignment.needsComputerLab &&
    LAB_GROUP_TYPES.includes(assignment.groupType)
  ) {
    const theoryRooms = availableClassrooms.filter(
      (id) => classroomsCache[id]?.type === 'theory'
    );
    classroomsToSearch = Array.from(
      new Set([...classroomsToSearch, ...theoryRooms])
    );
  } else if (!assignment.needsComputerLab) {
    const labRooms = availableClassrooms.filter(
      (id) => classroomsCache[id]?.type === 'lab'
    );
    classroomsToSearch = Array.from(new Set([...classroomsToSearch, ...labRooms]));
  }

  return classroomsToSearch;
};

export const buildTimeCandidates = (
  sessionDuration: number,
  grid: ScheduleTimeGrid,
  days: number[]
): TimeCandidate[] =>
  days.flatMap((day) =>
    grid.slots.flatMap((slot: ScheduleTimeGrid['slots'][number]) => {
      const interval = projectAssignmentInterval(
        grid,
        slot.slotIndex,
        sessionDuration
      );
      return interval ? [{ day, slot: slot.slotIndex, interval }] : [];
    })
  );

export const buildAssignmentTimeCandidates = (
  assignment: Assignment,
  grid: ScheduleTimeGrid | undefined,
  days: number[]
): AssignmentTimeCandidate[] => {
  if (!grid) return [];

  return days.flatMap((dayOfWeek) =>
    grid.slots
      .filter((slot) =>
        projectAssignmentInterval(grid, slot.slotIndex, assignment.duration)
      )
      .map((slot) => ({ dayOfWeek, slotIndex: slot.slotIndex }))
  );
};
