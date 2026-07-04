import { describe, expect, mock, test } from 'bun:test';
import { MemberRoleAdapter } from './member-role.adapter';

describe('MemberRoleAdapter', () => {
  const memberRepositoryMock = {
    findByUserAndOrg: mock(),
    findById: mock(),
    findWithUserDetailsByUserAndOrg: mock(),
    findByOrganizationId: mock(),
    findPaginated: mock(),
    create: mock(),
    update: mock(),
    delete: mock(),
    countAdmins: mock(),
    getOrganizationsWhereUserIsSoleAdmin: mock(),
  };

  test('returns the member role when membership exists', async () => {
    const adapter = new MemberRoleAdapter(memberRepositoryMock);
    memberRepositoryMock.findByUserAndOrg.mockResolvedValueOnce({
      id: 'member-1',
      userId: 'user-1',
      organizationId: 'org-1',
      role: 'admin',
    });
    await expect(adapter.getMemberRole('user-1', 'org-1')).resolves.toBe(
      'admin'
    );
    expect(memberRepositoryMock.findByUserAndOrg).toHaveBeenCalledWith(
      'user-1',
      'org-1'
    );
  });

  test('returns null when membership does not exist', async () => {
    const adapter = new MemberRoleAdapter(memberRepositoryMock);
    memberRepositoryMock.findByUserAndOrg.mockResolvedValueOnce(null);

    await expect(adapter.getMemberRole('user-1', 'org-1')).resolves.toBeNull();
  });
});
