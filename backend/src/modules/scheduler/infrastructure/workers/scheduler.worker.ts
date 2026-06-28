import { TabuSearchEngine } from '../../application/tabu-search';
import { PenaltyCalculator } from '../../domain/penalty-calculator';
import { RoomTypeConstraint } from '../../domain/constraints/soft/room-type.constraint';
import { LowerFloorConstraint } from '../../domain/constraints/soft/lower-floor.constraint';
import { ClassroomConsolidationConstraint } from '../../domain/constraints/soft/classroom-consolidation.constraint';
import { StudentGapsConstraint } from '../../domain/constraints/soft/student-gaps.constraint';
import { GroupTypeOrderConstraint } from '../../domain/constraints/soft/group-type-order.constraint';
import { SubjectDailyDispersionConstraint } from '../../domain/constraints/soft/subject-daily-dispersion.constraint';
import { OverlapDistributionConstraint } from '../../domain/constraints/soft/overlap-distribution.constraint';
import { RoomOverlapConstraint } from '../../domain/constraints/hard/room-overlap.constraint';
import { ShiftConstraint } from '../../domain/constraints/hard/shift.constraint';
import { RoomCapacityConstraint } from '../../domain/constraints/hard/room-capacity.constraint';
import { GroupOverlapConstraint } from '../../domain/constraints/hard/group-overlap.constraint';
import { CourseOverlapConstraint } from '../../domain/constraints/hard/course-overlap.constraint';
import { ComputerLabConstraint } from '../../domain/constraints/hard/computer-lab.constraint';
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
} from '@/modules/schedule/domain/providers/schedule-engine.provider';
import type { Optimization, ScheduleTimeGrid } from '@tfg-horarios/shared';

export interface SchedulerWorkerMessage {
  groupsData: ScheduleEngineGroupData[];
  classroomsCache: ScheduleEngineClassroomMap;
  availableClassrooms: string[];
  timeGrids: Record<string, ScheduleTimeGrid>;
  slotDuration: number;
  lockedAssignments?: ScheduleEngineAssignment[];
  optimizations?: Optimization[];
}

declare const self: Worker;

self.onmessage = (event: MessageEvent<SchedulerWorkerMessage>) => {
  const {
    groupsData,
    classroomsCache,
    availableClassrooms,
    timeGrids,
    slotDuration,
    lockedAssignments = [],
    optimizations,
  } = event.data;

  try {
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
      new ComputerLabConstraint(),
      new GroupOverlapConstraint(),
      new CourseOverlapConstraint(),
    ];

    const softConstraints = [];
    if (!optimizations || optimizations.includes('roomType')) {
      softConstraints.push(new RoomTypeConstraint());
    }
    if (!optimizations || optimizations.includes('lowerFloor')) {
      softConstraints.push(new LowerFloorConstraint());
    }
    if (!optimizations || optimizations.includes('classroomConsolidation')) {
      softConstraints.push(new ClassroomConsolidationConstraint());
    }
    if (!optimizations || optimizations.includes('studentGaps')) {
      softConstraints.push(new StudentGapsConstraint());
    }
    if (!optimizations || optimizations.includes('groupTypeOrder')) {
      softConstraints.push(new GroupTypeOrderConstraint());
    }
    if (!optimizations || optimizations.includes('subjectDailyDispersion')) {
      softConstraints.push(new SubjectDailyDispersionConstraint());
    }
    if (!optimizations || optimizations.includes('overlapDistribution')) {
      softConstraints.push(new OverlapDistributionConstraint());
    }

    const penaltyCalculator = new PenaltyCalculator(
      hardConstraints,
      softConstraints,
      classroomsCache,
      timeGrids
    );

    const initialSolutionGen = new InitialSolution(
      penaltyCalculator,
      orderedClassrooms,
      classroomsCache,
      timeGrids,
      undefined,
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
          timeGrids,
          new LCGGenerator(seed)
        ),
      groupsData,
      orderedLockedAssignments,
      { enableSoftPhase: softConstraints.length > 0 }
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
