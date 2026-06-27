import { describe, expect, test, mock } from 'bun:test';
import { CancelClassroomReservationUseCase } from './cancel-classroom-reservation.usecase';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';
import { ClassroomReservation } from '../domain/classroom-reservation.entity';

describe('CancelClassroomReservationUseCase', () => {
  const repositoryMock = {
    save: mock(),
    findById: mock(),
    findReservationsInDateRange: mock(),
    findByOrganizationId: mock(),
    delete: mock(),
    update: mock(),
    findPaginated: mock(),
  };

  const memberProviderMock = {
    getMemberRole: mock(),
  };

  const useCase = new CancelClassroomReservationUseCase(
    repositoryMock,
    memberProviderMock
  );

  test('should cancel reservation successfully if user is requester', async () => {
    const reservation = ClassroomReservation.create({
      organizationId: 'org-1',
      requesterUserId: 'user-1',
      classroomId: 'room-1',
      academicYearId: 'year-1',
      date: '2025-01-01',
      slotIndex: 1,
      status: 'PENDING',
      reason: 'Meeting',
    });
    repositoryMock.findById.mockResolvedValue(reservation);
    repositoryMock.update.mockResolvedValue(undefined);

    const result = await useCase.execute('org-1', 'user-1', reservation.id);

    expect(result.status).toBe('CANCELLED');
    expect(repositoryMock.update).toHaveBeenCalled();
  });

  test('should cancel reservation successfully if user is not requester but has permission', async () => {
    const reservation = ClassroomReservation.create({
      organizationId: 'org-1',
      requesterUserId: 'user-2',
      classroomId: 'room-1',
      academicYearId: 'year-1',
      date: '2025-01-01',
      slotIndex: 1,
      status: 'PENDING',
      reason: 'Meeting',
    });
    repositoryMock.findById.mockResolvedValue(reservation);
    memberProviderMock.getMemberRole.mockResolvedValue('admin');
    repositoryMock.update.mockResolvedValue(undefined);

    const result = await useCase.execute('org-1', 'user-1', reservation.id);

    expect(result.status).toBe('CANCELLED');
    expect(repositoryMock.update).toHaveBeenCalled();
  });

  test('should throw ForbiddenError if user is not requester and lacks permission', async () => {
    const reservation = ClassroomReservation.create({
      organizationId: 'org-1',
      requesterUserId: 'user-2',
      classroomId: 'room-1',
      academicYearId: 'year-1',
      date: '2025-01-01',
      slotIndex: 1,
      status: 'PENDING',
      reason: 'Meeting',
    });
    repositoryMock.findById.mockResolvedValue(reservation);
    memberProviderMock.getMemberRole.mockResolvedValue('viewer');

    expect(useCase.execute('org-1', 'user-1', reservation.id)).rejects.toThrow(
      ForbiddenError
    );
  });

  test('should throw NotFoundError if reservation does not exist', async () => {
    repositoryMock.findById.mockResolvedValue(null);

    expect(useCase.execute('org-1', 'user-1', 'res-1')).rejects.toThrow(
      NotFoundError
    );
  });

  test('should throw NotFoundError if reservation belongs to another organization', async () => {
    const reservation = ClassroomReservation.create({
      organizationId: 'org-2',
      requesterUserId: 'user-1',
      classroomId: 'room-1',
      academicYearId: 'year-1',
      date: '2025-01-01',
      slotIndex: 1,
      status: 'PENDING',
      reason: 'Meeting',
    });
    repositoryMock.findById.mockResolvedValue(reservation);

    expect(useCase.execute('org-1', 'user-1', reservation.id)).rejects.toThrow(
      NotFoundError
    );
  });
});
