import { describe, expect, test, mock } from 'bun:test';
import type { AppEnv } from '@/core/types/app-types';
import { HonoItineraryController } from './hono.itinerary.controller';
import { createTestApp } from '@/tests/setup-http';
import { OpenAPIHono } from '@hono/zod-openapi';
import {
  createItineraryRoute,
  bulkCreateItinerariesRoute,
  getItineraryRoute,
  listItinerariesRoute,
  updateItineraryRoute,
  deleteItineraryRoute,
} from './hono.itinerary.routes';

describe('HonoItineraryController Integration', () => {
  const createMock = { execute: mock() };
  const bulkCreateMock = { execute: mock() };
  const getMock = { execute: mock() };
  const listMock = { execute: mock() };
  const updateMock = { execute: mock() };
  const deleteMock = { execute: mock() };

  type Params = ConstructorParameters<typeof HonoItineraryController>;
  const controller = new HonoItineraryController(
    createMock as unknown as Params[0],
    bulkCreateMock as unknown as Params[1],
    getMock as unknown as Params[2],
    listMock as unknown as Params[3],
    updateMock as unknown as Params[4],
    deleteMock as unknown as Params[5]
  );

  const router = new OpenAPIHono<AppEnv>();
  router.openapi(createItineraryRoute, controller.create);
  router.openapi(bulkCreateItinerariesRoute, controller.bulkCreate);
  router.openapi(getItineraryRoute, controller.get);
  router.openapi(listItinerariesRoute, controller.list);
  router.openapi(updateItineraryRoute, controller.update);
  router.openapi(deleteItineraryRoute, controller.delete);

  const app = createTestApp('/api', router, 'u-admin');

  const validBody = {
    name: 'Software Engineering',
    code: 'SE101',
  };

  const orgId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const degreeId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
  const itineraryId = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';

  test('POST /organizations/:organizationId/degrees/:degreeId/itineraries should return 201 with new itinerary', async () => {
    createMock.execute.mockResolvedValueOnce({ id: itineraryId, ...validBody });
    const res = await app.request(
      `/api/organizations/${orgId}/degrees/${degreeId}/itineraries`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody),
      }
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: itineraryId, ...validBody });
    expect(createMock.execute).toHaveBeenCalledWith(
      orgId,
      degreeId,
      'u-admin',
      validBody
    );
  });

  test('POST /organizations/:organizationId/degrees/:degreeId/itineraries/bulk should return 201 with new itineraries', async () => {
    bulkCreateMock.execute.mockResolvedValueOnce([
      { id: itineraryId, ...validBody },
    ]);
    const res = await app.request(
      `/api/organizations/${orgId}/degrees/${degreeId}/itineraries/bulk`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([validBody]),
      }
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual([{ id: itineraryId, ...validBody }]);
    expect(bulkCreateMock.execute).toHaveBeenCalledWith(
      orgId,
      degreeId,
      'u-admin',
      [validBody]
    );
  });

  test('GET /organizations/:organizationId/itineraries/:id should return 200', async () => {
    getMock.execute.mockResolvedValueOnce({ id: itineraryId, name: 'Test' });
    const res = await app.request(
      `/api/organizations/${orgId}/itineraries/${itineraryId}`
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: itineraryId, name: 'Test' });
    expect(getMock.execute).toHaveBeenCalledWith(orgId, itineraryId, 'u-admin');
  });

  test('GET /organizations/:organizationId/itineraries should return 200 with list', async () => {
    listMock.execute.mockResolvedValueOnce([{ id: itineraryId }]);
    const res = await app.request(`/api/organizations/${orgId}/itineraries`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: itineraryId }]);
    expect(listMock.execute).toHaveBeenCalledWith(orgId, 'u-admin');
  });

  test('PATCH /organizations/:organizationId/itineraries/:id should return 200', async () => {
    updateMock.execute.mockResolvedValueOnce({
      id: itineraryId,
      name: 'Updated',
    });
    const res = await app.request(
      `/api/organizations/${orgId}/itineraries/${itineraryId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody),
      }
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: itineraryId, name: 'Updated' });
    expect(updateMock.execute).toHaveBeenCalledWith(
      orgId,
      itineraryId,
      'u-admin',
      validBody
    );
  });

  test('DELETE /organizations/:organizationId/itineraries/:id should return 204', async () => {
    deleteMock.execute.mockResolvedValueOnce(undefined);
    const res = await app.request(
      `/api/organizations/${orgId}/itineraries/${itineraryId}`,
      {
        method: 'DELETE',
      }
    );
    expect(res.status).toBe(204);
    expect(await res.text()).toBe('');
    expect(deleteMock.execute).toHaveBeenCalledWith(
      orgId,
      itineraryId,
      'u-admin'
    );
  });
});
