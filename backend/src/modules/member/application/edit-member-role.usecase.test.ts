import { describe, expect, test, mock } from 'bun:test';
import { EditMemberRoleUseCase } from './edit-member-role.usecase';
import { Member } from '../domain/member.entity';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@/core/errors/app.error';
import { ROLES } from '@/core/permissions/roles';

describe('EditMemberRoleUseCase', () => {
  const repositoryMock = {
    findById: mock(),
    findByUserAndOrg: mock(),
    findByOrganizationId: mock(),
    create: mock(),
    update: mock(),
    delete: mock(),
    countAdmins: mock(),
  };

  const useCase = new EditMemberRoleUseCase(repositoryMock);

  test('should edit member role successfully', async () => {
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

    await useCase.execute('org-1', 'admin-1', 'member-1', ROLES.EDITOR);
    expect(member.role).toBe(ROLES.EDITOR);
    expect(repositoryMock.update).toHaveBeenCalledWith(member);
  });

  test('should throw NotFoundError if member not found', async () => {
    repositoryMock.findById.mockResolvedValueOnce(null);
    expect(
      useCase.execute('org-1', 'admin-1', 'member-1', ROLES.EDITOR)
    ).rejects.toThrow(NotFoundError);
  });

  test('should throw ForbiddenError if requester lacks permission', async () => {
    repositoryMock.findById.mockResolvedValueOnce({
      userId: 'target-user',
    });
    repositoryMock.findByUserAndOrg.mockResolvedValueOnce({
      role: 'viewer',
    });
    expect(
      useCase.execute('org-1', 'viewer-1', 'member-1', ROLES.EDITOR)
    ).rejects.toThrow(ForbiddenError);
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

    expect(
      useCase.execute('org-1', 'admin-2', 'member-1', ROLES.EDITOR)
    ).rejects.toThrow(ValidationError);
  });
});
