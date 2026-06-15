import { describe, expect, test, mock } from 'bun:test';
import type { AppEnv } from '@/core/types/app-types';
import { HonoOrganizationController } from './hono.organization.controller';
import { createTestApp } from '@/tests/setup-http';
import { OpenAPIHono } from '@hono/zod-openapi';
import {
  createOrgRoute,
  listOrgRoute,
  getOrgRoute,
  deleteOrgRoute,
  updateOrgRoute,
} from './hono.organization.routes';

describe('HonoOrganizationController Integration', () => {
  const createMock = { execute: mock() };
  const getMock = { execute: mock() };
  const listMock = { execute: mock() };
  const updateMock = { execute: mock() };
  const deleteMock = { execute: mock() };

  type Params = ConstructorParameters<typeof HonoOrganizationController>;
  const controller = new HonoOrganizationController(
    createMock as unknown as Params[0],
    getMock as unknown as Params[1],
    listMock as unknown as Params[2],
    updateMock as unknown as Params[3],
    deleteMock as unknown as Params[4]
  );

  const router = new OpenAPIHono<AppEnv>();
  router.openapi(createOrgRoute, controller.create);
  router.openapi(getOrgRoute, controller.get);
  router.openapi(listOrgRoute, controller.list);
  router.openapi(updateOrgRoute, controller.update);
  router.openapi(deleteOrgRoute, controller.delete);

  const app = createTestApp('/api', router, 'u-admin');

  const validBody = {
    name: 'Tech University',
  };

  test('POST /organizations should return 201 with new org', async () => {
    createMock.execute.mockResolvedValueOnce({
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      ...validBody,
    });
    const res = await app.request('/api/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      ...validBody,
    });
    expect(createMock.execute).toHaveBeenCalledWith(validBody, 'u-admin');
  });

  test('GET /organizations/:id should return 200', async () => {
    getMock.execute.mockResolvedValueOnce({
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      name: 'Test',
    });
    const res = await app.request(
      '/api/organizations/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      name: 'Test',
    });
    expect(getMock.execute).toHaveBeenCalledWith(
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      'u-admin'
    );
  });

  test('GET /organizations should return 200 with list', async () => {
    listMock.execute.mockResolvedValueOnce([
      { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
    ]);
    const res = await app.request('/api/organizations');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
    ]);
  });

  test('PATCH /organizations/:id should return 200', async () => {
    updateMock.execute.mockResolvedValueOnce({
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      name: 'Updated',
    });
    const res = await app.request(
      '/api/organizations/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody),
      }
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      name: 'Updated',
    });
    expect(updateMock.execute).toHaveBeenCalledWith(
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      'u-admin',
      validBody
    );
  });

  test('DELETE /organizations/:id should return 204', async () => {
    deleteMock.execute.mockResolvedValueOnce(undefined);
    const res = await app.request(
      '/api/organizations/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      {
        method: 'DELETE',
      }
    );
    expect(res.status).toBe(204);
    expect(await res.text()).toBe('');
  });

  test('POST /organizations should return 400 for invalid body', async () => {
    const res = await app.request('/api/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '' }),
    });
    expect(res.status).toBe(400);
  });
});
