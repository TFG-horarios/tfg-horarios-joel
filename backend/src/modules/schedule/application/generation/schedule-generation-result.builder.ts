import { projectAssignmentInterval } from '@tfg-horarios/shared';
import type {
  ScheduleEngineAssignment,
  ScheduleEngineClassroomMap,
} from '../../domain/providers/schedule-engine.provider';
import type { IScheduleIssueProvider } from '../../domain/providers/schedule-issue.provider';
import type { IScheduleRepository } from '../../domain/schedule.repository';
import { Schedule } from '../../domain/schedule.entity';
import { buildScopeBaseKey, buildScopeKey } from './schedule-generation-scope';
import type { ScheduleTimeConfigIndex } from './time-config-index';
import type {
  PeriodGenerationResult,
  PersistedScheduleItem,
  ScheduleScopeData,
  ScheduleSlotInclusion,
} from './types';

type BuildPeriodResultInput = {
  organizationId: string;
  academicYearId: string;
  period: number;
  scopeAssignments: Map<string, ScheduleScopeData>;
  itinerariesPerDegreeYearShift: Map<string, Set<string>>;
  lockedAssignments: ScheduleEngineAssignment[];
  classroomsCache: ScheduleEngineClassroomMap;
  availableClassrooms: string[];
  scheduleRepository: IScheduleRepository;
  issueProvider: IScheduleIssueProvider;
  timeConfigIndex: ScheduleTimeConfigIndex;
};

export const buildPeriodGenerationResult = async ({
  organizationId,
  academicYearId,
  period,
  scopeAssignments,
  itinerariesPerDegreeYearShift,
  lockedAssignments,
  classroomsCache,
  availableClassrooms,
  scheduleRepository,
  issueProvider,
  timeConfigIndex,
}: BuildPeriodResultInput): Promise<PeriodGenerationResult> => {
  const schedulesToPersist: PersistedScheduleItem[] = [];
  const generatedSchedules: Schedule[] = [];
  const commonSlotIdsByAssignmentId = new Map<string, string>();

  const filterAssignmentConflicts = (
    assignment: ScheduleEngineAssignment,
    scopeSubjectGroupIds: Set<string>
  ) =>
    assignment.conflicts?.filter((conflict) => {
      if (
        conflict.type.startsWith('COURSE_OVERLAP') &&
        conflict.relatedSubjectGroupIds
      ) {
        return conflict.relatedSubjectGroupIds.some((id) =>
          scopeSubjectGroupIds.has(id)
        );
      }
      return true;
    }) || [];

  const buildAssignmentConflicts = (
    assignment: ScheduleEngineAssignment,
    scopeSubjectGroupIds: Set<string>,
    persistedSlotId: string
  ) => {
    const conflicts = filterAssignmentConflicts(
      assignment,
      scopeSubjectGroupIds
    );

    if (issueProvider.isUnassignedPlacement(assignment)) {
      const diagnostic = issueProvider.getUnassignedDiagnostics(
        {
          needsComputerLab: assignment.needsComputerLab,
          groupType: assignment.groupType,
          numberOfStudents: assignment.numberOfStudents,
        },
        classroomsCache,
        availableClassrooms
      );
      conflicts.push({
        type: diagnostic.type,
        message: diagnostic.message,
        subjectGroupId: assignment.subjectGroupId,
        assignmentId: persistedSlotId,
      });
    }

    return conflicts;
  };

  const orderedScopeEntries = [...scopeAssignments.entries()].sort(
    ([keyA], [keyB]) => {
      const aIsCommon = keyA.endsWith('_common');
      const bIsCommon = keyB.endsWith('_common');
      if (aIsCommon !== bIsCommon) return aIsCommon ? -1 : 1;
      return keyA.localeCompare(keyB);
    }
  );

  for (const [, scopeData] of orderedScopeEntries) {
    const baseKey = buildScopeBaseKey(
      scopeData.degreeId,
      scopeData.courseYear,
      scopeData.shift
    );
    const isCanonicalCommon =
      scopeData.itineraryId === null &&
      (itinerariesPerDegreeYearShift.get(baseKey)?.size ?? 0) > 0;
    const commonAssignments =
      scopeData.itineraryId !== null
        ? (scopeAssignments.get(`${baseKey}_common`)?.assignments ?? [])
        : [];
    const compositeAssignments = [
      ...scopeData.assignments,
      ...commonAssignments,
    ];
    const scopeSubjectGroupIds = new Set(
      compositeAssignments.map((assignment) => assignment.subjectGroupId)
    );

    const existingSchedule = await scheduleRepository.findByScope(
      organizationId,
      scopeData.degreeId,
      scopeData.itineraryId,
      academicYearId,
      scopeData.courseYear,
      period,
      scopeData.shift
    );

    const scopeAssignmentsWithFilteredConflicts = scopeData.assignments.map(
      (assignment) => ({
        ...assignment,
        conflicts: filterAssignmentConflicts(assignment, scopeSubjectGroupIds),
      })
    );

    const schedule =
      existingSchedule ||
      Schedule.create({
        organizationId,
        degreeId: scopeData.degreeId,
        itineraryId: scopeData.itineraryId,
        academicYearId,
        timeConfigId: timeConfigIndex.resolveTimeConfigId(
          scopeData.degreeId,
          scopeData.courseYear,
          scopeData.shift,
          scopeData.itineraryId
        ),
        courseYear: scopeData.courseYear,
        period,
        shift: scopeData.shift,
        isCanonicalCommon,
        status: 'draft',
        conflicts: 0,
      });

    schedule.setCanonicalCommon(isCanonicalCommon);
    schedule.setTimeConfigId(
      timeConfigIndex.resolveTimeConfigId(
        scopeData.degreeId,
        scopeData.courseYear,
        scopeData.shift,
        scopeData.itineraryId
      )
    );
    if (existingSchedule) {
      schedule.markAsDraft();
      schedule.updateConflictsAndUnassigned(0, 0);
    }

    const slots = scopeAssignmentsWithFilteredConflicts.map((assignment) => {
      const id = crypto.randomUUID();
      if (assignment.isCommon) {
        commonSlotIdsByAssignmentId.set(assignment.id, id);
      }

      return {
        id,
        scheduleId: schedule.id,
        subjectGroupId: assignment.subjectGroupId,
        classroomId: assignment.classroomId,
        dayOfWeek: assignment.dayOfWeek,
        slotIndex: assignment.slotIndex,
        duration: assignment.duration,
        conflicts: buildAssignmentConflicts(
          assignment,
          scopeSubjectGroupIds,
          id
        ),
      };
    });

    schedulesToPersist.push({
      schedule,
      slots,
      inclusions: [],
      baseKey,
      itineraryId: scopeData.itineraryId,
    });
    if (!isCanonicalCommon) {
      generatedSchedules.push(schedule);
    }
  }

  addGeneratedCommonInclusions({
    schedulesToPersist,
    scopeAssignments,
    commonSlotIdsByAssignmentId,
    buildAssignmentConflicts,
  });

  updateScheduleMetrics(schedulesToPersist, issueProvider);

  const additionalInclusions = await buildAdditionalCommonInclusions({
    organizationId,
    academicYearId,
    period,
    schedulesToPersist,
    scopeAssignments,
    lockedAssignments,
    commonSlotIdsByAssignmentId,
    scheduleRepository,
    buildAssignmentConflicts,
  });

  return {
    schedulesToPersist,
    additionalInclusions,
    generatedSchedules,
    reservationSlots: buildReservationSlots(
      schedulesToPersist,
      period,
      timeConfigIndex
    ),
  };
};

