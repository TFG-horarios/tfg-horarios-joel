import { describe, expect, test, mock } from 'bun:test';
import { UpdateItineraryUseCase } from './update-itinerary.usecase';
import { Itinerary } from '../domain/itinerary.entity';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';

describe('UpdateItineraryUseCase', () => {
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

  const useCase = new UpdateItineraryUseCase(
    repositoryMock,
    memberProviderMock
  );

  test('should update itinerary successfully', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    const itinerary = Itinerary.reconstitute({
      id: 'iti-1',
      organizationId: 'org-1',
      degreeId: 'deg-1',
      name: 'Old Name',
      code: 'ON',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    repositoryMock.findById.mockResolvedValueOnce(itinerary);
    const dto = { name: 'New Name', code: 'nn' };
    const result = await useCase.execute('org-1', 'iti-1', 'user-1', dto);
    expect(result.name).toBe('New Name');
    expect(result.code).toBe('NN');
    expect(repositoryMock.update).toHaveBeenCalledWith(itinerary);
  });

  test('should throw NotFoundError if itinerary does not exist', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('admin');
    repositoryMock.findById.mockResolvedValueOnce(null);
    const dto = { name: 'New Name', code: 'NN' };
    expect(useCase.execute('org-1', 'iti-1', 'user-1', dto)).rejects.toThrow(
      NotFoundError
    );
  });

  test('should throw ForbiddenError if user lacks permission', async () => {
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    const dto = { name: 'New Name', code: 'NN' };
    expect(useCase.execute('org-1', 'iti-1', 'user-1', dto)).rejects.toThrow(
      ForbiddenError
    );
  });
});
