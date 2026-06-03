import { describe, expect, test, mock } from 'bun:test';
import type { AppEnv } from '@/core/types/app-types';
import { HonoMemberController } from './hono.member.controller';
import { createTestApp } from '@/tests/setup-http';
import { OpenAPIHono } from '@hono/zod-openapi';
import {
  listMembersRoute,
  addMemberRoute,
  updateMemberRoleRoute,
  removeMemberRoute,
} from './hono.member.routes';

describe('HonoMemberController Integration', () => {
  const listMock = { execute: mock() };
  const addMock = { execute: mock() };
  const editRoleMock = { execute: mock() };
  const removeMock = { execute: mock() };

  type Params = ConstructorParameters<typeof HonoMemberController>;
  const controller = new HonoMemberController(
    listMock as unknown as Params[0],
    addMock as unknown as Params[1],
    editRoleMock as unknown as Params[2],
    removeMock as unknown as Params[3]
  );

  const router = new OpenAPIHono<AppEnv>();
  router.openapi(listMembersRoute, controller.list);
  router.openapi(addMemberRoute, controller.add);
  router.openapi(updateMemberRoleRoute, controller.updateRole);
  router.openapi(removeMemberRoute, controller.remove);

  const app = createTestApp('/api', router, 'u-admin');

  const orgId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const memberId = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

  test('GET /organizations/:organizationId/members should return 200 with list', async () => {
    const listResult = [
      {
        id: memberId,
        organizationId: orgId,
        userId: 'user-1',
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    listMock.execute.mockResolvedValueOnce(listResult);
    const res = await app.request(`/api/organizations/${orgId}/members`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(listResult);
    expect(listMock.execute).toHaveBeenCalledWith(orgId, 'u-admin', {});
  });

  test('POST /organizations/:organizationId/members should return 201 with new member', async () => {
    const validBody = { email: 'test@example.com', role: 'editor' as const };
    const memberResult = {
      id: memberId,
      organizationId: orgId,
      userId: 'user-new',
      role: 'editor',
    };
    addMock.execute.mockResolvedValueOnce(memberResult);
    const res = await app.request(`/api/organizations/${orgId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual(memberResult);
    expect(addMock.execute).toHaveBeenCalledWith(
      orgId,
      'u-admin',
      'test@example.com',
      'editor'
    );
  });

  test('PATCH /organizations/:organizationId/members/:id should return 200', async () => {
    editRoleMock.execute.mockResolvedValueOnce(undefined);
    const res = await app.request(
      `/api/organizations/${orgId}/members/${memberId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'viewer' }),
      }
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: 'Role updated successfully' });
    expect(editRoleMock.execute).toHaveBeenCalledWith(
      orgId,
      'u-admin',
      memberId,
      'viewer'
    );
  });

  test('DELETE /organizations/:organizationId/members/:id should return 204', async () => {
    removeMock.execute.mockResolvedValueOnce(undefined);
    const res = await app.request(
      `/api/organizations/${orgId}/members/${memberId}`,
      {
        method: 'DELETE',
      }
    );
    expect(res.status).toBe(204);
    expect(await res.text()).toBe('');
    expect(removeMock.execute).toHaveBeenCalledWith(orgId, 'u-admin', memberId);
  });
});
