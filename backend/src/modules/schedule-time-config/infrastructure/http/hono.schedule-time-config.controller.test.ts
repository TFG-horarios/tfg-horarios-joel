import { describe, expect, test, mock } from 'bun:test';
import type { AppEnv } from '@/core/types/app-types';
import { HonoScheduleTimeConfigController } from './hono.schedule-time-config.controller';
import { createTestApp } from '@/tests/setup-http';
import { OpenAPIHono } from '@hono/zod-openapi';
import {
  createTimeConfigRoute,
  deleteTimeConfigRoute,
  listTimeConfigsRoute,
  updateTimeConfigRoute,
  getPossibilitiesRoute,
} from './hono.schedule-time-config.routes';

describe('HonoScheduleTimeConfigController Integration', () => {
  const listMock = { execute: mock() };
  const createMock = { execute: mock() };
  const updateMock = { execute: mock() };
  const deleteMock = { execute: mock() };
  const getPossibilitiesMock = { execute: mock() };

  type Params = ConstructorParameters<typeof HonoScheduleTimeConfigController>;
  const controller = new HonoScheduleTimeConfigController(
    listMock as unknown as Params[0],
    createMock as unknown as Params[1],
    updateMock as unknown as Params[2],
    deleteMock as unknown as Params[3],
    getPossibilitiesMock as unknown as Params[4]
  );

  const router = new OpenAPIHono<AppEnv>();
  router.openapi(createTimeConfigRoute, controller.create);
  router.openapi(listTimeConfigsRoute, controller.list);
  router.openapi(updateTimeConfigRoute, controller.update);
  router.openapi(deleteTimeConfigRoute, controller.delete);
  router.openapi(getPossibilitiesRoute, controller.getPossibilities);

  const app = createTestApp('/api', router, 'u-admin');

  const validBody = {
    degreeId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    itineraryId: null,
    courseYear: 1,
    period: 1,
    shift: 'morning',
    startTime: '08:00',
    endTime: '14:00',
    hasBreak: true,
    breakAfterSlot: 3,
  };

  const orgId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const academicYearId = '30eebc99-9c0b-4ef8-bb6d-6bb9bd380a88';
  const configId = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';

  test('POST /organizations/:organizationId/academic-years/:academicYearId/time-configs should return 201', async () => {
    createMock.execute.mockResolvedValueOnce({ id: configId, ...validBody });
    const res = await app.request(
      `/api/organizations/${orgId}/academic-years/${academicYearId}/time-configs`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody),
      }
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: configId, ...validBody });
    expect(createMock.execute).toHaveBeenCalledWith(
      orgId,
      academicYearId,
      'u-admin',
      validBody
    );
  });

  test('GET /organizations/:organizationId/academic-years/:academicYearId/time-configs should return 200 with list', async () => {
    listMock.execute.mockResolvedValueOnce([{ id: configId }]);
    const res = await app.request(
      `/api/organizations/${orgId}/academic-years/${academicYearId}/time-configs`
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: configId }]);
    expect(listMock.execute).toHaveBeenCalledWith(
      orgId,
      academicYearId,
      'u-admin',
      {}
    );
  });

  test('PATCH /organizations/:organizationId/academic-years/:academicYearId/time-configs/:id should return 200', async () => {
    const updateBody = {
      startTime: '09:00',
      endTime: '15:00',
      hasBreak: false,
      breakAfterSlot: null,
    };
    updateMock.execute.mockResolvedValueOnce({
      id: configId,
      ...validBody,
      ...updateBody,
    });
    const res = await app.request(
      `/api/organizations/${orgId}/academic-years/${academicYearId}/time-configs/${configId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateBody),
      }
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject(updateBody);
    expect(updateMock.execute).toHaveBeenCalledWith(
      orgId,
      academicYearId,
      configId,
      'u-admin',
      updateBody
    );
  });

  test('DELETE /organizations/:organizationId/academic-years/:academicYearId/time-configs/:id should return 204', async () => {
    deleteMock.execute.mockResolvedValueOnce(undefined);
    const res = await app.request(
      `/api/organizations/${orgId}/academic-years/${academicYearId}/time-configs/${configId}`,
      {
        method: 'DELETE',
      }
    );
    expect(res.status).toBe(204);
    expect(await res.text()).toBe('');
    expect(deleteMock.execute).toHaveBeenCalledWith(
      orgId,
      academicYearId,
      configId,
      'u-admin'
    );
  });

  test('GET /organizations/:organizationId/academic-years/:academicYearId/time-configs/possibilities should return 200', async () => {
    getPossibilitiesMock.execute.mockResolvedValueOnce([{ degreeId: 'deg-1' }]);
    const res = await app.request(
      `/api/organizations/${orgId}/academic-years/${academicYearId}/time-configs/possibilities`
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ degreeId: 'deg-1' }]);
    expect(getPossibilitiesMock.execute).toHaveBeenCalledWith(
      orgId,
      academicYearId,
      'u-admin'
    );
  });
});
