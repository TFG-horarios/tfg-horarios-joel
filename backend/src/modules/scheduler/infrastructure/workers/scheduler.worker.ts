import { TabuSearchEngine } from '../../application/tabu-search';
import { PenaltyCalculator } from '../../domain/penalty-calculator';
import { RoomTypeConstraint } from '../../domain/constraints/soft/room-type.constraint';
import { RoomOverlapConstraint } from '../../domain/constraints/hard/room-overlap.constraint';
import { ShiftConstraint } from '../../domain/constraints/hard/shift.constraint';
import { RoomCapacityConstraint } from '../../domain/constraints/hard/room-capacity.constraint';
import { GroupOverlapConstraint } from '../../domain/constraints/hard/group-overlap.constraint';
import { CourseOverlapConstraint } from '../../domain/constraints/hard/course-overlap.constraint';
import { LCGGenerator } from '../../domain/random-generator';
import { InitialSolution } from '../../domain/initial-solution';
import {
  buildSeeds,
  runMultiStartTabuSearch,
} from '../../application/multi-start-tabu-search';
import type {
  ScheduleEngineGroupData,
  ScheduleEngineClassroomMap,
  ScheduleEngineAssignment,
} from '@/modules/schedule/domain/schedule-engine.provider';

export interface SchedulerWorkerMessage {
  groupsData: ScheduleEngineGroupData[];
  classroomsCache: ScheduleEngineClassroomMap;
  availableClassrooms: string[];
  maxMorningSlots: number;
  maxAfternoonSlots: number;
  slotDuration: number;
  lockedAssignments?: ScheduleEngineAssignment[];
}

declare const self: Worker;

self.onmessage = (event: MessageEvent<SchedulerWorkerMessage>) => {
  const {
    groupsData,
    classroomsCache,
    availableClassrooms,
    maxMorningSlots,
    maxAfternoonSlots,
    slotDuration,
    lockedAssignments = [],
  } = event.data;

  try {
    const maxSlotsPerDay = maxMorningSlots + maxAfternoonSlots;
    const orderedClassrooms = [...availableClassrooms].sort((a, b) => {
      const classroomA = classroomsCache[a];
      const classroomB = classroomsCache[b];
      return (
        (classroomA?.capacity ?? 0) - (classroomB?.capacity ?? 0) ||
        (classroomA?.type ?? '').localeCompare(classroomB?.type ?? '') ||
        a.localeCompare(b)
      );
    });
    const orderedLockedAssignments = [...lockedAssignments].sort((a, b) =>
      a.id.localeCompare(b.id)
    );

    const hardConstraints = [
      new RoomOverlapConstraint(),
      new ShiftConstraint(),
      new RoomCapacityConstraint(),
      new GroupOverlapConstraint(),
      new CourseOverlapConstraint(),
    ];

    const softConstraints = [new RoomTypeConstraint()];

    const penaltyCalculator = new PenaltyCalculator(
      hardConstraints,
      softConstraints,
      classroomsCache,
      maxMorningSlots,
      maxSlotsPerDay
    );

    const initialSolutionGen = new InitialSolution(
      penaltyCalculator,
      orderedClassrooms,
      classroomsCache,
      maxSlotsPerDay,
      maxMorningSlots,
      slotDuration,
      [1, 2, 3, 4, 5]
    );

    const solution = runMultiStartTabuSearch(
      buildSeeds(),
      (seed) =>
        new TabuSearchEngine(
          penaltyCalculator,
          initialSolutionGen,
          orderedClassrooms,
          classroomsCache,
          maxMorningSlots,
          maxSlotsPerDay,
          new LCGGenerator(seed)
        ).run(groupsData, orderedLockedAssignments)
    );

    const assignmentsMap = new Map<string, ScheduleEngineAssignment>();
    for (const assignment of solution.assignments) {
      assignment.conflicts = [];
      assignmentsMap.set(assignment.id, assignment);
    }

    if (solution.conflicts) {
      for (const conflict of solution.conflicts) {
        const target = conflict.assignmentId
          ? assignmentsMap.get(conflict.assignmentId)
          : solution.assignments.find(
              (a) => a.subjectGroupId === conflict.subjectGroupId
            );
        if (target) {
          target.conflicts!.push(conflict);
        }
      }
    }

    self.postMessage({ type: 'SUCCESS', payload: solution });
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
