import { OpenAPIHono } from '@hono/zod-openapi';
import { listUsersRoute, createUserRoute } from './users.routes';
import { db } from '../../../infrastructure/db/connection';
import { user } from '../../../infrastructure/db/schema';

export const usersController = new OpenAPIHono();

usersController.openapi(listUsersRoute, async (c) => {
  const result = await db.select().from(user);

  const mapped = result.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  }));

  return c.json(mapped, 200);
});

usersController.openapi(createUserRoute, async (c) => {
  const { name, email, password } = c.req.valid('json');

  const [newUser] = await db
    .insert(user)
    .values({
      name,
      email,
      password,
    })
    .returning();

  return c.json(
    {
      ...newUser,
      createdAt: newUser.createdAt.toISOString(),
      updatedAt: newUser.updatedAt.toISOString(),
    },
    201
  );
});
