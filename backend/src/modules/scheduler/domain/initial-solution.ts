import type { Assignment, ClassroomMap, Solution } from './types';
import {
  intervalsOverlap,
  projectAssignmentInterval,
  type AssignmentInterval,
  type GroupType,
  type ScheduleTimeGrid,
  type Shift,
} from '@tfg-horarios/shared';
import { PenaltyCalculator } from './penalty-calculator';

export interface GroupInitialData {
  subjectGroupId: string;
  subjectId: string;
  groupType: GroupType;
  isCommon: boolean;
  itineraryName?: string | null;
  itineraryId?: string | null;
  numberOfStudents: number;
  needsComputerLab: boolean;
  shift: Shift;
  weeklyHours: number;
  degreeId: string;
  courseYear: number;
  timeConfigId?: string;
}

export class InitialSolution {
  private readonly timeGrids: Record<string, ScheduleTimeGrid>;

  constructor(
    private readonly penaltyCalculator: PenaltyCalculator,
    private readonly availableClassrooms: string[],
    private readonly classroomsCache: ClassroomMap,
    timeGridsOrMaxSlotsPerDay: Record<string, ScheduleTimeGrid> | number,
    _legacyMaxMorningSlots?: number,
    private readonly slotDuration: number = 60,
    private readonly days: number[] = [1, 2, 3, 4, 5]
  ) {
    this.timeGrids =
      typeof timeGridsOrMaxSlotsPerDay === 'number'
        ? {}
        : timeGridsOrMaxSlotsPerDay;
  }

