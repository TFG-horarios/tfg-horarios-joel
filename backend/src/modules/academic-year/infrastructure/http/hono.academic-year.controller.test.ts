import { describe, expect, test, mock } from 'bun:test';
import type { AppEnv } from '@/core/types/app-types';
import { HonoAcademicYearController } from './hono.academic-year.controller';
import { createTestApp } from '@/tests/setup-http';
import { OpenAPIHono } from '@hono/zod-openapi';
import {
  createAcademicYearRoute,
  listAcademicYearsRoute,
  getActiveAcademicYearRoute,
  updateAcademicYearRoute,
  deleteAcademicYearRoute,
} from './hono.academic-year.routes';

describe('HonoAcademicYearController Integration', () => {
  const createMock = { execute: mock() };
  const listMock = { execute: mock() };
  const getActiveMock = { execute: mock() };
  const updateMock = { execute: mock() };
  const deleteMock = { execute: mock() };

  type Params = ConstructorParameters<typeof HonoAcademicYearController>;
  const controller = new HonoAcademicYearController(
    createMock as unknown as Params[0],
    listMock as unknown as Params[1],
    getActiveMock as unknown as Params[2],
    updateMock as unknown as Params[3],
    deleteMock as unknown as Params[4]
  );

  const router = new OpenAPIHono<AppEnv>();
  router.openapi(createAcademicYearRoute, controller.create);
  router.openapi(listAcademicYearsRoute, controller.list);
  router.openapi(getActiveAcademicYearRoute, controller.getActive);
  router.openapi(updateAcademicYearRoute, controller.update);
  router.openapi(deleteAcademicYearRoute, controller.delete);

  const app = createTestApp('/api', router, 'u-admin');

  const orgId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const yearId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

  const validBody = {
    name: '2024-2025',
    periodType: 'semester' as const,
    morningStart: '08:00',
    morningEnd: '14:00',
    afternoonStart: '15:00',
    afternoonEnd: '21:00',
    slotDurationMinutes: 60,
    period0Start: '2024-09-01',
    period0End: '2024-12-31',
    period1Start: '2025-01-01',
    period1End: '2025-04-30',
    period2Start: '2025-05-01',
    period2End: '2025-08-31',
  };

  test('POST /organizations/:organizationId/academic-years should return 201', async () => {
    createMock.execute.mockResolvedValueOnce({
      id: yearId,
      ...validBody,
    });
    const res = await app.request(
      `/api/organizations/${orgId}/academic-years`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody),
      }
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      id: yearId,
      ...validBody,
    });
    expect(createMock.execute).toHaveBeenCalledWith(
      orgId,
      'u-admin',
      validBody
    );
  });

  test('GET /organizations/:organizationId/academic-years should return 200', async () => {
    listMock.execute.mockResolvedValueOnce([{ id: yearId, name: '2024-2025' }]);
    const res = await app.request(`/api/organizations/${orgId}/academic-years`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: yearId, name: '2024-2025' }]);
    expect(listMock.execute).toHaveBeenCalledWith(orgId, 'u-admin');
  });

  test('GET /organizations/:organizationId/academic-years/active should return 200', async () => {
    getActiveMock.execute.mockResolvedValueOnce({
      id: yearId,
      name: '2024-2025',
    });
    const res = await app.request(
      `/api/organizations/${orgId}/academic-years/active`
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      id: yearId,
      name: '2024-2025',
    });
    expect(getActiveMock.execute).toHaveBeenCalledWith(orgId, 'u-admin');
  });

  test('PUT /organizations/:organizationId/academic-years/:id should return 200', async () => {
    updateMock.execute.mockResolvedValueOnce({
      id: yearId,
      name: 'Updated',
    });
    const res = await app.request(
      `/api/organizations/${orgId}/academic-years/${yearId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody),
      }
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      id: yearId,
      name: 'Updated',
    });
    expect(updateMock.execute).toHaveBeenCalledWith(
      orgId,
      yearId,
      'u-admin',
      validBody
    );
  });

  test('DELETE /organizations/:organizationId/academic-years/:id should return 204', async () => {
    deleteMock.execute.mockResolvedValueOnce(undefined);
    const res = await app.request(
      `/api/organizations/${orgId}/academic-years/${yearId}`,
      {
        method: 'DELETE',
      }
    );
    expect(res.status).toBe(204);
    expect(await res.text()).toBe('');
    expect(deleteMock.execute).toHaveBeenCalledWith(orgId, yearId, 'u-admin');
  });

  test('POST /organizations/:organizationId/academic-years should return 400 for invalid body', async () => {
    const res = await app.request(
      `/api/organizations/${orgId}/academic-years`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '' }),
      }
    );
    expect(res.status).toBe(400);
  });
});
