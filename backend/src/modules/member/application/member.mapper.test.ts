import { describe, expect, test } from 'bun:test';
import { MemberMapper } from './member.mapper';
import { Member } from '../domain/member.entity';
import { ROLES } from '@/core/permissions/roles';

describe('MemberMapper', () => {
  const date = new Date();

  test('should map Member to MemberDTO', () => {
    const member = Member.reconstitute({
      id: 'member-1',
      organizationId: 'org-1',
      userId: 'user-1',
      role: ROLES.VIEWER,
      createdAt: date,
      updatedAt: date,
    });
    const dto = MemberMapper.toDTO(member, 'Test', 'test@test.com');
    expect(dto).toEqual({
      id: 'member-1',
      organizationId: 'org-1',
      userId: 'user-1',
      role: ROLES.VIEWER,
      userName: 'Test',
      userEmail: 'test@test.com',
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
    });
  });

  test('should map list of MemberWithUserDetails to list of MemberDTOs', () => {
    const member = Member.reconstitute({
      id: 'member-1',
      organizationId: 'org-1',
      userId: 'user-1',
      role: ROLES.VIEWER,
      createdAt: date,
      updatedAt: date,
    });
    const dtos = MemberMapper.toDTOList([
      { member, userName: 'Test', userEmail: 'test@test.com' },
    ]);
    expect(dtos).toHaveLength(1);
    expect(dtos[0]?.id).toBe('member-1');
    expect(dtos[0]?.userName).toBe('Test');
  });
});
