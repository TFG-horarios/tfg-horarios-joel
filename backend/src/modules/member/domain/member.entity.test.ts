import { describe, expect, test } from 'bun:test';
import { ValidationError } from '@/core/errors/app.error';
import { Member } from './member.entity';
import { ROLES } from '@/core/permissions/roles';

describe('Member', () => {
  const baseProps = {
    organizationId: 'org-1',
    userId: 'user-1',
    role: ROLES.VIEWER,
  };

  test('creates a member with generated identity and timestamps', () => {
    const member = Member.create(baseProps);
    expect(member.organizationId).toBe(baseProps.organizationId);
    expect(member.userId).toBe(baseProps.userId);
    expect(member.role).toBe(baseProps.role);
    expect(member.id).toBeString();
    expect(member.createdAt).toBeInstanceOf(Date);
    expect(member.updatedAt).toBeInstanceOf(Date);
  });

  test('reconstitutes a member from persisted props', () => {
    const date = new Date();
    const persistedProps = {
      id: 'member-1',
      organizationId: 'org-1',
      userId: 'user-1',
      role: ROLES.ADMIN,
      createdAt: date,
      updatedAt: date,
    };
    const member = Member.reconstitute(persistedProps);
    expect(member.id).toBe(persistedProps.id);
    expect(member.role).toBe(persistedProps.role);
  });

  test('updates member role and refreshes updatedAt', () => {
    const member = Member.reconstitute({
      id: 'member-1',
      organizationId: 'org-1',
      userId: 'user-1',
      role: ROLES.VIEWER,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    });
    const previousUpdatedAt = member.updatedAt;
    member.updateRole(ROLES.EDITOR, 'admin-1');
    expect(member.role).toBe(ROLES.EDITOR);
    expect(member.updatedAt.getTime()).toBeGreaterThanOrEqual(
      previousUpdatedAt.getTime()
    );
  });

  test('does nothing if new role is the same as current role', () => {
    const member = Member.reconstitute({
      id: 'member-1',
      organizationId: 'org-1',
      userId: 'user-1',
      role: ROLES.VIEWER,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    });
    const previousUpdatedAt = member.updatedAt;
    member.updateRole(ROLES.VIEWER, 'admin-1');
    expect(member.updatedAt.getTime()).toBe(previousUpdatedAt.getTime());
  });

  test('throws ValidationError when admin tries to degrade themselves', () => {
    const member = Member.reconstitute({
      id: 'member-1',
      organizationId: 'org-1',
      userId: 'user-1',
      role: ROLES.ADMIN,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    });
    expect(() => member.updateRole(ROLES.VIEWER, 'user-1')).toThrow(
      ValidationError
    );
  });
});
