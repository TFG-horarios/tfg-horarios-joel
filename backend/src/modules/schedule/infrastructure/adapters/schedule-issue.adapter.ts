import {
  countSchedulingConflicts,
  isUnassignedPlacement,
} from '@/modules/schedule-slot/domain/schedule-issues';
import { getUnassignedDiagnostics } from '@/modules/schedule-slot/domain/unassigned-diagnostics';
import type { IScheduleIssueProvider } from '../../domain/providers/schedule-issue.provider';

export class ScheduleIssueAdapter implements IScheduleIssueProvider {
  countSchedulingConflicts: IScheduleIssueProvider['countSchedulingConflicts'] =
    countSchedulingConflicts;

  isUnassignedPlacement: IScheduleIssueProvider['isUnassignedPlacement'] =
    isUnassignedPlacement;

  getUnassignedDiagnostics: IScheduleIssueProvider['getUnassignedDiagnostics'] =
    getUnassignedDiagnostics;
}
