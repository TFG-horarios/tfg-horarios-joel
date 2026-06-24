import { describe, expect, test, mock } from 'bun:test';
import { MemberAdapter } from './member.adapter';
import { Member } from '@/modules/member/domain/member.entity';

describe('AcademicYearMemberAdapter', () => {
  const memberRepositoryMock = {
    save: mock(),
    findById: mock(),
    findByUserAndOrg: mock(),
    findByOrganizationId: mock(),
    delete: mock(),
    update: mock(),
    findWithUserDetailsByUserAndOrg: mock(),
    findPaginated: mock(),
    create: mock(),
    countAdmins: mock(),
    getOrganizationsWhereUserIsSoleAdmin: mock(),
  };

  const adapter = new MemberAdapter(memberRepositoryMock);

  test('should return null if member is not found', async () => {
    memberRepositoryMock.findByUserAndOrg.mockResolvedValue(null);
    const result = await adapter.getMemberRole('user-1', 'org-1');
    expect(result).toBeNull();
  });

  test('should return member role if member is found', async () => {
    const member = Member.create({
      userId: 'user-1',
      organizationId: 'org-1',
      role: 'admin',
    });
    memberRepositoryMock.findByUserAndOrg.mockResolvedValue(member);
    const result = await adapter.getMemberRole('user-1', 'org-1');
    expect(result).toBe('admin');
  });
});