  public generate(
    groups: GroupInitialData[],
    lockedAssignments: Assignment[] = []
  ): Solution {
    const groupCountsPerSubjectType = new Map<string, Set<string>>();
    for (const group of groups) {
      const key = `${group.subjectId}-${group.shift}-${group.groupType}`;
      const groupIds = groupCountsPerSubjectType.get(key) ?? new Set<string>();
      groupIds.add(group.subjectGroupId);
      groupCountsPerSubjectType.set(key, groupIds);
    }

    const rigidity = (group: GroupInitialData) => {
      if (group.groupType === 'theory') return 3;
      const key = `${group.subjectId}-${group.shift}-${group.groupType}`;
      if (groupCountsPerSubjectType.get(key)?.size === 1) return 2;
      return 1;
    };

    const sortedGroups = [...groups].sort((a, b) => {
      if (a.isCommon !== b.isCommon) {
        return a.isCommon ? -1 : 1;
      }

      const rigidityDifference = rigidity(b) - rigidity(a);
      if (rigidityDifference !== 0) return rigidityDifference;

      return (
        b.numberOfStudents - a.numberOfStudents ||
        b.weeklyHours - a.weeklyHours ||
        a.degreeId.localeCompare(b.degreeId) ||
        a.courseYear - b.courseYear ||
        a.shift.localeCompare(b.shift) ||
        (a.itineraryId ?? '').localeCompare(b.itineraryId ?? '') ||
        a.subjectId.localeCompare(b.subjectId) ||
        a.groupType.localeCompare(b.groupType) ||
        a.subjectGroupId.localeCompare(b.subjectGroupId)
      );
    });

    const assignments: Assignment[] = [];

    const occupiedClassrooms = new Map<
      string,
      { dayOfWeek: number; interval: AssignmentInterval }[]
    >();

    for (const locked of lockedAssignments) {
      if (
        locked.classroomId &&
        locked.dayOfWeek !== null &&
        locked.slotIndex !== null
      ) {
        const grid = locked.timeConfigId
          ? this.timeGrids[locked.timeConfigId]
          : undefined;
        const interval = grid
          ? projectAssignmentInterval(grid, locked.slotIndex, locked.duration)
          : null;
        if (interval) {
          const roomEntries = occupiedClassrooms.get(locked.classroomId) ?? [];
          roomEntries.push({ dayOfWeek: locked.dayOfWeek, interval });
          occupiedClassrooms.set(locked.classroomId, roomEntries);
        }
      }
    }

    for (const group of sortedGroups) {
      const totalMinutes = group.weeklyHours * 60;
      const slotsCount = Math.floor(totalMinutes / this.slotDuration);
      const remainder = totalMinutes % this.slotDuration;
      const sessions = [];

      for (let i = 0; i < slotsCount - 1; i++) {
        sessions.push(1);
      }

      if (slotsCount > 0) {
        sessions.push(1 + remainder / this.slotDuration);
      } else if (remainder > 0) {
        sessions.push(remainder / this.slotDuration);
      }

      for (let h = 0; h < sessions.length; h++) {
        const sessionDuration = sessions[h]!;
        let bestPlacement: {
          classroomId: string;
          dayOfWeek: number;
          slotIndex: number;
        } | null = null;
        let minHardPenalty = Infinity;

        const classroomsToSearch = this.getClassroomsForGroup(group);

        const grid = group.timeConfigId
          ? this.timeGrids[group.timeConfigId]
          : undefined;
        if (!grid) {
          assignments.push(
            this.createUnassignedAssignment(group, sessionDuration)
          );
          continue;
        }
        const baselinePenalty = this.penaltyCalculator.evaluateHard(
          assignments,
          lockedAssignments
        );
        const timeCandidates = this.days.flatMap((day) =>
          grid.slots
            .filter((slot: ScheduleTimeGrid['slots'][number]) =>
              projectAssignmentInterval(grid, slot.slotIndex, sessionDuration)
            )
            .map((slot: ScheduleTimeGrid['slots'][number]) => ({
              day,
              slot: slot.slotIndex,
            }))
        );

        const overlappingAssignments = (day: number, slot: number) =>
          assignments.filter((assignment) => {
            if (
              assignment.dayOfWeek !== day ||
              assignment.slotIndex === null ||
              assignment.degreeId !== group.degreeId ||
              assignment.courseYear !== group.courseYear ||
              assignment.shift !== group.shift
            ) {
              return false;
            }

            const assignmentGrid = assignment.timeConfigId
              ? this.timeGrids[assignment.timeConfigId]
              : undefined;
            const assignmentInterval = assignmentGrid
              ? projectAssignmentInterval(
                  assignmentGrid,
                  assignment.slotIndex,
                  assignment.duration
                )
              : null;
            const candidateInterval = projectAssignmentInterval(
              grid,
              slot,
              sessionDuration
            );
            return !!(
              assignmentInterval &&
              candidateInterval &&
              intervalsOverlap(assignmentInterval, candidateInterval)
            );
          });

        timeCandidates.sort((a, b) => {
          const assignmentsAtA = overlappingAssignments(a.day, a.slot);
          const assignmentsAtB = overlappingAssignments(b.day, b.slot);

          if (group.isCommon) {
            const specificAtA = assignmentsAtA.filter(
              (assignment) => !assignment.isCommon
            ).length;
            const specificAtB = assignmentsAtB.filter(
              (assignment) => !assignment.isCommon
            ).length;
            return (
              specificAtA - specificAtB ||
              assignmentsAtA.length - assignmentsAtB.length ||
              a.day - b.day ||
              a.slot - b.slot
            );
          }

          const commonAtA = assignmentsAtA.filter(
            (assignment) => assignment.isCommon
          ).length;
          const commonAtB = assignmentsAtB.filter(
            (assignment) => assignment.isCommon
          ).length;
          const otherItineraryAtA = assignmentsAtA.filter(
            (assignment) =>
              !assignment.isCommon &&
              assignment.itineraryId !== group.itineraryId
          ).length;
          const otherItineraryAtB = assignmentsAtB.filter(
            (assignment) =>
              !assignment.isCommon &&
              assignment.itineraryId !== group.itineraryId
          ).length;

          return (
            commonAtA - commonAtB ||
            otherItineraryAtB - otherItineraryAtA ||
            assignmentsAtB.length - assignmentsAtA.length ||
            a.day - b.day ||
            a.slot - b.slot
          );
        });

        candidateSearch: for (const { day, slot } of timeCandidates) {
          for (const roomId of classroomsToSearch) {
            const candidateInterval = projectAssignmentInterval(
              grid,
              slot,
              sessionDuration
            );
            if (!candidateInterval) continue;
            const isOccupied = (occupiedClassrooms.get(roomId) ?? []).some(
              (entry) =>
                entry.dayOfWeek === day &&
                intervalsOverlap(entry.interval, candidateInterval)
            );
            if (isOccupied) continue;

            const tempAssignment: Assignment = {
              id: `${group.subjectGroupId}_${h}`,
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
              classroomId: roomId,
              dayOfWeek: day,
              slotIndex: slot,
              duration: sessionDuration,
            };

            assignments.push(tempAssignment);
            const currentPenalty = this.penaltyCalculator.evaluateHard(
              assignments,
              lockedAssignments
            );
            assignments.pop();

            if (currentPenalty.hardPenalty < minHardPenalty) {
              minHardPenalty = currentPenalty.hardPenalty;
              bestPlacement = {
                classroomId: roomId,
                dayOfWeek: day,
                slotIndex: slot,
              };
            }

            if (currentPenalty.hardPenalty <= baselinePenalty.hardPenalty) {
              break candidateSearch;
            }
          }
        }

        if (bestPlacement) {
          const bestInterval = projectAssignmentInterval(
            grid,
            bestPlacement.slotIndex,
            sessionDuration
          );
          if (bestInterval) {
            const roomEntries =
              occupiedClassrooms.get(bestPlacement.classroomId) ?? [];
            roomEntries.push({
              dayOfWeek: bestPlacement.dayOfWeek,
              interval: bestInterval,
            });
            occupiedClassrooms.set(bestPlacement.classroomId, roomEntries);
          }
          assignments.push({
            id: crypto.randomUUID(),
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
            classroomId: bestPlacement.classroomId,
            dayOfWeek: bestPlacement.dayOfWeek,
            slotIndex: bestPlacement.slotIndex,
            duration: sessionDuration,
          });
        } else {
          assignments.push(
            this.createUnassignedAssignment(group, sessionDuration)
          );
        }
      }
    }

    const penalties = this.penaltyCalculator.evaluateHard(
      assignments,
      lockedAssignments
    );
    return {
      assignments,
      unassigned: assignments.filter(
        (assignment) =>
          assignment.classroomId === null ||
          assignment.dayOfWeek === null ||
          assignment.slotIndex === null
      ).length,
      penalty: penalties.hardPenalty,
      hardPenalty: penalties.hardPenalty,
      conflicts: penalties.conflicts,
    };
  }

