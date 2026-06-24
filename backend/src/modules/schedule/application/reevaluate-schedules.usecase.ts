import {
  countSchedulingConflicts,
  isUnassignedPlacement,
} from '@/modules/schedule-slot/domain/schedule-issues';
import type { IScheduleRepository } from '../domain/schedule.repository';

export class ReevaluateSchedulesUseCase {
  constructor(private readonly scheduleRepository: IScheduleRepository) {}

  async execute(
    scheduleIds: string[],
    organizationId: string,
    tx?: any
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
      metric.conflicts += countSchedulingConflicts(row.conflicts);
      if (isUnassignedPlacement(row)) metric.unassigned += 1;
    }

    await this.scheduleRepository.updateSchedulesMetrics!(
      [...metrics.values()],
      organizationId,
      tx
    );
  }
}
