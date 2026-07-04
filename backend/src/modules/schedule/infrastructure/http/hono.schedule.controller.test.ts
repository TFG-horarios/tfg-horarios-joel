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
  unpublishScheduleRoute,
  deleteScheduleRoute,
  checkOverwriteScheduleRoute,
  checkImportSchedulesOverwriteRoute,
  importSchedulesRoute,
} from './hono.schedule.routes';

describe('HonoScheduleController Integration', () => {
  const listMock = { execute: mock() };
  const listAllMock = { execute: mock() };
  const getMock = { execute: mock() };
  const publishMock = { execute: mock() };
  const unpublishMock = { execute: mock() };
  const deleteMock = { execute: mock() };
  const generateMock = { execute: mock() };
  const checkOverwriteMock = { execute: mock() };
  const checkImportOverwriteMock = { execute: mock() };
  const importSchedulesMock = { execute: mock() };
  const listSlotsMock = { execute: mock() };
  const updateSlotMock = { execute: mock() };

  type Params = ConstructorParameters<typeof HonoScheduleController>;
  const controller = new HonoScheduleController(
    listMock as unknown as Params[0],
    listAllMock as unknown as Params[1],
    getMock as unknown as Params[2],
    publishMock as unknown as Params[3],
    unpublishMock as unknown as Params[4],
    deleteMock as unknown as Params[5],
    generateMock as unknown as Params[6],
    checkOverwriteMock as unknown as Params[7],
    checkImportOverwriteMock as unknown as Params[8],
    importSchedulesMock as unknown as Params[9],
    listSlotsMock as unknown as Params[10],
    updateSlotMock as unknown as Params[11]
  );

  const router = new OpenAPIHono<AppEnv>();
  router.openapi(listSchedulesRoute, controller.list);
  router.openapi(listAllSchedulesRoute, controller.listAll);
  router.openapi(getScheduleRoute, controller.get);
  router.openapi(publishScheduleRoute, controller.publish);
  router.openapi(listScheduleSlotsRoute, controller.listSlots);
  router.openapi(updateScheduleSlotRoute, controller.updateSlot);
  router.openapi(generateScheduleRoute, controller.generate);
  router.openapi(unpublishScheduleRoute, controller.unpublish);
  router.openapi(deleteScheduleRoute, controller.delete);
  router.openapi(checkOverwriteScheduleRoute, controller.checkOverwrite);
  router.openapi(
    checkImportSchedulesOverwriteRoute,
    controller.checkImportOverwrite
  );
  router.openapi(importSchedulesRoute, controller.importSchedules);

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
    updateSlotMock.execute.mockResolvedValueOnce({
      slot: { id: slotId, ...validBody },
      affectedScheduleIds: [scheduleId],
    });
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
      optimizations: ['subjectDailyDispersion'],
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

  test('POST /organizations/:organizationId/schedules/generate should reject unknown optimizations', async () => {
    const res = await app.request(
      `/api/organizations/${orgId}/schedules/generate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academicYearId: '30eebc99-9c0b-4ef8-bb6d-6bb9bd380a88',
          periods: [1],
          optimizations: ['unknownOptimization'],
        }),
      }
    );

    expect(res.status).toBe(400);
  });

  test('GET /organizations/:organizationId/schedules/all should return 200', async () => {
    listAllMock.execute.mockResolvedValueOnce([{ id: scheduleId }]);
    const res = await app.request(`/api/organizations/${orgId}/schedules/all`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: scheduleId }]);
  });

  test('DELETE /organizations/:organizationId/schedules/:id should return 204', async () => {
    deleteMock.execute.mockResolvedValueOnce(undefined);
    const res = await app.request(
      `/api/organizations/${orgId}/schedules/${scheduleId}`,
      {
        method: 'DELETE',
      }
    );
    expect(res.status).toBe(204);
  });

  test('PATCH /organizations/:organizationId/schedules/:id/unpublish should return 200', async () => {
    unpublishMock.execute.mockResolvedValueOnce({
      id: scheduleId,
      status: 'draft',
    });
    const res = await app.request(
      `/api/organizations/${orgId}/schedules/${scheduleId}/unpublish`,
      {
        method: 'PATCH',
      }
    );
    expect(res.status).toBe(200);
  });

  test('POST /organizations/:organizationId/schedules/check-overwrite should return 200', async () => {
    const validBody = {
      academicYearId: '30eebc99-9c0b-4ef8-bb6d-6bb9bd380a88',
      periods: [1],
      courseYears: [1, 2],
      degreeIds: ['d1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55'],
    };
    checkOverwriteMock.execute.mockResolvedValueOnce([{ id: scheduleId }]);
    const res = await app.request(
      `/api/organizations/${orgId}/schedules/check-overwrite`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody),
      }
    );
    expect(res.status).toBe(200);
  });

  test('POST /organizations/:organizationId/schedules/import/check-overwrite should return 200', async () => {
    const validBody = {
      sourceAcademicYearId: '10eebc99-9c0b-4ef8-bb6d-6bb9bd380a88',
      targetAcademicYearId: '20eebc99-9c0b-4ef8-bb6d-6bb9bd380a88',
    };
    checkImportOverwriteMock.execute.mockResolvedValueOnce({
      schedules: [],
      timeConfigs: [],
    });
    const res = await app.request(
      `/api/organizations/${orgId}/schedules/import/check-overwrite`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody),
      }
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ schedules: [], timeConfigs: [] });
    expect(checkImportOverwriteMock.execute).toHaveBeenCalledWith(
      orgId,
      'u-admin',
      validBody
    );
  });

  test('POST /organizations/:organizationId/schedules/import should return 201', async () => {
    const validBody = {
      sourceAcademicYearId: '10eebc99-9c0b-4ef8-bb6d-6bb9bd380a88',
      targetAcademicYearId: '20eebc99-9c0b-4ef8-bb6d-6bb9bd380a88',
    };
    importSchedulesMock.execute.mockResolvedValueOnce({
      schedules: [],
      timeConfigs: [],
    });
    const res = await app.request(
      `/api/organizations/${orgId}/schedules/import`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody),
      }
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ schedules: [], timeConfigs: [] });
    expect(importSchedulesMock.execute).toHaveBeenCalledWith(
      orgId,
      'u-admin',
      validBody
    );
  });
});
