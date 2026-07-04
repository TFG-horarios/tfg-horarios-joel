import { describe, expect, test, mock } from 'bun:test';
import { MemberAdapter } from './member.adapter';

describe('MemberAdapter', () => {
  const memberRepositoryMock = {
    getOrganizationsWhereUserIsSoleAdmin: mock(),
    findById: mock(),
    findByUserAndOrg: mock(),
    findWithUserDetailsByUserAndOrg: mock(),
    findByOrganizationId: mock(),
    findPaginated: mock(),
    create: mock(),
    update: mock(),
    delete: mock(),
    countAdmins: mock(),
  };

  const adapter = new MemberAdapter(memberRepositoryMock);

  test('getOrganizationsWhereUserIsSoleAdmin should return orgs', async () => {
    memberRepositoryMock.getOrganizationsWhereUserIsSoleAdmin.mockResolvedValue(
      ['org-1']
    );
    const result = await adapter.getOrganizationsWhereUserIsSoleAdmin('user-1');
    expect(result).toEqual(['org-1']);
    expect(
      memberRepositoryMock.getOrganizationsWhereUserIsSoleAdmin
    ).toHaveBeenCalledWith('user-1');
  });
});
