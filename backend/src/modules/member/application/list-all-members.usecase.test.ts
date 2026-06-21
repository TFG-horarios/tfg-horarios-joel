import { describe, expect, test, mock } from 'bun:test';
import { ListAllMembersUseCase } from './list-all-members.usecase';
import { Member } from '../domain/member.entity';
import { ForbiddenError } from '@/core/errors/app.error';

describe('ListAllMembersUseCase', () => {
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

  const useCase = new ListAllMembersUseCase(repositoryMock);

  test('should list all members successfully', async () => {
    const member = Member.create({
      userId: 'user-1',
      organizationId: 'org-1',
      role: 'admin',
    });
    repositoryMock.findByUserAndOrg.mockResolvedValueOnce(member);
    repositoryMock.findByOrganizationId.mockResolvedValueOnce([
      { member, userName: 'Test User', userEmail: 'test@example.com' },
    ]);
    const result = await useCase.execute('org-1', 'user-1');
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(member.id);
  });

  test('should throw ForbiddenError if user does not belong to org', async () => {
    repositoryMock.findByUserAndOrg.mockResolvedValueOnce(null);
    expect(useCase.execute('org-1', 'user-1')).rejects.toThrow(ForbiddenError);
  });
});
