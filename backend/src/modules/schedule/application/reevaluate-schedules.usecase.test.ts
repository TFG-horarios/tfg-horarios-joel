import { describe, expect, mock, test } from 'bun:test';
import type { DbTransaction } from '@/core/db/transaction-runner';
import { ReevaluateSchedulesUseCase } from './reevaluate-schedules.usecase';

describe('ReevaluateSchedulesUseCase', () => {
  test('should recalculate conflict and unassigned metrics in given transaction', async () => {
    const tx = { id: 'tx' };
    const scheduleRepositoryMock = {
      updateSchedulesMetrics: mock(),
      findById: mock(),
      findByScope: mock(),
      findDistinctAcademicYears: mock(),
      findAll: mock(),
      findPaginated: mock(),
      create: mock(),
      update: mock(),
      createSchedulesWithSlots: mock(),
      findLockedAssignments: mock(),
      delete: mock(),
      findScheduleIssueData: mock().mockResolvedValue([
        {
          scheduleId: 'schedule-1',
          classroomId: null,
          dayOfWeek: null,
          slotIndex: null,
          conflicts: [],
        },
        {
          scheduleId: 'schedule-1',
          classroomId: 'c1',
          dayOfWeek: 1,
          slotIndex: 1,
          conflicts: [{ type: 'OVERLAP' }],
        },
      ]),
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
      scheduleRepositoryMock,
      issueProvider
    );

    await useCase.execute(
      ['schedule-1', 'schedule-1'],
      'organization-1',
      tx as unknown as DbTransaction
    );

    expect(scheduleRepositoryMock.findScheduleIssueData).toHaveBeenCalledWith(
      ['schedule-1'],
      'organization-1',
      tx
    );
    expect(scheduleRepositoryMock.updateSchedulesMetrics).toHaveBeenCalledWith(
      [{ scheduleId: 'schedule-1', conflicts: 1, unassigned: 1 }],
      'organization-1',
      tx
    );
  });
});
