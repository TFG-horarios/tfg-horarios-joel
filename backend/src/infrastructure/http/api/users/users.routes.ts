import { createRoute, z } from '@hono/zod-openapi';
import { UserSchema } from '@tfg-horarios/shared';

export const listUsersRoute = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.array(UserSchema),
        },
      },
      description: 'List all users',
    },
  },
});
