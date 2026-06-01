import { describe, expect, test, mock } from 'bun:test';
import type { AppEnv } from '@/core/types/app-types';
import { HonoDegreeController } from './hono.degree.controller';
import { createTestApp } from '@/tests/setup-http';
import { OpenAPIHono } from '@hono/zod-openapi';
import {
  createDegreeRoute,
  bulkCreateDegreesRoute,
  getDegreeRoute,
  listDegreesRoute,
  updateDegreeRoute,
  deleteDegreeRoute,
} from './hono.degree.routes';

describe('HonoDegreeController Integration', () => {
  const createMock = { execute: mock() };
  const bulkCreateMock = { execute: mock() };
  const getMock = { execute: mock() };
  const listMock = { execute: mock() };
  const updateMock = { execute: mock() };
  const deleteMock = { execute: mock() };

  type Params = ConstructorParameters<typeof HonoDegreeController>;
  const controller = new HonoDegreeController(
    createMock as unknown as Params[0],
    bulkCreateMock as unknown as Params[1],
    getMock as unknown as Params[2],
    listMock as unknown as Params[3],
    updateMock as unknown as Params[4],
    deleteMock as unknown as Params[5]
  );

  const router = new OpenAPIHono<AppEnv>();
  router.openapi(createDegreeRoute, controller.create);
  router.openapi(bulkCreateDegreesRoute, controller.bulkCreate);
  router.openapi(getDegreeRoute, controller.get);
  router.openapi(listDegreesRoute, controller.list);
  router.openapi(updateDegreeRoute, controller.update);
  router.openapi(deleteDegreeRoute, controller.delete);

  const app = createTestApp('/api', router, 'u-admin');

  const validBody = {
    name: 'Computer Science',
    code: 'CS101',
  };

  const orgId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const degreeId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

  test('POST /organizations/:organizationId/degrees should return 201 with new degree', async () => {
    createMock.execute.mockResolvedValueOnce({ id: degreeId, ...validBody });
    const res = await app.request(`/api/organizations/${orgId}/degrees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: degreeId, ...validBody });
    expect(createMock.execute).toHaveBeenCalledWith(
      orgId,
      'u-admin',
      validBody
    );
  });

  test('POST /organizations/:organizationId/degrees/bulk should return 201 with new degrees', async () => {
    bulkCreateMock.execute.mockResolvedValueOnce([
      { id: degreeId, ...validBody },
    ]);
    const res = await app.request(`/api/organizations/${orgId}/degrees/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([validBody]),
    });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual([{ id: degreeId, ...validBody }]);
    expect(bulkCreateMock.execute).toHaveBeenCalledWith(orgId, 'u-admin', [
      validBody,
    ]);
  });

  test('GET /organizations/:organizationId/degrees/:id should return 200', async () => {
    getMock.execute.mockResolvedValueOnce({ id: degreeId, name: 'Test' });
    const res = await app.request(
      `/api/organizations/${orgId}/degrees/${degreeId}`
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: degreeId, name: 'Test' });
    expect(getMock.execute).toHaveBeenCalledWith(orgId, degreeId, 'u-admin');
  });

  test('GET /organizations/:organizationId/degrees should return 200 with list', async () => {
    listMock.execute.mockResolvedValueOnce([{ id: degreeId }]);
    const res = await app.request(`/api/organizations/${orgId}/degrees`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: degreeId }]);
    expect(listMock.execute).toHaveBeenCalledWith(orgId, 'u-admin');
  });

  test('PATCH /organizations/:organizationId/degrees/:id should return 200', async () => {
    updateMock.execute.mockResolvedValueOnce({ id: degreeId, name: 'Updated' });
    const res = await app.request(
      `/api/organizations/${orgId}/degrees/${degreeId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody),
      }
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: degreeId, name: 'Updated' });
    expect(updateMock.execute).toHaveBeenCalledWith(
      orgId,
      degreeId,
      'u-admin',
      validBody
    );
  });

  test('DELETE /organizations/:organizationId/degrees/:id should return 204', async () => {
    deleteMock.execute.mockResolvedValueOnce(undefined);
    const res = await app.request(
      `/api/organizations/${orgId}/degrees/${degreeId}`,
      {
        method: 'DELETE',
      }
    );
    expect(res.status).toBe(204);
    expect(await res.text()).toBe('');
    expect(deleteMock.execute).toHaveBeenCalledWith(orgId, degreeId, 'u-admin');
  });
});
