import { describe, expect, test, mock } from 'bun:test';
import type { AppEnv } from '@/core/types/app-types';
import { HonoScheduleController } from './hono.schedule.controller';
import { createTestApp } from '@/tests/setup-http';
import { OpenAPIHono } from '@hono/zod-openapi';
import {
  listSchedulesRoute,
  getScheduleRoute,
  publishScheduleRoute,
  listScheduleSlotsRoute,
  updateScheduleSlotRoute,
  generateScheduleRoute,
  listAllSchedulesRoute,
} from './hono.schedule.routes';

describe('HonoScheduleController Integration', () => {
  const listMock = { execute: mock() };
  const listAllMock = { execute: mock() };
  const getMock = { execute: mock() };
  const publishMock = { execute: mock() };
  const generateMock = { execute: mock() };
  const checkOverwriteMock = { execute: mock() };
  const listSlotsMock = { execute: mock() };
  const updateSlotMock = { execute: mock() };

  type Params = ConstructorParameters<typeof HonoScheduleController>;
  const controller = new HonoScheduleController(
    listMock as unknown as Params[0],
    listAllMock as unknown as Params[1],
    getMock as unknown as Params[2],
    publishMock as unknown as Params[3],
    generateMock as unknown as Params[4],
    checkOverwriteMock as unknown as Params[5],
    listSlotsMock as unknown as Params[6],
    updateSlotMock as unknown as Params[7]
  );

  const router = new OpenAPIHono<AppEnv>();
  router.openapi(listSchedulesRoute, controller.list);
  router.openapi(listAllSchedulesRoute, controller.listAll);
  router.openapi(getScheduleRoute, controller.get);
  router.openapi(publishScheduleRoute, controller.publish);
  router.openapi(listScheduleSlotsRoute, controller.listSlots);
  router.openapi(updateScheduleSlotRoute, controller.updateSlot);
  router.openapi(generateScheduleRoute, controller.generate);

  const app = createTestApp('/api', router, 'u-admin');

  const orgId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const scheduleId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
  const slotId = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';

  test('GET /organizations/:organizationId/schedules should return 200 with list', async () => {
    listMock.execute.mockResolvedValueOnce([{ id: scheduleId }]);
    const res = await app.request(`/api/organizations/${orgId}/schedules`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: scheduleId }]);
    expect(listMock.execute).toHaveBeenCalledWith(orgId, 'u-admin', {});
  });

  test('GET /organizations/:organizationId/schedules/:id should return 200', async () => {
    getMock.execute.mockResolvedValueOnce({
      id: scheduleId,
      academicYearId: '30eebc99-9c0b-4ef8-bb6d-6bb9bd380a88',
    });
    const res = await app.request(
      `/api/organizations/${orgId}/schedules/${scheduleId}`
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      id: scheduleId,
      academicYearId: '30eebc99-9c0b-4ef8-bb6d-6bb9bd380a88',
    });
    expect(getMock.execute).toHaveBeenCalledWith(orgId, 'u-admin', scheduleId);
  });

  test('PATCH /organizations/:organizationId/schedules/:id/publish should return 200', async () => {
    publishMock.execute.mockResolvedValueOnce({
      id: scheduleId,
      status: 'published',
    });
    const res = await app.request(
      `/api/organizations/${orgId}/schedules/${scheduleId}/publish`,
      {
        method: 'PATCH',
      }
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: scheduleId, status: 'published' });
    expect(publishMock.execute).toHaveBeenCalledWith(
      orgId,
      'u-admin',
      scheduleId
    );
  });

  test('GET /organizations/:organizationId/schedules/:id/slots should return 200', async () => {
    listSlotsMock.execute.mockResolvedValueOnce([{ id: slotId }]);
    const res = await app.request(
      `/api/organizations/${orgId}/schedules/${scheduleId}/slots`
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: slotId }]);
    expect(listSlotsMock.execute).toHaveBeenCalledWith(
      orgId,
      'u-admin',
      scheduleId
    );
  });

  test('PATCH /organizations/:organizationId/slots/:id should return 200', async () => {
    const validBody = {
      classroomId: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
      dayOfWeek: 2,
      slotIndex: 3,
    };
    updateSlotMock.execute.mockResolvedValueOnce({ id: slotId, ...validBody });
    const res = await app.request(
      `/api/organizations/${orgId}/slots/${slotId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody),
      }
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: slotId, ...validBody });
    expect(updateSlotMock.execute).toHaveBeenCalledWith(
      orgId,
      'u-admin',
      slotId,
      validBody
    );
  });

  test('POST /organizations/:organizationId/schedules/generate should return 201', async () => {
    const validBody = {
      academicYearId: '30eebc99-9c0b-4ef8-bb6d-6bb9bd380a88',
      periods: [1],
      courseYears: [1, 2],
      degreeIds: ['d1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55'],
    };
    generateMock.execute.mockResolvedValueOnce([{ id: scheduleId }]);
    const res = await app.request(
      `/api/organizations/${orgId}/schedules/generate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody),
      }
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual([{ id: scheduleId }]);
    expect(generateMock.execute).toHaveBeenCalledWith(
      orgId,
      'u-admin',
      validBody
    );
  });
});
