import type { DbTransaction } from '@/core/db/transaction-runner';

export interface IScheduleProvider {
  handleSubjectsDeletion(
    subjectIds: string[],
    organizationId: string,
    activeAndFutureYearIds: string[],
    tx: DbTransaction
  ): Promise<void>;
}
