import { describe, expect, test, mock } from 'bun:test';
import type { AppEnv } from '@/core/types/app-types';
import { HonoClassroomController } from './hono.classroom.controller';
import { createTestApp } from '@/tests/setup-http';
import { OpenAPIHono } from '@hono/zod-openapi';
import {
  createClassroomRoute,
  createManyClassroomsRoute,
  getClassroomRoute,
  listClassroomsRoute,
  updateClassroomRoute,
  deleteClassroomRoute,
  deleteAllClassroomsRoute,
  replaceClassroomsRoute,
  getClassroomIdentifiersRoute,
  listAllClassroomsRoute,
  getActiveClassroomConfigurationsRoute,
  getClassroomScheduleSlotsRoute,
} from './hono.classroom.routes';

describe('HonoClassroomController Integration', () => {
  const createMock = { execute: mock() };
  const bulkCreateMock = { execute: mock() };
  const getMock = { execute: mock() };
  const listMock = { execute: mock() };
  const updateMock = { execute: mock() };
  const deleteMock = { execute: mock() };
  const deleteAllMock = { execute: mock() };
  const replaceMock = { execute: mock() };
  const getIdentifiersMock = { execute: mock() };
  const listAllMock = { execute: mock() };
  const getActiveConfigurationsMock = { execute: mock() };
  const getScheduleSlotsMock = { execute: mock() };

  type Params = ConstructorParameters<typeof HonoClassroomController>;
  const controller = new HonoClassroomController(
    createMock as unknown as Params[0],
    listMock as unknown as Params[1],
    updateMock as unknown as Params[2],
    deleteMock as unknown as Params[3],
    getMock as unknown as Params[4],
    bulkCreateMock as unknown as Params[5],
    deleteAllMock as unknown as Params[6],
    replaceMock as unknown as Params[7],
    getIdentifiersMock as unknown as Params[8],
    listAllMock as unknown as Params[9],
    getActiveConfigurationsMock as unknown as Params[10],
    getScheduleSlotsMock as unknown as Params[11]
  );

  const router = new OpenAPIHono<AppEnv>();
  router.openapi(createClassroomRoute, controller.create);
  router.openapi(createManyClassroomsRoute, controller.createMany);
  router.openapi(replaceClassroomsRoute, controller.replace);
  router.openapi(getClassroomIdentifiersRoute, controller.getIdentifiers);
  router.openapi(listAllClassroomsRoute, controller.listAll);
  router.openapi(
    getActiveClassroomConfigurationsRoute,
    controller.getActiveConfigurations
  );
  router.openapi(getClassroomRoute, controller.get);
  router.openapi(getClassroomScheduleSlotsRoute, controller.getScheduleSlots);
  router.openapi(listClassroomsRoute, controller.list);
  router.openapi(updateClassroomRoute, controller.update);
  router.openapi(deleteClassroomRoute, controller.delete);
  router.openapi(deleteAllClassroomsRoute, controller.deleteAll);

  const app = createTestApp('/api', router, 'u-admin');

  const validBody = {
    name: 'A-101',
    capacity: 30,
    type: 'theory',
  };

  const orgId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const classroomId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

  test('POST /organizations/:organizationId/classrooms should return 201 with new classroom', async () => {
    createMock.execute.mockResolvedValueOnce({ id: classroomId, ...validBody });
    const res = await app.request(`/api/organizations/${orgId}/classrooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: classroomId, ...validBody });
    expect(createMock.execute).toHaveBeenCalledWith(
      orgId,
      'u-admin',
      validBody
    );
  });

  test('POST /organizations/:organizationId/classrooms/bulk should return 201 with new classrooms', async () => {
    bulkCreateMock.execute.mockResolvedValueOnce([
      { id: classroomId, ...validBody },
    ]);
    const res = await app.request(
      `/api/organizations/${orgId}/classrooms/bulk`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([validBody]),
      }
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual([{ id: classroomId, ...validBody }]);
    expect(bulkCreateMock.execute).toHaveBeenCalledWith(orgId, 'u-admin', [
      validBody,
    ]);
  });

  test('GET /organizations/:organizationId/classrooms/:id should return 200', async () => {
    getMock.execute.mockResolvedValueOnce({ id: classroomId, name: 'Test' });
    const res = await app.request(
      `/api/organizations/${orgId}/classrooms/${classroomId}`
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: classroomId, name: 'Test' });
    expect(getMock.execute).toHaveBeenCalledWith(orgId, classroomId, 'u-admin');
  });

  test('GET /organizations/:organizationId/classrooms should return 200 with list', async () => {
    const mockResponse = {
      data: [{ id: classroomId }],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    };
    listMock.execute.mockResolvedValueOnce(mockResponse);
    const res = await app.request(`/api/organizations/${orgId}/classrooms`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(mockResponse);
    expect(listMock.execute).toHaveBeenCalledWith(orgId, 'u-admin', {});
  });

  test('GET /organizations/:organizationId/classrooms/identifiers should return 200 with identifiers', async () => {
    getIdentifiersMock.execute.mockResolvedValueOnce(['Test']);
    const res = await app.request(
      `/api/organizations/${orgId}/classrooms/identifiers`
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(['Test']);
    expect(getIdentifiersMock.execute).toHaveBeenCalledWith(orgId, 'u-admin');
  });

  test('GET /organizations/:organizationId/classrooms/all should return 200 with all classrooms', async () => {
    listAllMock.execute.mockResolvedValueOnce([{ id: classroomId }]);
    const res = await app.request(`/api/organizations/${orgId}/classrooms/all`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: classroomId }]);
    expect(listAllMock.execute).toHaveBeenCalledWith(orgId, 'u-admin');
  });

  test('PUT /organizations/:organizationId/classrooms/:id should return 200', async () => {
    updateMock.execute.mockResolvedValueOnce({
      id: classroomId,
      name: 'Updated',
    });
    const res = await app.request(
      `/api/organizations/${orgId}/classrooms/${classroomId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody),
      }
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: classroomId, name: 'Updated' });
    expect(updateMock.execute).toHaveBeenCalledWith(
      orgId,
      classroomId,
      'u-admin',
      validBody
    );
  });

  test('DELETE /organizations/:organizationId/classrooms/:id should return 204', async () => {
    deleteMock.execute.mockResolvedValueOnce(undefined);
    const res = await app.request(
      `/api/organizations/${orgId}/classrooms/${classroomId}`,
      {
        method: 'DELETE',
      }
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      message: 'Classroom deleted successfully',
    });
    expect(deleteMock.execute).toHaveBeenCalledWith(
      orgId,
      classroomId,
      'u-admin'
    );
  });

  test('DELETE /organizations/:organizationId/classrooms should return 204 for deleteAll', async () => {
    deleteAllMock.execute.mockResolvedValueOnce(undefined);
    const res = await app.request(`/api/organizations/${orgId}/classrooms`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      message: 'All classrooms deleted successfully',
    });
    expect(deleteAllMock.execute).toHaveBeenCalledWith(orgId, 'u-admin');
  });

  test('PUT /organizations/:organizationId/classrooms/bulk should return 200 with replaced classrooms', async () => {
    replaceMock.execute.mockResolvedValueOnce([
      { id: classroomId, ...validBody },
    ]);
    const res = await app.request(
      `/api/organizations/${orgId}/classrooms/bulk`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([validBody]),
      }
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: classroomId, ...validBody }]);
    expect(replaceMock.execute).toHaveBeenCalledWith(orgId, 'u-admin', [
      validBody,
    ]);
  });

  test('GET /organizations/:organizationId/classrooms/active-configurations should return paginated configurations', async () => {
    const mockResponse = {
      data: [
        { classroomId, academicYearId: '30eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', shift: 'morning', period: 1 },
      ],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    };
    getActiveConfigurationsMock.execute.mockResolvedValueOnce(mockResponse);
    const res = await app.request(
      `/api/organizations/${orgId}/classrooms/active-configurations?academicYearId=30eebc99-9c0b-4ef8-bb6d-6bb9bd380a88`
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(mockResponse);
    expect(getActiveConfigurationsMock.execute).toHaveBeenCalledWith(
      orgId,
      'u-admin',
      { academicYearId: '30eebc99-9c0b-4ef8-bb6d-6bb9bd380a88' }
    );
  });

  test('GET /organizations/:organizationId/classrooms/:id/slots should return schedule slots', async () => {
    const mockResponse = [{ id: 'slot-1', classroomId }];
    getScheduleSlotsMock.execute.mockResolvedValueOnce(mockResponse);
    const res = await app.request(
      `/api/organizations/${orgId}/classrooms/${classroomId}/slots?academicYearId=30eebc99-9c0b-4ef8-bb6d-6bb9bd380a88`
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(mockResponse);
    expect(getScheduleSlotsMock.execute).toHaveBeenCalledWith(
      orgId,
      classroomId,
      'u-admin',
      { academicYearId: '30eebc99-9c0b-4ef8-bb6d-6bb9bd380a88' }
    );
  });
});