type BuildAssignmentConflicts = (
  assignment: ScheduleEngineAssignment,
  scopeSubjectGroupIds: Set<string>,
  persistedSlotId: string
) => ScheduleEngineAssignment['conflicts'];

const addGeneratedCommonInclusions = ({
  schedulesToPersist,
  scopeAssignments,
  commonSlotIdsByAssignmentId,
  buildAssignmentConflicts,
}: {
  schedulesToPersist: PersistedScheduleItem[];
  scopeAssignments: Map<string, ScheduleScopeData>;
  commonSlotIdsByAssignmentId: Map<string, string>;
  buildAssignmentConflicts: BuildAssignmentConflicts;
}) => {
  for (const item of schedulesToPersist) {
    if (item.itineraryId === null) continue;

    const commonAssignments =
      scopeAssignments.get(`${item.baseKey}_common`)?.assignments ?? [];
    if (commonAssignments.length === 0) continue;

    const ownAssignments =
      scopeAssignments.get(buildScopeKeyFromItem(item))?.assignments ?? [];
    const scopeSubjectGroupIds = new Set(
      [...ownAssignments, ...commonAssignments].map(
        (assignment) => assignment.subjectGroupId
      )
    );

    for (const commonAssignment of commonAssignments) {
      const slotId = commonSlotIdsByAssignmentId.get(commonAssignment.id);
      if (!slotId) continue;

      item.inclusions.push({
        scheduleId: item.schedule.id,
        slotId,
        conflicts:
          buildAssignmentConflicts(
            commonAssignment,
            scopeSubjectGroupIds,
            slotId
          ) ?? [],
      });
    }
  }
};

