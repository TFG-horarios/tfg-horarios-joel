import type { GenerationScopeDTO } from '@tfg-horarios/shared';
import type { IScheduleRepository } from '../../domain/schedule.repository';
import type { IScheduleDataProvider } from '../../domain/providers/schedule-data.provider';
import type {
  IScheduleEngineProvider,
  ScheduleEngineClassroomMap,
} from '../../domain/providers/schedule-engine.provider';
import type { IScheduleIssueProvider } from '../../domain/providers/schedule-issue.provider';
import {
  buildItinerariesPerDegreeYearShift,
  buildScopeAssignments,
  buildScopeKeysToGenerate,
  parseScopeKey,
} from './schedule-generation-scope';
import {
  buildScheduleTimeConfigIndex,
  type ScheduleTimeConfigIndex,
} from './time-config-index';
import { prepareLockedAssignments } from './locked-assignments';
import { emptyPeriodResult, type PeriodGenerationResult } from './types';
import { buildPeriodGenerationResult } from './schedule-generation-result.builder';

type GeneratePeriodInput = {
  organizationId: string;
  targetDegreeIds: string[];
  availableClassrooms: string[];
  classroomsCache: ScheduleEngineClassroomMap;
  scope: GenerationScopeDTO;
  period: number;
  scheduleRepository: IScheduleRepository;
  dataProvider: IScheduleDataProvider;
  engineProvider: IScheduleEngineProvider;
  issueProvider: IScheduleIssueProvider;
};

export const generateSchedulePeriod = async ({
  organizationId,
  targetDegreeIds,
  availableClassrooms,
  classroomsCache,
  scope,
  period,
  scheduleRepository,
  dataProvider,
  engineProvider,
  issueProvider,
}: GeneratePeriodInput): Promise<PeriodGenerationResult> => {
  const groupsData = await dataProvider.getGroupsInScope(
    organizationId,
    period,
    targetDegreeIds,
    scope.itineraryIds,
    scope.courseYears
  );

  if (groupsData.length === 0) return emptyPeriodResult();

  const timeConfigIndex = await buildPeriodTimeConfigIndex({
    organizationId,
    academicYearId: scope.academicYearId,
    period,
    dataProvider,
  });

  const itinerariesPerDegreeYearShift =
    buildItinerariesPerDegreeYearShift(groupsData);
  const scopeKeysToGenerate = buildScopeKeysToGenerate(
    groupsData,
    itinerariesPerDegreeYearShift
  );
  const existingScheduleIdsToOverwrite = await findScheduleIdsToOverwrite({
    organizationId,
    academicYearId: scope.academicYearId,
    period,
    scopeKeysToGenerate,
    scheduleRepository,
  });

  const lockedAssignments = await scheduleRepository.findLockedAssignments(
    organizationId,
    scope.academicYearId,
    period,
    existingScheduleIdsToOverwrite
  );
  const lockedAssignmentsWithTimeConfig = prepareLockedAssignments(
    lockedAssignments,
    groupsData,
    timeConfigIndex
  );
  const alreadyLockedGroupIds = new Set(
    lockedAssignmentsWithTimeConfig.map(
      (assignment) => assignment.subjectGroupId
    )
  );

  const groupsToGenerate = groupsData
    .filter((group) => !alreadyLockedGroupIds.has(group.subjectGroupId))
    .map((group) => ({
      ...group,
      timeConfigId: timeConfigIndex.resolveTimeConfigId(
        group.degreeId,
        group.courseYear,
        group.shift,
        group.itineraryId ?? null
      ),
    }));

  const solution = await engineProvider.runGeneration(
    groupsToGenerate,
    classroomsCache,
    availableClassrooms,
    timeConfigIndex.timeGrids,
    timeConfigIndex.slotDuration,
    lockedAssignmentsWithTimeConfig,
    scope.optimizations
  );

  const inheritedAssignments = lockedAssignmentsWithTimeConfig.filter(
    (locked) =>
      groupsData.some((group) => group.subjectGroupId === locked.subjectGroupId)
  );
  solution.assignments.push(...inheritedAssignments);

  const scopeAssignments = buildScopeAssignments(
    scopeKeysToGenerate,
    groupsData,
    solution.assignments,
    itinerariesPerDegreeYearShift
  );

  return buildPeriodGenerationResult({
    organizationId,
    academicYearId: scope.academicYearId,
    period,
    scopeAssignments,
    itinerariesPerDegreeYearShift,
    lockedAssignments: lockedAssignmentsWithTimeConfig,
    classroomsCache,
    availableClassrooms,
    scheduleRepository,
    issueProvider,
    timeConfigIndex,
  });
};

const buildPeriodTimeConfigIndex = async ({
  organizationId,
  academicYearId,
  period,
  dataProvider,
}: {
  organizationId: string;
  academicYearId: string;
  period: number;
  dataProvider: IScheduleDataProvider;
}): Promise<ScheduleTimeConfigIndex> => {
  const academicYearConstraints =
    await dataProvider.getAcademicYearConstraints(academicYearId);
  if (!academicYearConstraints) {
    throw new Error('Academic Year not found');
  }

  const timeConfigs =
    (await dataProvider.getScheduleTimeConfigs?.(
      organizationId,
      academicYearId
    )) ?? [];

  return buildScheduleTimeConfigIndex(
    timeConfigs,
    academicYearConstraints,
    period
  );
};

const findScheduleIdsToOverwrite = async ({
  organizationId,
  academicYearId,
  period,
  scopeKeysToGenerate,
  scheduleRepository,
}: {
  organizationId: string;
  academicYearId: string;
  period: number;
  scopeKeysToGenerate: Set<string>;
  scheduleRepository: IScheduleRepository;
}) => {
  const existingScheduleIdsToOverwrite: string[] = [];

  for (const scopeKey of scopeKeysToGenerate) {
    const { degreeId, courseYear, shift, itineraryId } =
      parseScopeKey(scopeKey);
    const existing = await scheduleRepository.findByScope(
      organizationId,
      degreeId,
      itineraryId,
      academicYearId,
      courseYear,
      period,
      shift
    );
    if (existing) {
      existingScheduleIdsToOverwrite.push(existing.id);
    }
  }

  return existingScheduleIdsToOverwrite;
};
