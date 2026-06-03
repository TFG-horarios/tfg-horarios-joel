import { describe, expect, test, mock } from 'bun:test';
import { AddMemberUseCase } from './add-member.usecase';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@/core/errors/app.error';
import { ROLES } from '@/core/permissions/roles';

describe('AddMemberUseCase', () => {
  const repositoryMock = {
    findById: mock(),
    findByUserAndOrg: mock(),
    findByOrganizationId: mock(),
    findPaginated: mock(),
    create: mock(),
    update: mock(),
    delete: mock(),
    countAdmins: mock(),
  };

  const userProviderMock = {
    getUserByEmail: mock(),
  };

  const useCase = new AddMemberUseCase(repositoryMock, userProviderMock);

  test('should add member successfully', async () => {
    repositoryMock.findByUserAndOrg.mockResolvedValueOnce({
      role: ROLES.ADMIN,
    });
    userProviderMock.getUserByEmail.mockResolvedValueOnce({
      id: 'user-2',
      name: 'Test',
      email: 'test@test.com',
    });
    repositoryMock.findByUserAndOrg.mockResolvedValueOnce(null);

    const result = await useCase.execute(
      'org-1',
      'admin-1',
      'test@test.com',
      ROLES.VIEWER
    );
    expect(result.userId).toBe('user-2');
    expect(repositoryMock.create).toHaveBeenCalled();
  });

  test('should throw ForbiddenError if requester lacks permission', async () => {
    repositoryMock.findByUserAndOrg.mockResolvedValueOnce({
      role: ROLES.VIEWER,
    });
    expect(
      useCase.execute('org-1', 'viewer-1', 'test@test.com', ROLES.VIEWER)
    ).rejects.toThrow(ForbiddenError);
  });

  test('should throw NotFoundError if user not found', async () => {
    repositoryMock.findByUserAndOrg.mockResolvedValueOnce({
      role: 'admin',
    });
    userProviderMock.getUserByEmail.mockResolvedValueOnce(null);
    expect(
      useCase.execute('org-1', 'admin-1', 'test@test.com', ROLES.VIEWER)
    ).rejects.toThrow(NotFoundError);
  });

  test('should throw ValidationError if user is already a member', async () => {
    repositoryMock.findByUserAndOrg.mockResolvedValueOnce({
      role: 'admin',
    });
    userProviderMock.getUserByEmail.mockResolvedValueOnce({
      id: 'new-user-1',
    });
    repositoryMock.findByUserAndOrg.mockResolvedValueOnce({
      role: 'viewer',
    });
    expect(
      useCase.execute('org-1', 'admin-1', 'test@test.com', ROLES.VIEWER)
    ).rejects.toThrow(ValidationError);
  });
});