  private getClassroomsForGroup(group: GroupInitialData): string[] {
    const requiredType = group.needsComputerLab
      ? 'computer_lab'
      : ['practices', 'reduced_practices', 'tutoring'].includes(group.groupType)
        ? 'lab'
        : 'theory';

    const compatibleClassrooms = this.availableClassrooms.filter((id) => {
      const cls = this.classroomsCache[id];
      return (
        cls &&
        cls.type === requiredType &&
        cls.capacity >= group.numberOfStudents
      );
    });

    let classroomsToSearch = compatibleClassrooms;

    if (
      !group.needsComputerLab &&
      ['practices', 'reduced_practices', 'tutoring'].includes(group.groupType)
    ) {
      const fallbackRooms = this.availableClassrooms.filter((id) => {
        const cls = this.classroomsCache[id];
        return (
          cls && cls.type === 'theory' && cls.capacity >= group.numberOfStudents
        );
      });

      classroomsToSearch = [...classroomsToSearch, ...fallbackRooms];
    } else if (!group.needsComputerLab) {
      const fallbackRooms = this.availableClassrooms.filter((id) => {
        const cls = this.classroomsCache[id];
        return (
          cls && cls.type === 'lab' && cls.capacity >= group.numberOfStudents
        );
      });

      classroomsToSearch = [...classroomsToSearch, ...fallbackRooms];
    }

    if (group.groupType === 'reduced_practices') {
      classroomsToSearch.sort((a, b) => {
        const capA = this.classroomsCache[a]?.capacity || 0;
        const capB = this.classroomsCache[b]?.capacity || 0;
        return capA - capB;
      });
    }

    return classroomsToSearch;
  }

  private createUnassignedAssignment(
    group: GroupInitialData,
    duration: number
  ): Assignment {
    return {
      id: crypto.randomUUID(),
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
      classroomId: null,
      dayOfWeek: null,
      slotIndex: null,
      duration,
    };
  }
}
