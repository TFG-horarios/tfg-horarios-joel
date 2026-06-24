import type {
  IScheduleEngineProvider,
  ScheduleEngineGroupData,
  ScheduleEngineClassroomMap,
  ScheduleEngineSolution,
  ScheduleEngineAssignment,
} from '../../domain/providers/schedule-engine.provider';
import type { Optimization } from '@tfg-horarios/shared';

export class SchedulerEngineAdapter implements IScheduleEngineProvider {
  runGeneration(
    groupsData: ScheduleEngineGroupData[],
    classroomsCache: ScheduleEngineClassroomMap,
    availableClassrooms: string[],
    maxMorningSlots: number,
    maxAfternoonSlots: number,
    slotDuration: number,
    lockedAssignments?: ScheduleEngineAssignment[],
    optimizations?: Optimization[]
  ): Promise<ScheduleEngineSolution> {
    return new Promise((resolve, reject) => {
      const workerUrl = new URL(
        '../../../scheduler/infrastructure/workers/scheduler.worker.ts',
        import.meta.url
      ).href;

      const worker = new Worker(workerUrl);

      worker.onmessage = (event) => {
        const { type, payload, error } = event.data;
        if (type === 'SUCCESS') {
          resolve(payload);
        } else {
          reject(new Error(error || 'Worker encountered an error'));
        }
        worker.terminate();
      };

      worker.onerror = (error) => {
        reject(error);
        worker.terminate();
      };

      worker.postMessage({
        groupsData,
        classroomsCache,
        availableClassrooms,
        maxMorningSlots,
        maxAfternoonSlots,
        slotDuration,
        lockedAssignments: lockedAssignments || [],
        optimizations,
      });
    });
  }
}
