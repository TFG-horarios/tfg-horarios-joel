import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import {
  CreateMemberBodySchema,
  MemberBaseParamSchema,
  MemberSchema,
  UpdateMemberRoleBodySchema,
  MemberIdParamSchema,
} from '@tfg-horarios/shared';

export const listMembersRoute = createRoute({
  method: 'get',
  path: '/organizations/{organizationId}/members',
  request: {
    params: MemberBaseParamSchema,
  },
  responses: {
    200: {
      description: 'List of organization members',
      content: { 'application/json': { schema: z.array(MemberSchema) } },
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden (Not a member)' },
  },
});

export const addMemberRoute = createRoute({
  method: 'post',
  path: '/organizations/{organizationId}/members',
  request: {
    params: MemberBaseParamSchema,
    body: {
      content: { 'application/json': { schema: CreateMemberBodySchema } },
    },
  },
  responses: {
    201: {
      description: 'Member added successfully',
      content: { 'application/json': { schema: MemberSchema } },
    },
    400: { description: 'Bad Request (e.g., user is already a member)' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden (Requires admin role)' },
    404: { description: 'Not Found (User email does not exist)' },
  },
});

export const updateMemberRoleRoute = createRoute({
  method: 'patch',
  path: '/organizations/{organizationId}/members/{id}',
  request: {
    params: MemberIdParamSchema,
    body: {
      content: {
        'application/json': { schema: UpdateMemberRoleBodySchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Role updated successfully',
      content: {
        'application/json': {
          schema: z.object({ message: z.string() }),
        },
      },
    },
    400: { description: 'Bad Request (e.g., cannot downgrade last admin)' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden (Requires admin role)' },
    404: { description: 'Not Found (Member not in organization)' },
  },
});

export const removeMemberRoute = createRoute({
  method: 'delete',
  path: '/organizations/{organizationId}/members/{id}',
  request: {
    params: MemberIdParamSchema,
  },
  responses: {
    204: {
      description: 'Member removed successfully (No Content)',
    },
    400: { description: 'Bad Request (e.g., cannot remove last admin)' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden (Requires admin role or self-removal)' },
    404: { description: 'Not Found (Member not in organization)' },
  },
});
