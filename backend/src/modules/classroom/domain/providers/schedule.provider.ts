import type { DbTransaction } from '@/core/db/transaction-runner';

export interface IScheduleProvider {
  handleClassroomsDeletion(
    classroomIds: string[],
    organizationId: string,
    activeAndFutureYearIds: string[],
    tx: DbTransaction
  ): Promise<void>;
}
