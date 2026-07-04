import type { DbTransaction } from '@/core/db/transaction-runner';

export interface ScheduleTimeConfigTimingChangeResult {
  scheduleIds: string[];
  classroomIds: string[];
  affectedUsers: { userId: string; reservationCount: number }[];
}

export interface IScheduleTimeConfigTimingChangeProvider {
  invalidateForTimingChange(
    organizationId: string,
    academicYearId: string,
    tx: DbTransaction,
    timeConfigId?: string
  ): Promise<ScheduleTimeConfigTimingChangeResult>;
}
