import { describe, expect, test, mock, beforeEach } from 'bun:test';
import { UpdateClassroomReservationStatusUseCase } from './update-classroom-reservation-status.usecase';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@/core/errors/app.error';
import { ClassroomReservation } from '../domain/classroom-reservation.entity';

describe('UpdateClassroomReservationStatusUseCase', () => {
  const repositoryMock = {
    findPaginated: mock(),
    findById: mock(),
    save: mock(),
    update: mock(),
    hasAcceptedFutureReservation: mock(),
    hasAcceptedReservationOnDate: mock(),
    findReservationsInDateRange: mock(),
    delete: mock(),
  };

  const scheduleProviderMock = {
    areAllSchedulesPublished: mock(),
    hasSubjectInSlot: mock(),
    getClassroomScheduleSlots: mock(),
  };

  const memberProviderMock = {
    getMemberRole: mock(),
  };

  const academicYearProviderMock = {
    getMatchingPeriods: mock(),
    getAcademicYear: mock(),
  };

  const notificationProviderMock = {
    notifyReservationRequested: mock(),
    notifyReservationStatusChanged: mock(),
  };

  const useCase = new UpdateClassroomReservationStatusUseCase(
    repositoryMock,
    scheduleProviderMock,
    memberProviderMock,
    academicYearProviderMock,
    notificationProviderMock
  );

  beforeEach(() => {
    repositoryMock.findById.mockReset();
    repositoryMock.update.mockReset();
    repositoryMock.hasAcceptedReservationOnDate.mockReset();
    repositoryMock.findReservationsInDateRange.mockReset();
    scheduleProviderMock.hasSubjectInSlot.mockReset();
    memberProviderMock.getMemberRole.mockReset();
    academicYearProviderMock.getMatchingPeriods.mockReset();
    notificationProviderMock.notifyReservationRequested.mockReset();
    notificationProviderMock.notifyReservationStatusChanged.mockReset();
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

  test('should throw ForbiddenError if user does not have permission', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('viewer');
    await expect(
      useCase.execute('org-1', 'user-2', 'res-1', { status: 'ACCEPTED' })
    ).rejects.toThrow(ForbiddenError);
  });

  test('should throw NotFoundError if reservation not found or belongs to other org', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('editor');
    repositoryMock.findById.mockResolvedValue(null);
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
    repositoryMock.findById.mockResolvedValue(otherOrgReservation);
    await expect(
      useCase.execute('org-1', 'user-2', 'res-1', { status: 'ACCEPTED' })
    ).rejects.toThrow(NotFoundError);
  });

  test('should throw ValidationError when accepting an expired reservation', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('editor');
    repositoryMock.findById.mockResolvedValue(expiredReservation);
    await expect(
      useCase.execute('org-1', 'user-2', 'res-1', { status: 'ACCEPTED' })
    ).rejects.toThrow(ValidationError);
  });

  test('should throw ValidationError when accepting if subject occupies slot', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('editor');
    repositoryMock.findById.mockResolvedValue(baseReservation);
    academicYearProviderMock.getMatchingPeriods.mockResolvedValue([1]);
    scheduleProviderMock.hasSubjectInSlot.mockResolvedValue(true);
    await expect(
      useCase.execute('org-1', 'user-2', 'res-1', { status: 'ACCEPTED' })
    ).rejects.toThrow(ValidationError);
  });

  test('should successfully accept reservation', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('editor');
    repositoryMock.findById.mockResolvedValue(baseReservation);
    repositoryMock.hasAcceptedReservationOnDate.mockResolvedValue(false);
    academicYearProviderMock.getMatchingPeriods.mockResolvedValue([1]);
    scheduleProviderMock.hasSubjectInSlot.mockResolvedValue(false);
    const result = await useCase.execute('org-1', 'user-2', 'res-1', {
      status: 'ACCEPTED',
    });
    expect(result.status).toBe('ACCEPTED');
    expect(repositoryMock.update).toHaveBeenCalledTimes(1);
  });

  test('should successfully reject reservation without checking slot occupancy', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('editor');
    repositoryMock.findById.mockResolvedValue(baseReservation);
    const result = await useCase.execute('org-1', 'user-2', 'res-1', {
      status: 'REJECTED',
    });
    expect(result.status).toBe('REJECTED');
    expect(scheduleProviderMock.hasSubjectInSlot).not.toHaveBeenCalled();
    expect(repositoryMock.update).toHaveBeenCalledTimes(1);
  });
});
