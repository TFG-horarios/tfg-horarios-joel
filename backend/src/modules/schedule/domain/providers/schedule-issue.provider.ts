import type { ScheduleConflictDetailDTO } from '@tfg-horarios/shared';
import type {
  ScheduleEngineAssignment,
  ScheduleEngineClassroomMap,
} from './schedule-engine.provider';

export interface UnassignedDiagnosticInput {
  needsComputerLab: boolean;
  groupType: ScheduleEngineAssignment['groupType'];
  numberOfStudents: number;
}

export interface IScheduleIssueProvider {
  countSchedulingConflicts(conflicts: ScheduleConflictDetailDTO[]): number;
  isUnassignedPlacement(
    placement: Pick<
      ScheduleEngineAssignment,
      'classroomId' | 'dayOfWeek' | 'slotIndex'
    >
  ): boolean;
  getUnassignedDiagnostics(
    assignment: UnassignedDiagnosticInput,
    classroomsCache: ScheduleEngineClassroomMap,
    availableClassrooms: string[]
  ): Pick<ScheduleConflictDetailDTO, 'type' | 'message'>;
}
