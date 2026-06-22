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
      availableClassrooms,
      classroomsCache,
      maxSlotsPerDay,
      maxMorningSlots,
      slotDuration,
      [1, 2, 3, 4, 5]
    );

    const randomGenerator = new LCGGenerator(Date.now());
    const tabuEngine = new TabuSearchEngine(
      penaltyCalculator,
      initialSolutionGen,
      availableClassrooms,
      classroomsCache,
      maxMorningSlots,
      maxSlotsPerDay,
      randomGenerator
    );

    const solution = tabuEngine.run(groupsData, lockedAssignments);

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
