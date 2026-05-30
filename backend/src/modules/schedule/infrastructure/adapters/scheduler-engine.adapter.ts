import type {
  IScheduleEngineProvider,
  ScheduleEngineGroupData,
  ScheduleEngineClassroomMap,
  ScheduleEngineSolution,
} from '../../domain/schedule-engine.provider';
import { TabuSearchEngine } from '@/modules/scheduler/application/tabu-search';
import { PenaltyCalculator } from '@/modules/scheduler/domain/penalty-calculator';
import { RoomOverlapConstraint } from '@/modules/scheduler/domain/constraints/room-overlap.constraint';
import { ShiftConstraint } from '@/modules/scheduler/domain/constraints/shift.constraint';
import { RoomCapacityConstraint } from '@/modules/scheduler/domain/constraints/room-capacity.constraint';
import { GroupOverlapConstraint } from '@/modules/scheduler/domain/constraints/group-overlap.constraint';
import { ItineraryOverlapConstraint } from '@/modules/scheduler/domain/constraints/itinerary-overlap.constraint';
import { LCGGenerator } from '@/modules/scheduler/domain/random-generator';
import { InitialSolution } from '@/modules/scheduler/domain/initial-solution';

export class SchedulerEngineAdapter implements IScheduleEngineProvider {
  runGeneration(
    groupsData: ScheduleEngineGroupData[],
    classroomsCache: ScheduleEngineClassroomMap,
    availableClassrooms: string[],
    maxMorningSlots: number,
    maxAfternoonSlots: number,
    slotDuration: number
  ): ScheduleEngineSolution {
    const maxSlotsPerDay = maxMorningSlots + maxAfternoonSlots;

    const constraints = [
      new RoomOverlapConstraint(),
      new ShiftConstraint(),
      new RoomCapacityConstraint(),
      new GroupOverlapConstraint(),
      new ItineraryOverlapConstraint(),
    ];

    const penaltyCalculator = new PenaltyCalculator(
      constraints,
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
      maxSlotsPerDay,
      randomGenerator
    );

    return tabuEngine.run(groupsData) as ScheduleEngineSolution;
  }
}
