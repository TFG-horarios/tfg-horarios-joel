import { OpenAPIHono } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';
import { listSubjectGroupsRoute, createSubjectGroupRoute } from './subject-groups.routes';
import { db } from '../../../infrastructure/db/connection';
import { subjectGroup } from '../../../infrastructure/db/schema';

export const subjectGroupsController = new OpenAPIHono();

subjectGroupsController.openapi(listSubjectGroupsRoute, async (c) => {
  const { subjectId } = c.req.valid('param');

  const result = await db
    .select()
    .from(subjectGroup)
    .where(eq(subjectGroup.subjectId, subjectId));

  const mapped = result.map((group) => ({
    ...group,
    weeklyHours: Number(group.weeklyHours),
    createdAt: group.createdAt.toISOString(),
    updatedAt: group.updatedAt.toISOString(),
  }));

  return c.json(mapped, 200);
});

subjectGroupsController.openapi(createSubjectGroupRoute, async (c) => {
  const { subjectId } = c.req.valid('param');
  const body = c.req.valid('json');

  const [newGroup] = await db
    .insert(subjectGroup)
    .values({
      subjectId,
      ...body,
      weeklyHours: body.weeklyHours.toString(),
    })
    .returning();

  return c.json(
    {
      ...newGroup,
      weeklyHours: Number(newGroup.weeklyHours),
      createdAt: newGroup.createdAt.toISOString(),
      updatedAt: newGroup.updatedAt.toISOString(),
    },
    201
  );
});
