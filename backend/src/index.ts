import { OpenAPIHono } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import { cors } from 'hono/cors';
import { globalErrorMiddleware } from './core/middlewares/error.middleware';
import { db } from './core/db/connection';
import { createOrganizationModule } from './modules/organization/organization.module';
import { createUserModule } from './modules/user/user.module';
import { createAuthModule } from './modules/auth/auth.module';
import { createMemberModule } from './modules/member/member.module';
import { DrizzleUserRepository } from './modules/user/infrastructure/db/drizzle.user.repository';
import { GetUserByEmailUseCase } from './modules/user/application/get-by-email.usecase';

const app = new OpenAPIHono();

const userRepository = new DrizzleUserRepository(db);
const getUserByEmailUseCase = new GetUserByEmailUseCase(userRepository);

app.use(
  '/api/*',
  cors({
    origin: Bun.env.FRONTEND_URL ?? 'http://localhost:3000',
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  })
);

app.onError(globalErrorMiddleware);

app.route('/api', createAuthModule(db));
app.route('/api', createOrganizationModule(db));
app.route('/api', createUserModule(db));
app.route('/api', createMemberModule(db, getUserByEmailUseCase));

app.get(
  '/reference',
  Scalar({
    url: '/doc',
    theme: 'moon',
  })
);

app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'TFG Horarios API',
  },
});

export default {
  port: 8080,
  fetch: app.fetch,
};

export type AppType = typeof app;
