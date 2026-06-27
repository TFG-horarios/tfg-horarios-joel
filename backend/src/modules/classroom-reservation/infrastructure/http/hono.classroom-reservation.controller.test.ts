import { describe, expect, test, mock } from 'bun:test';
import type { AppEnv } from '@/core/types/app-types';
import { HonoClassroomReservationController } from './hono.classroom-reservation.controller';
import { createTestApp } from '@/tests/setup-http';
import { OpenAPIHono } from '@hono/zod-openapi';
import {
  createReservationRoute,
  getAvailabilityRoute,
  listReservationsRoute,
  updateReservationStatusRoute,
  cancelReservationRoute,
} from './hono.classroom-reservation.routes';

describe('HonoClassroomReservationController Integration', () => {
  const createMock = { execute: mock() };
  const updateStatusMock = { execute: mock() };
  const listMock = { execute: mock() };
  const getAvailabilityMock = { execute: mock() };
  const cancelMock = { execute: mock() };

  type Params = ConstructorParameters<
    typeof HonoClassroomReservationController
  >;
  const controller = new HonoClassroomReservationController(
    createMock as unknown as Params[0],
    updateStatusMock as unknown as Params[1],
    listMock as unknown as Params[2],
    getAvailabilityMock as unknown as Params[3],
    cancelMock as unknown as Params[4]
  );

  const router = new OpenAPIHono<AppEnv>();
  router.openapi(createReservationRoute, controller.create);
  router.openapi(getAvailabilityRoute, controller.getAvailability);
  router.openapi(listReservationsRoute, controller.list);
  router.openapi(updateReservationStatusRoute, controller.updateStatus);
  router.openapi(cancelReservationRoute, controller.cancel);

  const app = createTestApp('/api', router, 'u-admin');

  const orgId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const resId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
  const classroomId = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
  const academicYearId = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';

  test('POST /organizations/:organizationId/classroom-reservations should return 201', async () => {
    const validBody = {
      classroomId,
      academicYearId,
      date: '2025-01-01',
      startTimeMinutes: 510,
      endTimeMinutes: 570,
      reason: 'Meeting',
    };
    createMock.execute.mockResolvedValueOnce({ id: resId, ...validBody });
    const res = await app.request(
      `/api/organizations/${orgId}/classroom-reservations`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody),
      }
    );
    expect(res.status).toBe(201);
  });

  test('GET /organizations/:organizationId/classroom-reservations/availability should return 200', async () => {
    getAvailabilityMock.execute.mockResolvedValueOnce({ occupiedSlots: [] });
    const res = await app.request(
      `/api/organizations/${orgId}/classroom-reservations/availability?classroomId=${classroomId}&academicYearId=${academicYearId}&startDate=2025-01-01&endDate=2025-01-01`
    );
    expect(res.status).toBe(200);
  });

  test('GET /organizations/:organizationId/classroom-reservations should return 200', async () => {
    listMock.execute.mockResolvedValueOnce({ data: [], meta: { total: 0 } });
    const res = await app.request(
      `/api/organizations/${orgId}/classroom-reservations`
    );
    expect(res.status).toBe(200);
  });

  test('PATCH /organizations/:organizationId/classroom-reservations/:id/status should return 200 for ACCEPTED', async () => {
    updateStatusMock.execute.mockResolvedValueOnce({
      id: resId,
      status: 'ACCEPTED',
    });
    const res = await app.request(
      `/api/organizations/${orgId}/classroom-reservations/${resId}/status`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACCEPTED' }),
      }
    );
    expect(res.status).toBe(200);
  });

  test('PATCH /organizations/:organizationId/classroom-reservations/:id/status should return 200 for REJECTED', async () => {
    updateStatusMock.execute.mockResolvedValueOnce({
      id: resId,
      status: 'REJECTED',
    });
    const res = await app.request(
      `/api/organizations/${orgId}/classroom-reservations/${resId}/status`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED' }),
      }
    );
    expect(res.status).toBe(200);
  });

  test('DELETE /organizations/:organizationId/classroom-reservations/:id should return 200', async () => {
    cancelMock.execute.mockResolvedValueOnce({
      id: resId,
      status: 'CANCELLED',
    });
    const res = await app.request(
      `/api/organizations/${orgId}/classroom-reservations/${resId}`,
      { method: 'DELETE' }
    );
    expect(res.status).toBe(200);
  });
});
