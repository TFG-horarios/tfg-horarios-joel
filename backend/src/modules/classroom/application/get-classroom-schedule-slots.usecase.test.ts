import { describe, expect, test, mock } from 'bun:test';
import { GetClassroomScheduleSlotsUseCase } from './get-classroom-schedule-slots.usecase';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';

describe('GetClassroomScheduleSlotsUseCase', () => {
  const repositoryMock = {
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

  const scheduleSlotProviderMock = {
    findActiveClassroomConfigurationsPaginated: mock(),
    findUniqueSlotsByClassroomIdAndFilters: mock(),
  };

  const memberProviderMock = {
    getMemberRole: mock(),
  };

  const academicYearProviderMock = {
    shouldIncludeSoftDeleted: mock(),
  };

  const useCase = new GetClassroomScheduleSlotsUseCase(
    scheduleSlotProviderMock,
    repositoryMock,
    memberProviderMock,
    academicYearProviderMock
  );

  test('should return slots', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('viewer');
    academicYearProviderMock.shouldIncludeSoftDeleted.mockResolvedValue(false);
    repositoryMock.findById.mockResolvedValue({ id: 'room-1' });
    scheduleSlotProviderMock.findUniqueSlotsByClassroomIdAndFilters.mockResolvedValue(
      []
    );

    const result = await useCase.execute('org-1', 'room-1', 'user-1', {});
    expect(result).toEqual([]);
    expect(
      scheduleSlotProviderMock.findUniqueSlotsByClassroomIdAndFilters
    ).toHaveBeenCalledWith('room-1', 'org-1', {});
  });

  test('should include soft-deleted classroom for historic academic year', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('viewer');
    academicYearProviderMock.shouldIncludeSoftDeleted.mockResolvedValue(true);
    repositoryMock.findById.mockResolvedValue({
      id: 'room-1',
      deletedAt: new Date(),
    });
    scheduleSlotProviderMock.findUniqueSlotsByClassroomIdAndFilters.mockResolvedValue(
      []
    );

    const filters = { academicYearId: crypto.randomUUID() };
    await useCase.execute('org-1', 'room-1', 'user-1', filters);

    expect(
      academicYearProviderMock.shouldIncludeSoftDeleted
    ).toHaveBeenCalledWith(filters.academicYearId);
    expect(repositoryMock.findById).toHaveBeenCalledWith(
      'room-1',
      'org-1',
      true
    );
  });

  test('should throw NotFoundError if classroom not found', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('viewer');
    repositoryMock.findById.mockResolvedValue(null);

    expect(useCase.execute('org-1', 'room-1', 'user-1', {})).rejects.toThrow(
      NotFoundError
    );
  });

  test('should throw ForbiddenError if no role', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue(null);
    expect(useCase.execute('org-1', 'room-1', 'user-1', {})).rejects.toThrow(
      ForbiddenError
    );
  });
});
