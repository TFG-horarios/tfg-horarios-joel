import { describe, expect, test, mock } from 'bun:test';
import { CreateItineraryUseCase } from './create-itinerary.usecase';
import { ForbiddenError } from '@/core/errors/app.error';

describe('CreateItineraryUseCase', () => {
  const repositoryMock = {
    findById: mock(),
    findAll: mock(),
    create: mock(),
    createMany: mock(),
    update: mock(),
    delete: mock(),
    deleteAll: mock(),
    replace: mock(),
  };

  const memberProviderMock = {
    getMemberRole: mock(),
  };

  const useCase = new CreateItineraryUseCase(
    repositoryMock,
    memberProviderMock
  );

  test('should create an itinerary successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    const dto = { name: 'Software Eng', code: 'SE' };
    const result = await useCase.execute('org-1', 'deg-1', 'user-1', dto);
    expect(result.name).toBe('Software Eng');
    expect(repositoryMock.create).toHaveBeenCalled();
  });

  test('should throw ForbiddenError if user lacks permission', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    const dto = { name: 'Software Eng', code: 'SE' };
    expect(useCase.execute('org-1', 'deg-1', 'user-1', dto)).rejects.toThrow(
      ForbiddenError
    );
  });
});
