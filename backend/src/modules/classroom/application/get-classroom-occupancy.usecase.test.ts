import { describe, expect, test, mock } from 'bun:test';
import { GetClassroomOccupancyUseCase } from './get-classroom-occupancy.usecase';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';

describe('GetClassroomOccupancyUseCase', () => {
  const occupancyProviderMock = { findOccupancySchedules: mock() };
  const classroomRepositoryMock = {
    findById: mock(),
    findAll: mock(),
    findPaginated: mock(),
    findIdentifiers: mock(),
    create: mock(),
    createMany: mock(),
    update: mock(),
    delete: mock(),
    deleteAll: mock(),
    replace: mock(),
  };
  const memberProviderMock = { getMemberRole: mock() };
  const academicYearProviderMock = { shouldIncludeSoftDeleted: mock() };

  const useCase = new GetClassroomOccupancyUseCase(
    occupancyProviderMock,
    classroomRepositoryMock,
    memberProviderMock,
    academicYearProviderMock
  );

  test('should return classroom occupancy events correctly', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    academicYearProviderMock.shouldIncludeSoftDeleted.mockResolvedValueOnce(
      false
    );

    classroomRepositoryMock.findById.mockResolvedValueOnce({ id: 'room-1' });

    occupancyProviderMock.findOccupancySchedules.mockResolvedValueOnce([
      {
        id: 'sch-1',
        period: 1,
        shift: 'morning',
        academicYear: { slotDurationMinutes: 60, breakDurationMinutes: 30 },
        timeConfig: {
          startTime: '08:00',
          endTime: '14:30',
          hasBreak: true,
          breakAfterSlot: 3,
        },
        slots: [
          {
            id: 'slot-1',
            classroomId: 'room-1',
            subjectGroupId: 'sg-1',
            dayOfWeek: 1,
            slotIndex: 0,
            duration: 2,
          },
          {
            id: 'slot-ignored-diff-room',
            classroomId: 'room-2',
            subjectGroupId: 'sg-2',
            dayOfWeek: 1,
            slotIndex: 2,
            duration: 1,
          },
        ],
      },
    ]);

    const result = await useCase.execute('org-1', 'room-1', 'user-1', {
      academicYearId: 'ay-1',
    });

    expect(result.length).toBe(1);
    expect(result[0]).toMatchObject({
      id: 'slot-1',
      type: 'class',
      classroomId: 'room-1',
      scheduleId: 'sch-1',
      subjectGroupId: 'sg-1',
      dayOfWeek: 1,
      slotIndex: 0,
      duration: 2,
      period: 1,
      shift: 'morning',
      startTimeMinutes: 480,
      endTimeMinutes: 600,
    });
  });

  test('should throw ForbiddenError if user lacks access', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce(null);
    expect(useCase.execute('org-1', 'room-1', 'user-1')).rejects.toThrow(
      ForbiddenError
    );
  });

  test('should throw NotFoundError if classroom not found', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    classroomRepositoryMock.findById.mockResolvedValueOnce(null);
    expect(useCase.execute('org-1', 'room-1', 'user-1')).rejects.toThrow(
      NotFoundError
    );
  });
});
