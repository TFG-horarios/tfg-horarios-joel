import { OpenAPIHono } from '@hono/zod-openapi';
import {
  listOrganizationsRoute,
  createOrganizationRoute,
} from './organizations.routes';
import { db } from '../../../infrastructure/db/connection';
import { organization } from '../../../infrastructure/db/schema';

export const organizationsController = new OpenAPIHono();

organizationsController.openapi(listOrganizationsRoute, async (c) => {
  const result = await db.select().from(organization);

  const mapped = result.map((org) => ({
    ...org,
    createdAt: org.createdAt.toISOString(),
    updatedAt: org.updatedAt.toISOString(),
  }));

  return c.json(mapped, 200);
});

organizationsController.openapi(createOrganizationRoute, async (c) => {
  const { name, periodType } = c.req.valid('json');

  const [newOrg] = await db
    .insert(organization)
    .values({
      name,
      periodType,
    })
    .returning();

  return c.json(
    {
      ...newOrg,
      createdAt: newOrg.createdAt.toISOString(),
      updatedAt: newOrg.updatedAt.toISOString(),
    },
    201
  );
});
