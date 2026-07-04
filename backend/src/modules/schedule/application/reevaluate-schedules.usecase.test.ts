import { describe, expect, mock, test } from 'bun:test';
import type { DbTransaction } from '@/core/db/transaction-runner';
import { ReevaluateSchedulesUseCase } from './reevaluate-schedules.usecase';

describe('ReevaluateSchedulesUseCase', () => {
  test('should recalculate conflict and unassigned metrics in given transaction', async () => {
    const tx = { id: 'tx' };
    const repository = {
      findScheduleIssueData: mock(async () => [
        {
          scheduleId: 'schedule-1',
          classroomId: null,
          dayOfWeek: 1,
          slotIndex: 1,
          conflicts: [
            { type: 'ROOM_OVERLAP', message: 'ERR_ROOM_OVERLAP' },
            { type: 'UNASSIGNED', message: 'ERR_UNASSIGNED' },
          ],
        },
        {
          scheduleId: 'schedule-1',
          classroomId: 'classroom-1',
          dayOfWeek: 2,
          slotIndex: 1,
          conflicts: [],
        },
      ]),
      updateSchedulesMetrics: mock(async () => undefined),
    };
    const issueProvider = {
      countSchedulingConflicts: mock(
        (conflicts: { type: string }[]) =>
          conflicts.filter(
            (conflict) => !conflict.type.startsWith('UNASSIGNED')
          ).length
      ),
      isUnassignedPlacement: mock(
        (row: {
          classroomId: string | null;
          dayOfWeek: number | null;
          slotIndex: number | null;
        }) =>
          row.classroomId === null ||
          row.dayOfWeek === null ||
          row.slotIndex === null
      ),
      getUnassignedDiagnostics: mock(() => ({
        type: 'UNASSIGNED' as const,
        message: 'ERR_UNASSIGNED',
      })),
    };
    const useCase = new ReevaluateSchedulesUseCase(
      repository as any,
      issueProvider
    );

    await useCase.execute(
      ['schedule-1', 'schedule-1'],
      'organization-1',
      tx as unknown as DbTransaction
    );

    expect(repository.findScheduleIssueData).toHaveBeenCalledWith(
      ['schedule-1'],
      'organization-1',
      tx
    );
    expect(repository.updateSchedulesMetrics).toHaveBeenCalledWith(
      [{ scheduleId: 'schedule-1', conflicts: 1, unassigned: 1 }],
      'organization-1',
      tx
    );
  });
});
