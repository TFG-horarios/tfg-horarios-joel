import { describe, expect, test, mock } from 'bun:test';
import type { AppEnv } from '@/core/types/app-types';
import { HonoSubjectController } from './hono.subject.controller';
import { createTestApp } from '@/tests/setup-http';
import { OpenAPIHono } from '@hono/zod-openapi';
import {
  createSubjectRoute,
  bulkCreateSubjectsRoute,
  getSubjectRoute,
  listSubjectsRoute,
  updateSubjectRoute,
  deleteSubjectRoute,
  deleteAllSubjectsRoute,
  replaceSubjectsRoute,
  getSubjectIdentifiersRoute,
} from './hono.subject.routes';

describe('HonoSubjectController Integration', () => {
  const createMock = { execute: mock() };
  const bulkCreateMock = { execute: mock() };
  const getMock = { execute: mock() };
  const listMock = { execute: mock() };
  const updateMock = { execute: mock() };
  const deleteMock = { execute: mock() };
  const deleteAllMock = { execute: mock() };
  const replaceMock = { execute: mock() };
  const getIdentifiersMock = { execute: mock() };

  type Params = ConstructorParameters<typeof HonoSubjectController>;
  const controller = new HonoSubjectController(
    createMock as unknown as Params[0],
    bulkCreateMock as unknown as Params[1],
    getMock as unknown as Params[2],
    listMock as unknown as Params[3],
    updateMock as unknown as Params[4],
    deleteMock as unknown as Params[5],
    deleteAllMock as unknown as Params[6],
    replaceMock as unknown as Params[7],
    getIdentifiersMock as unknown as Params[8]
  );

  const router = new OpenAPIHono<AppEnv>();
  router.openapi(createSubjectRoute, controller.create);
  router.openapi(bulkCreateSubjectsRoute, controller.bulkCreate);
  router.openapi(getSubjectIdentifiersRoute, controller.getIdentifiers);
  router.openapi(getSubjectRoute, controller.get);
  router.openapi(listSubjectsRoute, controller.list);
  router.openapi(updateSubjectRoute, controller.update);
  router.openapi(deleteSubjectRoute, controller.delete);
  router.openapi(deleteAllSubjectsRoute, controller.deleteAll);
  router.openapi(replaceSubjectsRoute, controller.replace);

  const app = createTestApp('/api', router, 'u-admin');

  const validBody = {
    name: 'Mathematics',
    code: 'MATH101',
    availableShifts: ['morning'],
    numberOfStudents: 100,
    courseYear: 1,
    period: 1,
    weeklyHours: 4,
    isCommon: false,
    itineraryId: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
  };

  const orgId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const degreeId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
  const subjectId = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';

  test('POST /organizations/:organizationId/degrees/:degreeId/subjects should return 201 with new subject', async () => {
    createMock.execute.mockResolvedValueOnce({ id: subjectId, ...validBody });
    const res = await app.request(
      `/api/organizations/${orgId}/degrees/${degreeId}/subjects`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody),
      }
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: subjectId, ...validBody });
    expect(createMock.execute).toHaveBeenCalledWith(
      orgId,
      degreeId,
      'u-admin',
      validBody
    );
  });

  test('POST /organizations/:organizationId/subjects/bulk should return 201 with new subjects', async () => {
    bulkCreateMock.execute.mockResolvedValueOnce([
      { id: subjectId, ...validBody, degreeId },
    ]);
    const res = await app.request(`/api/organizations/${orgId}/subjects/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ ...validBody, degreeId }]),
    });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual([
      { id: subjectId, ...validBody, degreeId },
    ]);
    expect(bulkCreateMock.execute).toHaveBeenCalledWith(orgId, 'u-admin', [
      { ...validBody, degreeId },
    ]);
  });

  test('GET /organizations/:organizationId/subjects/:id should return 200', async () => {
    getMock.execute.mockResolvedValueOnce({ id: subjectId, name: 'Test' });
    const res = await app.request(
      `/api/organizations/${orgId}/subjects/${subjectId}`
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: subjectId, name: 'Test' });
    expect(getMock.execute).toHaveBeenCalledWith(orgId, subjectId, 'u-admin');
  });

  test('GET /organizations/:organizationId/subjects should return 200 with list', async () => {
    listMock.execute.mockResolvedValueOnce([{ id: subjectId }]);
    const res = await app.request(`/api/organizations/${orgId}/subjects`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: subjectId }]);
    expect(listMock.execute).toHaveBeenCalledWith(orgId, 'u-admin');
  });

  test('GET /organizations/:organizationId/subjects/identifiers should return 200 with identifiers', async () => {
    getIdentifiersMock.execute.mockResolvedValueOnce(['ID1']);
    const res = await app.request(
      `/api/organizations/${orgId}/subjects/identifiers`,
      {
        headers: { Authorization: `Bearer testToken` },
      }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(getIdentifiersMock.execute).toHaveBeenCalledWith(orgId, 'u-admin');
  });

  test('PATCH /organizations/:organizationId/subjects/:id should return 200', async () => {
    updateMock.execute.mockResolvedValueOnce({
      id: subjectId,
      name: 'Updated',
    });
    const res = await app.request(
      `/api/organizations/${orgId}/subjects/${subjectId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody),
      }
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: subjectId, name: 'Updated' });
    expect(updateMock.execute).toHaveBeenCalledWith(
      orgId,
      subjectId,
      'u-admin',
      validBody
    );
  });

  test('DELETE /organizations/:organizationId/subjects/:id should return 204', async () => {
    deleteMock.execute.mockResolvedValueOnce(undefined);
    const res = await app.request(
      `/api/organizations/${orgId}/subjects/${subjectId}`,
      {
        method: 'DELETE',
      }
    );
    expect(res.status).toBe(204);
    expect(await res.text()).toBe('');
    expect(deleteMock.execute).toHaveBeenCalledWith(
      orgId,
      subjectId,
      'u-admin'
    );
  });

  test('DELETE /organizations/:organizationId/subjects should return 204 for deleteAll', async () => {
    deleteAllMock.execute.mockResolvedValueOnce(undefined);
    const res = await app.request(`/api/organizations/${orgId}/subjects`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(204);
    expect(await res.text()).toBe('');
    expect(deleteAllMock.execute).toHaveBeenCalledWith(orgId, 'u-admin');
  });

  test('PUT /organizations/:organizationId/subjects/bulk should return 200 with replaced subjects', async () => {
    replaceMock.execute.mockResolvedValueOnce([
      { id: subjectId, ...validBody, degreeId },
    ]);
    const res = await app.request(`/api/organizations/${orgId}/subjects/bulk`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ ...validBody, degreeId }]),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      { id: subjectId, ...validBody, degreeId },
    ]);
    expect(replaceMock.execute).toHaveBeenCalledWith(orgId, 'u-admin', [
      { ...validBody, degreeId },
    ]);
  });
});
