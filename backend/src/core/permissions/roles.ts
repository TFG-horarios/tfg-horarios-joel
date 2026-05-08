export const ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];

export const PERMISSIONS = {
  DELETE_ORGANIZATION: [ROLES.ADMIN],
  UPDATE_ORGANIZATION: [ROLES.ADMIN, ROLES.EDITOR],
  ADD_MEMBER: [ROLES.ADMIN],
  EDIT_MEMBER_ROLE: [ROLES.ADMIN],
  REMOVE_MEMBER: [ROLES.ADMIN],
} as const;

export type AppAction = keyof typeof PERMISSIONS;
