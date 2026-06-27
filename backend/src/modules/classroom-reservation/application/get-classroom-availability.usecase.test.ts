import { describe, expect, test, mock } from 'bun:test';
import { GetClassroomAvailabilityUseCase } from './get-classroom-availability.usecase';
import { NotFoundError, ValidationError } from '@/core/errors/app.error';

describe('GetClassroomAvailabilityUseCase', () => {
  const repositoryMock = {
    save: mock(),
    findById: mock(),
    findReservationsInDateRange: mock(),
    findByOrganizationId: mock(),
    delete: mock(),
    update: mock(),
    findPaginated: mock(),
  };

  const scheduleProviderMock = {
    getClassroomScheduleSlots: mock(),
    isSchedulePublished: mock(),
    hasSubjectInInterval: mock(),
    areAllSchedulesPublished: mock(),
  };

  const academicYearProviderMock = {
    getAcademicYear: mock(),
    getMatchingPeriods: mock(),
  };

  const useCase = new GetClassroomAvailabilityUseCase(
    repositoryMock,
    scheduleProviderMock,
    academicYearProviderMock
  );

  test('should return availability successfully', async () => {
    academicYearProviderMock.getAcademicYear.mockResolvedValue({
      getMatchingPeriods: mock().mockReturnValue([1]),
    });

    scheduleProviderMock.getClassroomScheduleSlots.mockResolvedValue([
      {
        dayOfWeek: 3,
        period: 1,
        slotIndex: 1,
        duration: 2,
        startTimeMinutes: 600,
        endTimeMinutes: 720,
      },
    ]);

    repositoryMock.findReservationsInDateRange.mockResolvedValue([
      {
        date: '2025-01-01',
        slotIndex: 5,
        status: 'ACCEPTED',
        startTimeMinutes: 780,
        endTimeMinutes: 840,
      },
      {
        date: '2025-01-01',
        slotIndex: 6,
        status: 'PENDING',
        startTimeMinutes: 840,
        endTimeMinutes: 900,
      },
      { date: '2025-01-01', slotIndex: 7, status: 'REJECTED' },
      { date: '2025-01-01', slotIndex: 8, status: 'CANCELLED' },
    ]);

    const result = await useCase.execute('org-1', {
      classroomId: 'room-1',
      academicYearId: 'year-1',
      startDate: '2025-01-01',
      endDate: '2025-01-01',
    });

    expect(result.occupiedSlots).toHaveLength(3);
    const reasons = result.occupiedSlots.map((s) => s.reason);
    expect(reasons).toContain('Ocupado por clase');
    expect(reasons).toContain('Reservado');
    expect(reasons).toContain('Reserva pendiente');
    expect(result.occupiedSlots[0]).toMatchObject({
      startTimeMinutes: 600,
      endTimeMinutes: 720,
    });
  });

  test('should throw NotFoundError if academic year not found', async () => {
    academicYearProviderMock.getAcademicYear.mockResolvedValue(null);

    expect(
      useCase.execute('org-1', {
        classroomId: 'room-1',
        academicYearId: 'year-1',
        startDate: '2025-01-01',
        endDate: '2025-01-02',
      })
    ).rejects.toThrow(NotFoundError);
  });

  test('should throw ValidationError if startDate > endDate', async () => {
    academicYearProviderMock.getAcademicYear.mockResolvedValue({
      getMatchingPeriods: mock().mockReturnValue([1]),
    });
    expect(
      useCase.execute('org-1', {
        classroomId: 'room-1',
        academicYearId: 'year-1',
        startDate: '2025-01-02',
        endDate: '2025-01-01',
      })
    ).rejects.toThrow(ValidationError);
  });
});
