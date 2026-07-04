import type { ScheduleTimeConfigTimingChangeResult } from './schedule-time-config-timing-change.provider';

export interface INotificationProvider {
  notifyTimingChange(
    organizationId: string,
    invalidation: ScheduleTimeConfigTimingChangeResult
  ): Promise<void>;
}
