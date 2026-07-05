import { describe, expect, test, mock } from 'bun:test';
import { ImportSchedulesUseCase } from './import-schedules.usecase';
import { ForbiddenError } from '@/core/errors/app.error';

describe('ImportSchedulesUseCase', () => {
  const importProviderMock = {
    checkOverwrite: mock(),
    importSchedules: mock(),
  };
  const memberProviderMock = { getMemberRole: mock() };
  const useCase = new ImportSchedulesUseCase(
    importProviderMock,
    memberProviderMock
  );

  const input = {
    sourceAcademicYearId: '123e4567-e89b-12d3-a456-426614174000',
    targetAcademicYearId: '123e4567-e89b-12d3-a456-426614174001',
  };

  test('should import schedules successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');

    const importResult = {
      schedules: [],
      timeConfigs: [],
    };
    importProviderMock.importSchedules.mockResolvedValueOnce(importResult);

    const result = await useCase.execute('org-1', 'user-1', input);

    expect(result).toEqual(importResult);
    expect(importProviderMock.importSchedules).toHaveBeenCalledWith(
      'org-1',
      input
    );
  });

  test('should throw ForbiddenError if user lacks access', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    expect(useCase.execute('org-1', 'user-1', input)).rejects.toThrow(
      ForbiddenError
    );
  });
});
