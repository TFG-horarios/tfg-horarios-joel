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
    findPaginated: mock(),
    getOrganizationsWhereUserIsSoleAdmin: mock(),
    findWithUserDetailsByUserAndOrg: mock(),
  };

  const useCase = new ListMembersUseCase(repositoryMock);

  test('should list members successfully', async () => {
    repositoryMock.findByUserAndOrg.mockResolvedValueOnce({
      role: 'admin',
    });
    const member = Member.reconstitute({
      id: 'member-1',
      organizationId: 'org-1',
      userId: 'user-1',
      role: ROLES.ADMIN,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    repositoryMock.findPaginated.mockResolvedValueOnce({
      data: [{ member, userName: 'John Doe', userEmail: 'john@example.com' }],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
    const result = await useCase.execute('org-1', 'user-1');
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.id).toBe('member-1');
  });

  test('should throw ForbiddenError if user does not belong to org', async () => {
    repositoryMock.findByUserAndOrg.mockResolvedValueOnce(null);
    expect(useCase.execute('org-1', 'user-1')).rejects.toThrow(ForbiddenError);
  });
});
