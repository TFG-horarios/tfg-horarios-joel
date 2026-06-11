import { describe, expect, test, mock, beforeEach } from 'bun:test';
import { UpdateClassroomReservationStatusUseCase } from './update-classroom-reservation-status.usecase';
import type { IClassroomReservationRepository } from '../domain/classroom-reservation.repository';
import type { IClassroomReservationScheduleProvider } from '../domain/classroom-reservation-schedule.provider';
import type { IClassroomReservationMemberProvider } from '../domain/classroom-reservation-member.provider';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@/core/errors/app.error';
import { ClassroomReservation } from '../domain/classroom-reservation.entity';
import { AcademicYear } from '@/modules/academic-year/domain/academic-year.entity';

describe('UpdateClassroomReservationStatusUseCase', () => {
  const repositoryMock = {
    findById: mock(),
    update: mock(),
  } as unknown as IClassroomReservationRepository;

  const scheduleProviderMock = {
    hasSubjectInSlot: mock(),
  } as unknown as IClassroomReservationScheduleProvider;

  const memberProviderMock = {
    getMemberRole: mock(),
  } as unknown as IClassroomReservationMemberProvider;

  const academicYearRepositoryMock = {
    findById: mock(),
  } as any;

  const useCase = new UpdateClassroomReservationStatusUseCase(
    repositoryMock,
    scheduleProviderMock,
    memberProviderMock,
    academicYearRepositoryMock
  );

  beforeEach(() => {
    (repositoryMock.findById as any).mockReset();
    (repositoryMock.update as any).mockReset();
    (scheduleProviderMock.hasSubjectInSlot as any).mockReset();
    (memberProviderMock.getMemberRole as any).mockReset();
    academicYearRepositoryMock.findById.mockReset();
  });

  const baseReservation = ClassroomReservation.create({
    organizationId: 'org-1',
    requesterUserId: 'user-1',
    classroomId: 'classroom-1',
    academicYearId: 'ay-1',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0] as string,
    slotIndex: 2,
    reason: 'Test',
  });

  const expiredReservation = ClassroomReservation.create({
    organizationId: 'org-1',
    requesterUserId: 'user-1',
    classroomId: 'classroom-1',
    academicYearId: 'ay-1',
    date: '2000-01-01',
    slotIndex: 2,
    reason: 'Test',
  });

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
    period3Start: null,
    period3End: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  test('should throw ForbiddenError if user does not have permission', async () => {
    (memberProviderMock.getMemberRole as any).mockResolvedValue('viewer');

    await expect(
      useCase.execute('org-1', 'user-2', 'res-1', { status: 'ACCEPTED' })
    ).rejects.toThrow(ForbiddenError);
  });

  test('should throw NotFoundError if reservation not found or belongs to other org', async () => {
    (memberProviderMock.getMemberRole as any).mockResolvedValue('editor');
    (repositoryMock.findById as any).mockResolvedValue(null);

    await expect(
      useCase.execute('org-1', 'user-2', 'res-1', { status: 'ACCEPTED' })
    ).rejects.toThrow(NotFoundError);

    const otherOrgReservation = ClassroomReservation.create({
      organizationId: 'other-org',
      requesterUserId: 'user-1',
      classroomId: 'classroom-1',
      academicYearId: 'ay-1',
      date: new Date(Date.now() + 86400000)
        .toISOString()
        .split('T')[0] as string,
      slotIndex: 2,
      reason: 'Test',
    });
    (repositoryMock.findById as any).mockResolvedValue(otherOrgReservation);

    await expect(
      useCase.execute('org-1', 'user-2', 'res-1', { status: 'ACCEPTED' })
    ).rejects.toThrow(NotFoundError);
  });

  test('should throw ValidationError when accepting an expired reservation', async () => {
    (memberProviderMock.getMemberRole as any).mockResolvedValue('editor');
    (repositoryMock.findById as any).mockResolvedValue(expiredReservation);

    await expect(
      useCase.execute('org-1', 'user-2', 'res-1', { status: 'ACCEPTED' })
    ).rejects.toThrow(ValidationError);
  });

  test('should throw ValidationError when accepting if subject occupies slot', async () => {
    (memberProviderMock.getMemberRole as any).mockResolvedValue('editor');
    (repositoryMock.findById as any).mockResolvedValue(baseReservation);
    academicYearRepositoryMock.findById.mockResolvedValue(dummyAcademicYear);
    (scheduleProviderMock.hasSubjectInSlot as any).mockResolvedValue(true);

    await expect(
      useCase.execute('org-1', 'user-2', 'res-1', { status: 'ACCEPTED' })
    ).rejects.toThrow(ValidationError);
  });

  test('should successfully accept reservation', async () => {
    (memberProviderMock.getMemberRole as any).mockResolvedValue('editor');
    (repositoryMock.findById as any).mockResolvedValue(baseReservation);
    academicYearRepositoryMock.findById.mockResolvedValue(dummyAcademicYear);
    (scheduleProviderMock.hasSubjectInSlot as any).mockResolvedValue(false);

    const result = await useCase.execute('org-1', 'user-2', 'res-1', {
      status: 'ACCEPTED',
    });

    expect(result.status).toBe('ACCEPTED');
    expect(repositoryMock.update).toHaveBeenCalledTimes(1);
  });

  test('should successfully reject reservation without checking slot occupancy', async () => {
    (memberProviderMock.getMemberRole as any).mockResolvedValue('editor');
    (repositoryMock.findById as any).mockResolvedValue(baseReservation);

    const result = await useCase.execute('org-1', 'user-2', 'res-1', {
      status: 'REJECTED',
    });

    expect(result.status).toBe('REJECTED');
    expect(scheduleProviderMock.hasSubjectInSlot).not.toHaveBeenCalled();
    expect(repositoryMock.update).toHaveBeenCalledTimes(1);
  });
});
