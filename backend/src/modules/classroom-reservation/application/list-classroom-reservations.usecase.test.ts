import { describe, expect, test, mock, beforeEach } from 'bun:test';
import { ListClassroomReservationsUseCase } from './list-classroom-reservations.usecase';
import { ForbiddenError } from '@/core/errors/app.error';

describe('ListClassroomReservationsUseCase', () => {
  const repositoryMock = {
    findPaginated: mock(),
    findById: mock(),
    save: mock(),
    update: mock(),
    hasAcceptedFutureReservation: mock(),
    hasAcceptedReservationOnDate: mock(),
    findReservationsInDateRange: mock(),
  };

  const memberProviderMock = {
    getMemberRole: mock(),
  };

  const useCase = new ListClassroomReservationsUseCase(
    repositoryMock,
    memberProviderMock
  );

  beforeEach(() => {
    repositoryMock.findPaginated.mockReset();
    memberProviderMock.getMemberRole.mockReset();
  });

  test('should throw ForbiddenError if user is not a member', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue(null);
    await expect(useCase.execute('org-1', 'user-1', {})).rejects.toThrow(
      ForbiddenError
    );
  });

  test('should pass filters to repository correctly if user is ADMIN or EDITOR', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('admin');
    repositoryMock.findPaginated.mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
    });
    const filters = { academicYearId: 'ay-1' };
    await useCase.execute('org-1', 'admin-1', filters);
    expect(repositoryMock.findPaginated).toHaveBeenCalledWith(
      'org-1',
      filters,
      undefined
    );
  });

  test('should pass requesterUserId to repository if user is VIEWER', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('viewer');
    repositoryMock.findPaginated.mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
    });
    const filters = { academicYearId: 'ay-1' };
    await useCase.execute('org-1', 'viewer-1', filters);
    expect(repositoryMock.findPaginated).toHaveBeenCalledWith(
      'org-1',
      filters,
      'viewer-1'
    );
  });

  test('should map results to DTOs', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('editor');
    const mockEntity = {
      id: 'res-1',
      organizationId: 'org-1',
      requesterUserId: 'user-1',
      classroomId: 'classroom-1',
      academicYearId: 'ay-1',
      date: '2025-01-01',
      slotIndex: 0,
      status: 'PENDING',
      reason: 'test',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    repositoryMock.findPaginated.mockResolvedValue({
      data: [mockEntity],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
    const result = await useCase.execute('org-1', 'editor-1', {});
    expect(result.data.length).toBe(1);
    expect(result.data[0]?.id).toBe('res-1');
  });
});
