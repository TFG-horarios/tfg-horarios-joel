import type { ScheduleTimeConfigTimingChangeResult } from './schedule-time-config-timing-change.provider';

export interface IScheduleTimeConfigTimingChangeNotifierProvider {
  notifyTimingChange(
    organizationId: string,
    invalidation: ScheduleTimeConfigTimingChangeResult
  ): Promise<void>;
}