const updateScheduleMetrics = (
  schedulesToPersist: PersistedScheduleItem[],
  issueProvider: IScheduleIssueProvider
) => {
  const slotsById = new Map(
    schedulesToPersist
      .flatMap((item) => item.slots)
      .map((slot) => [slot.id, slot])
  );

  for (const item of schedulesToPersist) {
    const conflictsCount =
      item.slots.reduce(
        (acc, slot) =>
          acc + issueProvider.countSchedulingConflicts(slot.conflicts),
        0
      ) +
      item.inclusions.reduce(
        (acc, inclusion) =>
          acc + issueProvider.countSchedulingConflicts(inclusion.conflicts),
        0
      );
    const unassignedCount =
      item.slots.filter((slot) => issueProvider.isUnassignedPlacement(slot))
        .length +
      item.inclusions.filter((inclusion) => {
        const includedSlot = slotsById.get(inclusion.slotId);
        return includedSlot
          ? issueProvider.isUnassignedPlacement(includedSlot)
          : false;
      }).length;

    item.schedule.updateConflictsAndUnassigned(conflictsCount, unassignedCount);
  }
};

const buildAdditionalCommonInclusions = async ({
  organizationId,
  academicYearId,
  period,
  schedulesToPersist,
  scopeAssignments,
  lockedAssignments,
  commonSlotIdsByAssignmentId,
  scheduleRepository,
  buildAssignmentConflicts,
}: {
  organizationId: string;
  academicYearId: string;
  period: number;
  schedulesToPersist: PersistedScheduleItem[];
  scopeAssignments: Map<string, ScheduleScopeData>;
  lockedAssignments: ScheduleEngineAssignment[];
  commonSlotIdsByAssignmentId: Map<string, string>;
  scheduleRepository: IScheduleRepository;
  buildAssignmentConflicts: BuildAssignmentConflicts;
}): Promise<ScheduleSlotInclusion[]> => {
  const persistedScheduleIds = new Set(
    schedulesToPersist.map((item) => item.schedule.id)
  );
  const additionalInclusions: ScheduleSlotInclusion[] = [];
  const existingSchedules =
    (await scheduleRepository.findAll(organizationId)) ?? [];

  for (const existingSchedule of existingSchedules) {
    if (
      existingSchedule.itineraryId === null ||
      existingSchedule.academicYearId !== academicYearId ||
      existingSchedule.period !== period ||
      persistedScheduleIds.has(existingSchedule.id)
    ) {
      continue;
    }

    const baseKey = buildScopeBaseKey(
      existingSchedule.degreeId,
      existingSchedule.courseYear,
      existingSchedule.shift
    );
    const commonAssignments =
      scopeAssignments.get(`${baseKey}_common`)?.assignments ?? [];
    if (commonAssignments.length === 0) continue;

    const scopeSubjectGroupIds = new Set([
      ...commonAssignments.map((assignment) => assignment.subjectGroupId),
      ...lockedAssignments
        .filter(
          (assignment) =>
            assignment.degreeId === existingSchedule.degreeId &&
            assignment.courseYear === existingSchedule.courseYear &&
            assignment.shift === existingSchedule.shift &&
            assignment.itineraryId === existingSchedule.itineraryId
        )
        .map((assignment) => assignment.subjectGroupId),
    ]);

    for (const commonAssignment of commonAssignments) {
      const slotId = commonSlotIdsByAssignmentId.get(commonAssignment.id);
      if (!slotId) continue;

      additionalInclusions.push({
        scheduleId: existingSchedule.id,
        slotId,
        conflicts:
          buildAssignmentConflicts(
            commonAssignment,
            scopeSubjectGroupIds,
            slotId
          ) ?? [],
      });
    }
  }

  return additionalInclusions;
};

const buildReservationSlots = (
  schedulesToPersist: PersistedScheduleItem[],
  period: number,
  timeConfigIndex: ScheduleTimeConfigIndex
) =>
  schedulesToPersist
    .flatMap((schedule) => schedule.slots)
    .filter(
      (slot) =>
        slot.classroomId !== null &&
        slot.dayOfWeek !== null &&
        slot.slotIndex !== null
    )
    .flatMap((slot) => {
      const schedule = schedulesToPersist.find(
        (item) => item.schedule.id === slot.scheduleId
      )?.schedule;
      const timeConfigId = schedule?.timeConfigId;
      const grid = timeConfigId
        ? timeConfigIndex.timeGrids[timeConfigId]
        : undefined;
      const interval =
        grid && slot.slotIndex !== null
          ? projectAssignmentInterval(grid, slot.slotIndex, slot.duration)
          : null;
      if (!timeConfigId || !interval) return [];
      return [
        {
          classroomId: slot.classroomId as string,
          dayOfWeek: slot.dayOfWeek as number,
          slotIndex: slot.slotIndex as number,
          duration: slot.duration,
          period,
          timeConfigId,
          startTimeMinutes: interval.startMinutes,
          endTimeMinutes: interval.endMinutes,
        },
      ];
    });

const buildScopeKeyFromItem = (item: PersistedScheduleItem) =>
  buildScopeKey(
    item.schedule.degreeId,
    item.schedule.courseYear,
    item.schedule.shift,
    item.itineraryId
  );
