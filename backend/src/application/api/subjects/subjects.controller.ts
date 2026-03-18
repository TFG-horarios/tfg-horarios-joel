import { OpenAPIHono } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';
import { listSubjectsRoute, createSubjectRoute } from './subjects.routes';
import { db } from '../../../infrastructure/db/connection';
import { subject } from '../../../infrastructure/db/schema';

export const subjectsController = new OpenAPIHono();

subjectsController.openapi(listSubjectsRoute, async (c) => {
  const { orgId } = c.req.valid('param');

  const result = await db
    .select()
    .from(subject)
    .where(eq(subject.organizationId, orgId));

  const mapped = result.map((sub) => ({
    ...sub,
    createdAt: sub.createdAt.toISOString(),
    updatedAt: sub.updatedAt.toISOString(),
  }));

  return c.json(mapped, 200);
});

subjectsController.openapi(createSubjectRoute, async (c) => {
  const { orgId } = c.req.valid('param');
  const body = c.req.valid('json');

  const [newSubject] = await db
    .insert(subject)
    .values({
      organizationId: orgId,
      ...body,
    })
    .returning();

  return c.json(
    {
      ...newSubject,
      createdAt: newSubject.createdAt.toISOString(),
      updatedAt: newSubject.updatedAt.toISOString(),
    },
    201
  );
});
