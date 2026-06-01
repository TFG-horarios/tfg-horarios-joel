import { describe, expect, test, mock } from 'bun:test';
import { GetOrganizationUseCase } from './get-organization.usecase';
import { Organization } from '../domain/organization.entity';
import { ForbiddenError, NotFoundError } from '@/core/errors/app.error';

describe('GetOrganizationUseCase', () => {
  const repositoryMock = {
    findByUserId: mock(),
    findById: mock(),
    create: mock(),
    delete: mock(),
    update: mock(),
  };

  const memberProviderMock = {
    getMemberRole: mock(),
  };

  const useCase = new GetOrganizationUseCase(
    repositoryMock,
    memberProviderMock
  );

  test('should retrieve organization successfully', async () => {
    const org = Organization.reconstitute({
      id: 'org-1',
      name: 'Test Org',
      periodType: 'semester',
      morningStart: '08:00',
      morningEnd: '14:00',
      afternoonStart: '15:00',
      afternoonEnd: '21:00',
      slotDurationMinutes: 60,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    repositoryMock.findById.mockResolvedValueOnce(org);
    memberProviderMock.getMemberRole.mockResolvedValueOnce('viewer');
    const result = await useCase.execute('org-1', 'user-1');
    expect(result.id).toBe('org-1');
  });

  test('should throw NotFoundError if organization does not exist', async () => {
    repositoryMock.findById.mockResolvedValueOnce(null);
    expect(useCase.execute('org-1', 'user-1')).rejects.toThrow(NotFoundError);
  });

  test('should throw ForbiddenError if user has no access', async () => {
    repositoryMock.findById.mockResolvedValueOnce({ id: 'org-1' });
    memberProviderMock.getMemberRole.mockResolvedValueOnce(null);
    expect(useCase.execute('org-1', 'user-1')).rejects.toThrow(ForbiddenError);
  });
});
