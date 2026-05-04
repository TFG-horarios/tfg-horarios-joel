import { OpenAPIHono } from '@hono/zod-openapi';
import { z } from 'zod';
import { UserSchema } from '@tfg-horarios/shared';
import { HonoUserController } from './infrastructure/http/hono.user.controller';
import { ListUsersUseCase } from './application/list-users.usecase';
import { DrizzleUserRepository } from './infrastructure/database/drizzle.user.repository';
import { createAuthMiddleware } from 'src/core/middlewares/auth.middleware';
import type { DbConnection } from 'src/core/db/connection';
import { JwtService } from '../auth/infrastructure/services/jwt.service';

export const createUserModule = (db: DbConnection) => {
  const userRepository = new DrizzleUserRepository(db);
  const listUseCase = new ListUsersUseCase(userRepository);
  const controller = new HonoUserController(listUseCase);

  const router = new OpenAPIHono();

  const jwtService = new JwtService();
  router.use('*', createAuthMiddleware(jwtService));

  router.openapi(
    {
      method: 'get',
      path: '/',
      responses: {
        200: {
          description: 'Listado de usuarios',
          content: {
            'application/json': { schema: z.array(UserSchema) },
          },
        },
        400: {
          description: 'Error de validación o parámetros incorrectos',
          content: {
            'application/json': {
              schema: z.object({ message: z.any() }),
            },
          },
        },
      },
    },
    async (c) => controller.list(c)
  );

  return router;
};
