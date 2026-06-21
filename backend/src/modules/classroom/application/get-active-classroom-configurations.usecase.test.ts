import { describe, expect, test, mock } from 'bun:test';
import { GetActiveClassroomConfigurationsUseCase } from './get-active-classroom-configurations.usecase';
import { ForbiddenError } from '@/core/errors/app.error';

describe('GetActiveClassroomConfigurationsUseCase', () => {
  const scheduleSlotProviderMock = {
    findActiveClassroomConfigurationsPaginated: mock(),
    findUniqueSlotsByClassroomIdAndFilters: mock(),
  };

  const memberProviderMock = {
    getMemberRole: mock(),
  };

  const useCase = new GetActiveClassroomConfigurationsUseCase(
    scheduleSlotProviderMock,
    memberProviderMock
  );

  test('should return configurations', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue('admin');
    scheduleSlotProviderMock.findActiveClassroomConfigurationsPaginated.mockResolvedValue(
      { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } }
    );

    const result = await useCase.execute('org-1', 'user-1', {});
    expect(result).toEqual({
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
    });
    expect(
      scheduleSlotProviderMock.findActiveClassroomConfigurationsPaginated
    ).toHaveBeenCalledWith('org-1', {});
  });

  test('should throw ForbiddenError if no role', async () => {
    memberProviderMock.getMemberRole.mockResolvedValue(null);
    expect(useCase.execute('org-1', 'user-1', {})).rejects.toThrow(
      ForbiddenError
    );
  });
});
