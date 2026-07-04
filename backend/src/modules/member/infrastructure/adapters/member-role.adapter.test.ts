import { describe, expect, mock, test } from 'bun:test';
import { MemberRoleAdapter } from './member-role.adapter';

describe('MemberRoleAdapter', () => {
  test('returns the member role when membership exists', async () => {
    const memberRepository = {
      findByUserAndOrg: mock(async () => ({ role: 'admin' })),
    };
    const adapter = new MemberRoleAdapter(memberRepository as any);

    await expect(adapter.getMemberRole('user-1', 'org-1')).resolves.toBe(
      'admin'
    );
    expect(memberRepository.findByUserAndOrg).toHaveBeenCalledWith(
      'user-1',
      'org-1'
    );
  });

  test('returns null when membership does not exist', async () => {
    const memberRepository = {
      findByUserAndOrg: mock(async () => null),
    };
    const adapter = new MemberRoleAdapter(memberRepository as any);

    await expect(adapter.getMemberRole('user-1', 'org-1')).resolves.toBeNull();
  });
});
