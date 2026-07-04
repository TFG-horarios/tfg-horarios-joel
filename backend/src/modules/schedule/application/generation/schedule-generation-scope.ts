import type { Shift } from '@tfg-horarios/shared';
import type {
  ScheduleEngineAssignment,
  ScheduleEngineGroupData,
} from '../../domain/providers/schedule-engine.provider';
import type { ScheduleScopeData } from './types';

export const buildScopeBaseKey = (
  degreeId: string,
  courseYear: number,
  shift: Shift
) => `${degreeId}_${courseYear}_${shift}`;

export const buildScopeKey = (
  degreeId: string,
  courseYear: number,
  shift: Shift,
  itineraryId: string | null
) =>
  `${buildScopeBaseKey(degreeId, courseYear, shift)}_${itineraryId ?? 'common'}`;

export const parseScopeKey = (scopeKey: string) => {
  const parts = scopeKey.split('_');
  const degreeId = parts[0] || '';
  const courseYear = parseInt(parts[1] || '0', 10);
  const shift = (parts[2] || 'morning') as Shift;
  const itineraryId = parts[3] === 'common' ? null : parts.slice(3).join('_');

  return { degreeId, courseYear, shift, itineraryId };
};

export const buildItinerariesPerDegreeYearShift = (
  groupsData: ScheduleEngineGroupData[]
) => {
  const itinerariesPerDegreeYearShift = new Map<string, Set<string>>();

  for (const group of groupsData) {
    if (!group.isCommon && group.itineraryId) {
      const key = buildScopeBaseKey(
        group.degreeId,
        group.courseYear,
        group.shift
      );
      if (!itinerariesPerDegreeYearShift.has(key)) {
        itinerariesPerDegreeYearShift.set(key, new Set());
      }
      itinerariesPerDegreeYearShift.get(key)!.add(group.itineraryId);
    }
  }

  return itinerariesPerDegreeYearShift;
};

export const buildScopeKeysToGenerate = (
  groupsData: ScheduleEngineGroupData[],
  itinerariesPerDegreeYearShift: Map<string, Set<string>>
) => {
  const scopeKeysToGenerate = new Set<string>();

  for (const group of groupsData) {
    const baseKey = buildScopeBaseKey(
      group.degreeId,
      group.courseYear,
      group.shift
    );
    const itineraries = itinerariesPerDegreeYearShift.get(baseKey);

    if (!itineraries || itineraries.size === 0) {
      scopeKeysToGenerate.add(
        buildScopeKey(group.degreeId, group.courseYear, group.shift, null)
      );
    } else if (group.isCommon) {
      scopeKeysToGenerate.add(
        buildScopeKey(group.degreeId, group.courseYear, group.shift, null)
      );

      for (const itineraryId of itineraries) {
        scopeKeysToGenerate.add(
          buildScopeKey(
            group.degreeId,
            group.courseYear,
            group.shift,
            itineraryId
          )
        );
      }
    } else if (group.itineraryId) {
      scopeKeysToGenerate.add(
        buildScopeKey(
          group.degreeId,
          group.courseYear,
          group.shift,
          group.itineraryId
        )
      );
    }
  }

  return scopeKeysToGenerate;
};

export const buildScopeAssignments = (
  scopeKeysToGenerate: Set<string>,
  groupsData: ScheduleEngineGroupData[],
  assignments: ScheduleEngineAssignment[],
  itinerariesPerDegreeYearShift: Map<string, Set<string>>
) => {
  const scopeAssignments = new Map<string, ScheduleScopeData>();

  for (const scopeKey of scopeKeysToGenerate) {
    scopeAssignments.set(scopeKey, {
      ...parseScopeKey(scopeKey),
      assignments: [],
    });
  }

  for (const assignment of assignments) {
    const group = groupsData.find(
      (item) => item.subjectGroupId === assignment.subjectGroupId
    );
    if (!group) continue;

    const baseKey = buildScopeBaseKey(
      assignment.degreeId,
      assignment.courseYear,
      assignment.shift
    );
    const itineraries = itinerariesPerDegreeYearShift.get(baseKey);

    if (!itineraries || itineraries.size === 0) {
      ensureScopeAssignment(
        scopeAssignments,
        assignment,
        null
      ).assignments.push(assignment);
    } else if (group.isCommon) {
      ensureScopeAssignment(
        scopeAssignments,
        assignment,
        null
      ).assignments.push(assignment);
    } else if (group.itineraryId) {
      ensureScopeAssignment(
        scopeAssignments,
        assignment,
        group.itineraryId
      ).assignments.push(assignment);
    }
  }

  return scopeAssignments;
};

const ensureScopeAssignment = (
  scopeAssignments: Map<string, ScheduleScopeData>,
  assignment: ScheduleEngineAssignment,
  itineraryId: string | null
) => {
  const key = buildScopeKey(
    assignment.degreeId,
    assignment.courseYear,
    assignment.shift,
    itineraryId
  );

  if (!scopeAssignments.has(key)) {
    scopeAssignments.set(key, {
      degreeId: assignment.degreeId,
      itineraryId,
      courseYear: assignment.courseYear,
      shift: assignment.shift,
      assignments: [],
    });
  }

  return scopeAssignments.get(key)!;
};
