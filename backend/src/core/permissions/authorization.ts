import { PERMISSIONS, type AppRole, type AppAction } from './roles';

export const hasPermission = (
  userRole: AppRole,
  action: AppAction
): boolean => {
  const authorizedRoles: readonly AppRole[] = PERMISSIONS[action];
  return authorizedRoles.includes(userRole);
};
