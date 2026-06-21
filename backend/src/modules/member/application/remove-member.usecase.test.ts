import { describe, expect, test, mock } from 'bun:test';
import { RemoveMemberUseCase } from './remove-member.usecase';
import { Member } from '../domain/member.entity';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@/core/errors/app.error';
import { ROLES } from '@/core/permissions/roles';

describe('RemoveMemberUseCase', () => {
  const repositoryMock = {
    findById: mock(),
    findByUserAndOrg: mock(),
    findByOrganizationId: mock(),
    create: mock(),
    update: mock(),
    delete: mock(),
    countAdmins: mock(),
    findPaginated: mock(),
    getOrganizationsWhereUserIsSoleAdmin: mock(),
    findWithUserDetailsByUserAndOrg: mock(),
  };

  const notificationProviderMock = {
    notifyRoleUpdated: mock(),
    notifyAddedToOrganization: mock(),
    notifyRemovedFromOrganization: mock(),
  };

  const useCase = new RemoveMemberUseCase(
    repositoryMock,
    notificationProviderMock
  );

  test('should remove member successfully', async () => {
    const member = Member.reconstitute({
      id: 'member-1',
      organizationId: 'org-1',
      userId: 'user-1',
      role: ROLES.VIEWER,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    repositoryMock.findById.mockResolvedValueOnce(member);
    repositoryMock.findByUserAndOrg.mockResolvedValueOnce({
      role: ROLES.ADMIN,
    });
    await useCase.execute('org-1', 'admin-1', 'member-1');
    expect(repositoryMock.delete).toHaveBeenCalledWith('member-1', 'org-1');
  });

  test('should allow self-removal', async () => {
    const member = Member.reconstitute({
      id: 'member-1',
      organizationId: 'org-1',
      userId: 'user-1',
      role: ROLES.VIEWER,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    repositoryMock.findById.mockResolvedValueOnce(member);
    repositoryMock.findByUserAndOrg.mockResolvedValueOnce({
      role: ROLES.VIEWER,
    });
    await useCase.execute('org-1', 'user-1', 'member-1');
    expect(repositoryMock.delete).toHaveBeenCalledWith('member-1', 'org-1');
  });

  test('should throw NotFoundError if member not found', async () => {
    repositoryMock.findById.mockResolvedValueOnce(null);
    expect(useCase.execute('org-1', 'admin-1', 'member-1')).rejects.toThrow(
      NotFoundError
    );
  });

  test('should throw ForbiddenError if requester lacks permission', async () => {
    const member = Member.reconstitute({
      id: 'member-1',
      organizationId: 'org-1',
      userId: 'user-1',
      role: ROLES.VIEWER,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    repositoryMock.findById.mockResolvedValueOnce(member);
    repositoryMock.findByUserAndOrg.mockResolvedValueOnce({
      role: ROLES.VIEWER,
    });
    expect(useCase.execute('org-1', 'viewer-2', 'member-1')).rejects.toThrow(
      ForbiddenError
    );
  });

  test('should throw ValidationError if removing last admin', async () => {
    const member = Member.reconstitute({
      id: 'member-1',
      organizationId: 'org-1',
      userId: 'admin-1',
      role: ROLES.ADMIN,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    repositoryMock.findById.mockResolvedValueOnce(member);
    repositoryMock.findByUserAndOrg.mockResolvedValueOnce({
      role: 'admin',
    });
    repositoryMock.countAdmins.mockResolvedValueOnce(1);
    expect(useCase.execute('org-1', 'admin-2', 'member-1')).rejects.toThrow(
      ValidationError
    );
  });
});
