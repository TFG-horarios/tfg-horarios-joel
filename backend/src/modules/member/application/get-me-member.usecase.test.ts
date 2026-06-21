import { describe, expect, test, mock } from 'bun:test';
import { GetMeMemberUseCase } from './get-me-member.usecase';
import { ForbiddenError } from '@/core/errors/app.error';
import { Member } from '../domain/member.entity';

describe('GetMeMemberUseCase', () => {
  const repositoryMock = {
    findById: mock(),
    findByUserAndOrg: mock(),
    findWithUserDetailsByUserAndOrg: mock(),
    findByOrganizationId: mock(),
    findPaginated: mock(),
    create: mock(),
    update: mock(),
    delete: mock(),
    countAdmins: mock(),
    getOrganizationsWhereUserIsSoleAdmin: mock(),
  };

  const useCase = new GetMeMemberUseCase(repositoryMock);

  test('should return member with user details', async () => {
    const member = Member.reconstitute({
      id: 'member-1',
      userId: 'user-1',
      organizationId: 'org-1',
      role: 'viewer',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    repositoryMock.findWithUserDetailsByUserAndOrg.mockResolvedValue({
      member,
      userEmail: 'test@test.com',
      userName: 'Test',
    });

    const result = await useCase.execute('org-1', 'user-1');
    expect(result.id).toBe('member-1');
    expect(result.userEmail).toBe('test@test.com');
  });

  test('should throw ForbiddenError if member not found', async () => {
    repositoryMock.findWithUserDetailsByUserAndOrg.mockResolvedValue(null);
    expect(useCase.execute('org-1', 'user-1')).rejects.toThrow(ForbiddenError);
  });
});
