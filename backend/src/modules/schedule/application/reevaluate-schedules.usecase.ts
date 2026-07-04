import type { DbTransaction } from '@/core/db/transaction-runner';
import type { IScheduleRepository } from '../domain/schedule.repository';
import type { IScheduleIssueProvider } from '../domain/providers/schedule-issue.provider';

export class ReevaluateSchedulesUseCase {
  constructor(
    private readonly scheduleRepository: IScheduleRepository,
    private readonly issueProvider: IScheduleIssueProvider
  ) {}

  async execute(
    scheduleIds: string[],
    organizationId: string,
    tx?: DbTransaction
  ): Promise<void> {
    const uniqueIds = [...new Set(scheduleIds)];
    if (uniqueIds.length === 0) return;

    const rows = await this.scheduleRepository.findScheduleIssueData!(
      uniqueIds,
      organizationId,
      tx
    );
    const metrics = new Map(
      uniqueIds.map((scheduleId) => [
        scheduleId,
        { scheduleId, conflicts: 0, unassigned: 0 },
      ])
    );

    for (const row of rows) {
      const metric = metrics.get(row.scheduleId);
      if (!metric) continue;
      metric.conflicts += this.issueProvider.countSchedulingConflicts(
        row.conflicts
      );
      if (this.issueProvider.isUnassignedPlacement(row)) {
        metric.unassigned += 1;
      }
    }

    await this.scheduleRepository.updateSchedulesMetrics!(
      [...metrics.values()],
      organizationId,
      tx
    );
  }
}
