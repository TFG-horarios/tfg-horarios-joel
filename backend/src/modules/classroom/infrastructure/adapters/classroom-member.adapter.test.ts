import { describe, expect, test, mock } from 'bun:test';
import { ClassroomMemberAdapter } from './classroom-member.adapter';

describe('ClassroomMemberAdapter', () => {
  const memberRepositoryMock = {
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

  const adapter = new ClassroomMemberAdapter(memberRepositoryMock);

  test('should return null if member is not found', async () => {
    memberRepositoryMock.findByUserAndOrg.mockResolvedValueOnce(null);
    const result = await adapter.getMemberRole('user-1', 'org-1');
    expect(result).toBeNull();
    expect(memberRepositoryMock.findByUserAndOrg).toHaveBeenCalledWith(
      'user-1',
      'org-1'
    );
  });

  test('should return member role if member is found', async () => {
    memberRepositoryMock.findByUserAndOrg.mockResolvedValueOnce({
      role: 'admin',
    });
    const result = await adapter.getMemberRole('user-1', 'org-1');
    expect(result).toBe('admin');
    expect(memberRepositoryMock.findByUserAndOrg).toHaveBeenCalledWith(
      'user-1',
      'org-1'
    );
  });
});
