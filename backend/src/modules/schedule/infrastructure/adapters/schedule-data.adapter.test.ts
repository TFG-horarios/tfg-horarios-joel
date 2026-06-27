import { describe, expect, test, mock, beforeEach } from 'bun:test';
import { ScheduleDataAdapter } from './schedule-data.adapter';
import { ClassroomReservation } from '@/modules/classroom-reservation/domain/classroom-reservation.entity';
import type { CreateNotificationUseCase } from '@/modules/notification/application/create-notification.usecase';

describe('ScheduleDataAdapter', () => {
  const degreeRepositoryMock = {
    findAll: mock(),
    findById: mock(),
    findPaginated: mock(),
    findIdentifiers: mock(),
    create: mock(),
    createMany: mock(),
    update: mock(),
    delete: mock(),
    deleteAll: mock(),
    replace: mock(),
  };

  const classroomRepositoryMock = {
    findAll: mock(),
    findById: mock(),
    findPaginated: mock(),
    findIdentifiers: mock(),
    create: mock(),
    createMany: mock(),
    update: mock(),
    delete: mock(),
    deleteAll: mock(),
    replace: mock(),
  };

  const subjectGroupRepositoryMock = {
    findGroupsWithSubjectsInScope: mock(),
    findById: mock(),
    findPaginated: mock(),
    findIdentifiers: mock(),
    create: mock(),
    createMany: mock(),
    update: mock(),
    delete: mock(),
    deleteAll: mock(),
    replace: mock(),
    findAll: mock(),
  };

  const academicYearRepositoryMock = {
    save: mock(),
    update: mock(),
    findById: mock(),
    findByOrganizationId: mock(),
    findActiveByOrganizationId: mock(),
    delete: mock(),
  };

  const reservationRepositoryMock = {
    findById: mock(),
    save: mock(),
    update: mock(),
    findPaginated: mock(),
    findReservationsInDateRange: mock(),
  };
  const createNotificationUseCaseMock = {
    execute: mock(),
  } as unknown as CreateNotificationUseCase;

  const adapter = new ScheduleDataAdapter(
    degreeRepositoryMock,
    classroomRepositoryMock,
    subjectGroupRepositoryMock,
    academicYearRepositoryMock,
    reservationRepositoryMock,
    createNotificationUseCaseMock
  );

  beforeEach(() => {
    mock.restore();
    reservationRepositoryMock.findReservationsInDateRange.mockClear();
    reservationRepositoryMock.update.mockClear();
  });

  test('getTargetDegreeIds should return mapped ids', async () => {
    degreeRepositoryMock.findAll.mockResolvedValue([
      { id: 'deg-1' },
      { id: 'deg-2' },
    ]);
    const result = await adapter.getTargetDegreeIds('org-1');
    expect(result).toEqual(['deg-1', 'deg-2']);
  });

  test('getAvailableClassrooms should return mapped classrooms', async () => {
    classroomRepositoryMock.findAll.mockResolvedValue([
      { id: 'room-1', capacity: 30, type: 'theory', floor: 0 },
    ]);
    const result = await adapter.getAvailableClassrooms('org-1');
    expect(result).toEqual([
      { id: 'room-1', capacity: 30, type: 'theory', floor: 0 },
    ]);
  });

  test('getGroupsInScope should return mapped groups', async () => {
    subjectGroupRepositoryMock.findGroupsWithSubjectsInScope.mockResolvedValue([
      {
        id: 'group-1',
        subjectId: 'sub-1',
        groupType: 'theory',
        isCommon: true,
        itineraryName: null,
        itineraryId: null,
        numberOfStudents: 20,
        shift: 'morning',
        weeklyHours: 2,
        degreeId: 'deg-1',
        courseYear: 1,
      },
    ]);
    const result = await adapter.getGroupsInScope('org-1', 1, ['deg-1']);
    expect(result).toHaveLength(1);
    expect(result[0]?.subjectGroupId).toBe('group-1');
  });

  test('getAcademicYearConstraints should return null if not found', async () => {
    academicYearRepositoryMock.findById.mockResolvedValue(null);
    const result = await adapter.getAcademicYearConstraints('year-1');
    expect(result).toBeNull();
  });

  test('getAcademicYearConstraints should return constraints', async () => {
    academicYearRepositoryMock.findById.mockResolvedValue({
      breakDurationMinutes: 30,
      centerOpeningTime: '08:00',
      centerClosingTime: '22:00',
      slotDurationMinutes: 60,
    });
    const result = await adapter.getAcademicYearConstraints('year-1');
    expect(result?.slotDurationMinutes).toBe(60);
  });

  test('rejectConflictingReservationsBatch should reject conflicting reservations', async () => {
    const reservation = ClassroomReservation.create({
      organizationId: 'org-1',
      requesterUserId: 'user-1',
      classroomId: 'room-1',
      academicYearId: 'year-1',
      date: '2027-01-06',
      slotIndex: 2,
      startTimeMinutes: 600,
      endTimeMinutes: 660,
      status: 'ACCEPTED',
    });

    Object.defineProperty(reservation, 'date', { get: () => '2027-01-06' });

    reservationRepositoryMock.findReservationsInDateRange.mockResolvedValue([
      reservation,
    ]);
    academicYearRepositoryMock.findById.mockResolvedValue({
      organizationId: 'org-1',
      getMatchingPeriods: () => [1],
    });

    await adapter.rejectConflictingReservationsBatch('org-1', 'year-1', [
      {
        classroomId: 'room-1',
        dayOfWeek: 3,
        slotIndex: 1,
        duration: 2,
        period: 1,
        startTimeMinutes: 630,
        endTimeMinutes: 690,
      },
    ]);

    expect(reservation.status).toBe('REJECTED');
    expect(reservationRepositoryMock.update).toHaveBeenCalledWith(reservation);
    expect(createNotificationUseCaseMock.execute).toHaveBeenCalled();
  });

  test('rejectConflictingReservationsBatch should do nothing if no slots', async () => {
    await adapter.rejectConflictingReservationsBatch('org-1', 'year-1', []);
    expect(
      reservationRepositoryMock.findReservationsInDateRange
    ).not.toHaveBeenCalled();
  });
});
