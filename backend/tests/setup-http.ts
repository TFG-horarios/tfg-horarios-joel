import { OpenAPIHono } from '@hono/zod-openapi';
import { globalErrorMiddleware } from '../src/core/middlewares/error.middleware';
import type { AppEnv } from '@/core/types/app-types';

export const createTestApp = (
  routerPath: string,
  router: OpenAPIHono<AppEnv>,
  mockUserId?: string
) => {
  const app = new OpenAPIHono<AppEnv>();
  app.onError(globalErrorMiddleware);
  app.use('*', async (c, next) => {
    if (mockUserId) {
      c.set('userId', mockUserId);
    }
    await next();
  });

  app.route(routerPath, router);

  return app;
};
