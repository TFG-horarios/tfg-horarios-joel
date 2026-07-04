import type {
  ScheduleEngineAssignment,
  ScheduleEngineGroupData,
} from '../../domain/providers/schedule-engine.provider';
import type { ScheduleTimeConfigIndex } from './time-config-index';

export const prepareLockedAssignments = (
  lockedAssignments: ScheduleEngineAssignment[],
  groupsData: ScheduleEngineGroupData[],
  timeConfigIndex: Pick<ScheduleTimeConfigIndex, 'resolveTimeConfigId'>
) => {
  const commonSubjectGroupIdsInScope = new Set(
    groupsData
      .filter((group) => group.isCommon)
      .map((group) => group.subjectGroupId)
  );

  const effectiveLockedAssignments = lockedAssignments.filter(
    (assignment) => !commonSubjectGroupIdsInScope.has(assignment.subjectGroupId)
  );

  const uniqueLockedAssignments = [
    ...new Map(
      effectiveLockedAssignments.map((assignment) => {
        const key = [
          assignment.subjectGroupId,
          assignment.classroomId ?? 'none',
          assignment.dayOfWeek ?? 'none',
          assignment.slotIndex ?? 'none',
          assignment.duration,
        ].join(':');

        return [key, assignment];
      })
    ).values(),
  ];

  return uniqueLockedAssignments.map((assignment) => ({
    ...assignment,
    timeConfigId:
      assignment.timeConfigId ??
      timeConfigIndex.resolveTimeConfigId(
        assignment.degreeId,
        assignment.courseYear,
        assignment.shift,
        assignment.itineraryId ?? null
      ),
  }));
};
