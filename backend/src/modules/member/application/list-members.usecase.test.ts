import { describe, expect, test, mock } from 'bun:test';
import { ListMembersUseCase } from './list-members.usecase';
import { Member } from '../domain/member.entity';
import { ForbiddenError } from '@/core/errors/app.error';
import { ROLES } from '@/core/permissions/roles';

describe('ListMembersUseCase', () => {
  const repositoryMock = {
    findById: mock(),
    findByUserAndOrg: mock(),
    findByOrganizationId: mock(),
    create: mock(),
    update: mock(),
    delete: mock(),
    countAdmins: mock(),
  };

  const useCase = new ListMembersUseCase(repositoryMock);

  test('should list members successfully', async () => {
    repositoryMock.findByUserAndOrg.mockResolvedValueOnce({
      role: 'viewer',
    });
    const member = Member.reconstitute({
      id: 'member-1',
      organizationId: 'org-1',
      userId: 'user-1',
      role: ROLES.VIEWER,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    repositoryMock.findByOrganizationId.mockResolvedValueOnce([
      { member, userName: 'John Doe', userEmail: 'john@example.com' },
    ]);
    const result = await useCase.execute('org-1', 'user-1');
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('member-1');
  });

  test('should throw ForbiddenError if user does not belong to org', async () => {
    repositoryMock.findByUserAndOrg.mockResolvedValueOnce(null);
    expect(useCase.execute('org-1', 'user-1')).rejects.toThrow(ForbiddenError);
  });
});
