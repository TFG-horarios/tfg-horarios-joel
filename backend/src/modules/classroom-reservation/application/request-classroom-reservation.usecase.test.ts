import { describe, expect, test, mock, beforeEach } from 'bun:test';
import { RequestClassroomReservationUseCase } from './request-classroom-reservation.usecase';
import type { IClassroomReservationRepository } from '../domain/classroom-reservation.repository';
import type { IClassroomReservationScheduleProvider } from '../domain/classroom-reservation-schedule.provider';
import type { IClassroomReservationMemberProvider } from '../domain/classroom-reservation-member.provider';
import {
  ForbiddenError,
  ValidationError,
  NotFoundError,
} from '@/core/errors/app.error';
import { AcademicYear } from '@/modules/academic-year/domain/academic-year.entity';

describe('RequestClassroomReservationUseCase', () => {
  const repositoryMock = {
    save: mock(),
  } as unknown as IClassroomReservationRepository;

  const scheduleProviderMock = {
    areAllSchedulesPublished: mock(),
    hasSubjectInSlot: mock(),
  } as unknown as IClassroomReservationScheduleProvider;

  const memberProviderMock = {
    getMemberRole: mock(),
  } as unknown as IClassroomReservationMemberProvider;

  const academicYearRepositoryMock = {
    findById: mock(),
  } as any;

  const useCase = new RequestClassroomReservationUseCase(
    repositoryMock,
    scheduleProviderMock,
    memberProviderMock,
    academicYearRepositoryMock
  );

  beforeEach(() => {
    (repositoryMock.save as any).mockReset();
    (scheduleProviderMock.areAllSchedulesPublished as any).mockReset();
    (scheduleProviderMock.hasSubjectInSlot as any).mockReset();
    (memberProviderMock.getMemberRole as any).mockReset();
    academicYearRepositoryMock.findById.mockReset();
  });

  const validDto = {
    classroomId: 'classroom-1',
    academicYearId: 'ay-1',
    date: '2024-11-15',
    slotIndex: 2,
    reason: 'Extra class',
  };

  const dummyAcademicYear = AcademicYear.reconstitute({
    id: 'ay-1',
    organizationId: 'org-1',
    name: '2025-2026',
    period0Start: '2025-09-01',
    period0End: '2026-06-30',
    period1Start: '2024-09-01',
    period1End: '2025-01-31',
    period2Start: null,
    period2End: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  test('should throw ForbiddenError if user is not a member', async () => {
    (memberProviderMock.getMemberRole as any).mockResolvedValue(null);

    await expect(useCase.execute('org-1', 'user-1', validDto)).rejects.toThrow(
      ForbiddenError
    );
  });

  test('should throw ValidationError if schedules are not published', async () => {
    (memberProviderMock.getMemberRole as any).mockResolvedValue('viewer');
    academicYearRepositoryMock.findById.mockResolvedValue(dummyAcademicYear);
    (scheduleProviderMock.areAllSchedulesPublished as any).mockResolvedValue(
      false
    );

    await expect(useCase.execute('org-1', 'user-1', validDto)).rejects.toThrow(
      ValidationError
    );
  });

  test('should throw ValidationError if classroom is occupied by a subject', async () => {
    (memberProviderMock.getMemberRole as any).mockResolvedValue('viewer');
    academicYearRepositoryMock.findById.mockResolvedValue(dummyAcademicYear);
    (scheduleProviderMock.areAllSchedulesPublished as any).mockResolvedValue(
      true
    );
    (scheduleProviderMock.hasSubjectInSlot as any).mockResolvedValue(true);

    await expect(useCase.execute('org-1', 'user-1', validDto)).rejects.toThrow(
      ValidationError
    );
  });

  test('should successfully create a pending reservation', async () => {
    (memberProviderMock.getMemberRole as any).mockResolvedValue('viewer');
    academicYearRepositoryMock.findById.mockResolvedValue(dummyAcademicYear);
    (scheduleProviderMock.areAllSchedulesPublished as any).mockResolvedValue(
      true
    );
    (scheduleProviderMock.hasSubjectInSlot as any).mockResolvedValue(false);

    const result = await useCase.execute('org-1', 'user-1', validDto);

    expect(result).toBeDefined();
    expect(result.status).toBe('PENDING');
    expect(result.classroomId).toBe('classroom-1');
    expect(repositoryMock.save).toHaveBeenCalledTimes(1);
  });

  test('should correctly map Date day to system day of week', async () => {
    (memberProviderMock.getMemberRole as any).mockResolvedValue('viewer');
    academicYearRepositoryMock.findById.mockResolvedValue(dummyAcademicYear);
    (scheduleProviderMock.areAllSchedulesPublished as any).mockResolvedValue(
      true
    );
    (scheduleProviderMock.hasSubjectInSlot as any).mockResolvedValue(false);

    const sundayDto = { ...validDto, date: '2024-11-17' };
    await useCase.execute('org-1', 'user-1', sundayDto);
    expect(scheduleProviderMock.hasSubjectInSlot).toHaveBeenCalledWith(
      'org-1',
      'ay-1',
      [1],
      'classroom-1',
      6,
      2
    );

    const mondayDto = { ...validDto, date: '2024-11-18' };
    await useCase.execute('org-1', 'user-1', mondayDto);
    expect(scheduleProviderMock.hasSubjectInSlot).toHaveBeenCalledWith(
      'org-1',
      'ay-1',
      [1],
      'classroom-1',
      0,
      2
    );
  });
});
