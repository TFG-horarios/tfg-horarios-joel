import { describe, expect, test, mock } from 'bun:test';
import type { AppEnv } from '@/core/types/app-types';
import { HonoSubjectGroupController } from './hono.subject-group.controller';
import { createTestApp } from '@/tests/setup-http';
import { OpenAPIHono } from '@hono/zod-openapi';
import {
  listSubjectGroupsRoute,
  getSubjectGroupRoute,
  createSubjectGroupRoute,
  bulkCreateSubjectGroupsRoute,
  updateSubjectGroupRoute,
  deleteSubjectGroupRoute,
  deleteAllSubjectGroupsRoute,
  replaceSubjectGroupsRoute,
  getSubjectGroupIdentifiersRoute,
} from './hono.subject-group.routes';

describe('HonoSubjectGroupController Integration', () => {
  const listMock = { execute: mock() };
  const getMock = { execute: mock() };
  const createMock = { execute: mock() };
  const bulkCreateMock = { execute: mock() };
  const updateMock = { execute: mock() };
  const deleteMock = { execute: mock() };
  const deleteAllMock = { execute: mock() };
  const replaceMock = { execute: mock() };
  const getIdentifiersMock = { execute: mock() };

  type Params = ConstructorParameters<typeof HonoSubjectGroupController>;
  const controller = new HonoSubjectGroupController(
    listMock as unknown as Params[0],
    getMock as unknown as Params[1],
    createMock as unknown as Params[2],
    bulkCreateMock as unknown as Params[3],
    updateMock as unknown as Params[4],
    deleteMock as unknown as Params[5],
    deleteAllMock as unknown as Params[6],
    replaceMock as unknown as Params[7],
    getIdentifiersMock as unknown as Params[8]
  );

  const router = new OpenAPIHono<AppEnv>();
  router.openapi(listSubjectGroupsRoute, controller.list);
  router.openapi(getSubjectGroupIdentifiersRoute, controller.getIdentifiers);
  router.openapi(getSubjectGroupRoute, controller.get);
  router.openapi(createSubjectGroupRoute, controller.create);
  router.openapi(bulkCreateSubjectGroupsRoute, controller.bulkCreate);
  router.openapi(updateSubjectGroupRoute, controller.update);
  router.openapi(deleteSubjectGroupRoute, controller.delete);
  router.openapi(deleteAllSubjectGroupsRoute, controller.deleteAll);
  router.openapi(replaceSubjectGroupsRoute, controller.replace);

  const app = createTestApp('/api', router, 'u-admin');

  const validBody = {
    name: 'Group A',
    groupType: 'theory',
    shift: 'morning',
    groupNumber: 1,
    weeklyHours: 2,
    numberOfStudents: 50,
  };

  const orgId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const subjectId = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';
  const groupId = 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a77';

  test('POST /organizations/:organizationId/subjects/:subjectId/groups should return 201 with new group', async () => {
    createMock.execute.mockResolvedValueOnce({ id: groupId, ...validBody });
    const res = await app.request(
      `/api/organizations/${orgId}/subjects/${subjectId}/groups`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody),
      }
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: groupId, ...validBody });
    expect(createMock.execute).toHaveBeenCalledWith(
      orgId,
      subjectId,
      'u-admin',
      validBody
    );
  });

  test('POST /organizations/:organizationId/subject-groups/bulk should return 201 with new groups', async () => {
    bulkCreateMock.execute.mockResolvedValueOnce([
      { id: groupId, ...validBody, subjectId },
    ]);
    const res = await app.request(
      `/api/organizations/${orgId}/subject-groups/bulk`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{ ...validBody, subjectId }]),
      }
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual([
      { id: groupId, ...validBody, subjectId },
    ]);
    expect(bulkCreateMock.execute).toHaveBeenCalledWith(orgId, 'u-admin', [
      { ...validBody, subjectId },
    ]);
  });

  test('GET /organizations/:organizationId/subject-groups/:id should return 200', async () => {
    getMock.execute.mockResolvedValueOnce({ id: groupId, name: 'Test' });
    const res = await app.request(
      `/api/organizations/${orgId}/subject-groups/${groupId}`
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: groupId, name: 'Test' });
    expect(getMock.execute).toHaveBeenCalledWith(orgId, groupId, 'u-admin');
  });

  test('GET /organizations/:organizationId/subject-groups should return 200 with list', async () => {
    listMock.execute.mockResolvedValueOnce([{ id: groupId }]);
    const res = await app.request(`/api/organizations/${orgId}/subject-groups`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: groupId }]);
    expect(listMock.execute).toHaveBeenCalledWith(orgId, 'u-admin');
  });

  test('GET /organizations/:organizationId/subject-groups/identifiers should return 200', async () => {
    getIdentifiersMock.execute.mockResolvedValueOnce([
      {
        subjectId: '1',
        shift: 'morning',
        groupType: 'theory',
        weeklyHours: 2,
        groupNumber: 1,
      },
    ]);
    const res = await app.request(
      `/api/organizations/${orgId}/subject-groups/identifiers`,
      {
        headers: { Authorization: `Bearer testToken` },
      }
    );
    if (res.status !== 200) {
      console.log('Error text:', await res.text());
    }
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(getIdentifiersMock.execute).toHaveBeenCalledWith(orgId, 'u-admin');
  });

  test('PATCH /organizations/:organizationId/subject-groups/:id should return 200', async () => {
    updateMock.execute.mockResolvedValueOnce({ id: groupId, name: 'Updated' });
    const res = await app.request(
      `/api/organizations/${orgId}/subject-groups/${groupId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody),
      }
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: groupId, name: 'Updated' });
    expect(updateMock.execute).toHaveBeenCalledWith(
      orgId,
      groupId,
      'u-admin',
      validBody
    );
  });

  test('DELETE /organizations/:organizationId/subject-groups/:id should return 204', async () => {
    deleteMock.execute.mockResolvedValueOnce(undefined);
    const res = await app.request(
      `/api/organizations/${orgId}/subject-groups/${groupId}`,
      {
        method: 'DELETE',
      }
    );
    expect(res.status).toBe(204);
    expect(await res.text()).toBe('');
    expect(deleteMock.execute).toHaveBeenCalledWith(orgId, groupId, 'u-admin');
  });

  test('DELETE /organizations/:organizationId/subject-groups should return 204 for deleteAll', async () => {
    deleteAllMock.execute.mockResolvedValueOnce(undefined);
    const res = await app.request(
      `/api/organizations/${orgId}/subject-groups`,
      {
        method: 'DELETE',
      }
    );
    expect(res.status).toBe(204);
    expect(await res.text()).toBe('');
    expect(deleteAllMock.execute).toHaveBeenCalledWith(orgId, 'u-admin');
  });

  test('PUT /organizations/:organizationId/subject-groups/bulk should return 200 with replaced groups', async () => {
    replaceMock.execute.mockResolvedValueOnce([
      { id: groupId, ...validBody, subjectId },
    ]);
    const res = await app.request(
      `/api/organizations/${orgId}/subject-groups/bulk`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{ ...validBody, subjectId }]),
      }
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      { id: groupId, ...validBody, subjectId },
    ]);
    expect(replaceMock.execute).toHaveBeenCalledWith(orgId, 'u-admin', [
      { ...validBody, subjectId },
    ]);
  });
});
