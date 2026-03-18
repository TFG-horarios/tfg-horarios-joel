import { OpenAPIHono } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';
import { listClassroomsRoute, createClassroomRoute } from './classrooms.routes';
import { db } from '../../../infrastructure/db/connection';
import { classroom } from '../../../infrastructure/db/schema';

export const classroomsController = new OpenAPIHono();

classroomsController.openapi(listClassroomsRoute, async (c) => {
  const { orgId } = c.req.valid('param');

  const result = await db
    .select()
    .from(classroom)
    .where(eq(classroom.organizationId, orgId));

  const mapped = result.map((clr) => ({
    ...clr,
    createdAt: clr.createdAt.toISOString(),
    updatedAt: clr.updatedAt.toISOString(),
  }));

  return c.json(mapped, 200);
});

classroomsController.openapi(createClassroomRoute, async (c) => {
  const { orgId } = c.req.valid('param');
  const body = c.req.valid('json');

  const [newClassroom] = await db
    .insert(classroom)
    .values({
      organizationId: orgId,
      ...body,
    })
    .returning();

  return c.json(
    {
      ...newClassroom,
      createdAt: newClassroom.createdAt.toISOString(),
      updatedAt: newClassroom.updatedAt.toISOString(),
    },
    201
  );
});
