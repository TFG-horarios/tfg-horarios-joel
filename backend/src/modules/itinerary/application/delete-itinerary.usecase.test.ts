import { describe, expect, test, mock } from 'bun:test';
import { DeleteItineraryUseCase } from './delete-itinerary.usecase';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';

describe('DeleteItineraryUseCase', () => {
  const repositoryMock = {
    findById: mock(),
    findAll: mock(),
    create: mock(),
    createMany: mock(),
    update: mock(),
    delete: mock(),
  };

  const memberProviderMock = {
    getMemberRole: mock(),
  };

  const useCase = new DeleteItineraryUseCase(
    repositoryMock,
    memberProviderMock
  );

  test('should delete itinerary successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    repositoryMock.findById.mockResolvedValueOnce({ id: 'iti-1' });
    await useCase.execute('org-1', 'iti-1', 'user-1');
    expect(repositoryMock.delete).toHaveBeenCalledWith('iti-1', 'org-1');
  });

  test('should throw NotFoundError if itinerary does not exist', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    repositoryMock.findById.mockResolvedValueOnce(null);
    expect(useCase.execute('org-1', 'iti-1', 'user-1')).rejects.toThrow(
      NotFoundError
    );
  });

  test('should throw ForbiddenError if user lacks permission', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    expect(useCase.execute('org-1', 'iti-1', 'user-1')).rejects.toThrow(
      ForbiddenError
    );
  });
});
