import type { DbTransaction } from '@/core/db/transaction-runner';

export interface TimingChangeResult {
  scheduleIds: string[];
  classroomIds: string[];
  affectedUsers: { userId: string; reservationCount: number }[];
}

export interface IAcademicYearTimingChangeProvider {
  invalidateForTimingChange(
    organizationId: string,
    academicYearId: string,
    tx: DbTransaction,
    timeConfigId?: string
  ): Promise<TimingChangeResult>;
}
