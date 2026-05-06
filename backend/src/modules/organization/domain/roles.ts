import type { UserRole } from 'src/modules/organization-member/domain/organization-member.entity';

export const ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
} as const;

export const PERMISSIONS = {
  DELETE_ORGANIZATION: [ROLES.ADMIN],
} as const;

export const hasPermission = (
  userRole: UserRole,
  requiredRoles: readonly UserRole[]
): boolean => {
  return requiredRoles.includes(userRole);
};
