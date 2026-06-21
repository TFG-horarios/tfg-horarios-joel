import { describe, expect, test, mock } from 'bun:test';
import { ClassroomReservationMemberAdapter } from './classroom-reservation-member.adapter';

describe('ClassroomReservationMemberAdapter', () => {
  const memberRepositoryMock = {
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

  const adapter = new ClassroomReservationMemberAdapter(memberRepositoryMock);

  test('should return null if member not found', async () => {
    memberRepositoryMock.findByUserAndOrg.mockResolvedValue(null);
    const result = await adapter.getMemberRole('user-1', 'org-1');
    expect(result).toBeNull();
  });

  test('should return role if member found', async () => {
    memberRepositoryMock.findByUserAndOrg.mockResolvedValue({ role: 'admin' });
    const result = await adapter.getMemberRole('user-1', 'org-1');
    expect(result).toBe('admin');
  });
});
