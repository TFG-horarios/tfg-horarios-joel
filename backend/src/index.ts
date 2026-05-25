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
import { JwtService } from './modules/auth/infrastructure/services/jwt.service';
import { createAuthMiddleware } from './core/middlewares/auth.middleware';
import { createDegreeModule } from './modules/degree/degree.module';
import { createClassroomModule } from './modules/classroom/classroom.module';
import { createItineraryModule } from './modules/itinerary/itinerary.module';
import { createSubjectModule } from './modules/subject/subject.module';
import { createSubjectGroupModule } from './modules/subject-group/subject-group.module';

const api = new OpenAPIHono();
const protectedApi = new OpenAPIHono();

const jwtSecret = Bun.env.JWT_SECRET || '';
const jwtExpiresInSeconds = Number(Bun.env.JWT_EXPIRES_IN_SECONDS) || 86400;
if (!jwtSecret) throw new Error('JWT_SECRET missing');
const jwtService = new JwtService(jwtSecret, jwtExpiresInSeconds);
const authMiddleware = createAuthMiddleware(jwtService);
const userRepository = new DrizzleUserRepository(db);
const getUserByEmailUseCase = new GetUserByEmailUseCase(userRepository);

api.use(
  '/api/*',
  cors({
    origin: Bun.env.FRONTEND_URL ?? 'http://localhost:3000',
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  })
);

api.onError(globalErrorMiddleware);

api.route('/api', createAuthModule(db, jwtService));

protectedApi.use('/*', authMiddleware);
const protectedRoutes = protectedApi
  .route('/', createOrganizationModule(db))
  .route('/', createUserModule(db, getUserByEmailUseCase))
  .route('/', createMemberModule(db, getUserByEmailUseCase))
  .route('/', createDegreeModule(db))
  .route('/', createClassroomModule(db))
  .route('/', createItineraryModule(db))
  .route('/', createSubjectModule(db))
  .route('/', createSubjectGroupModule(db));

const routes = api
  .route('/api', createAuthModule(db, jwtService))
  .route('/api', protectedRoutes);

api.get('/reference', Scalar({ url: '/doc', theme: 'moon' }));
api.doc('/doc', { openapi: '3.0.0', info: { version: '1.0.0', title: 'TFG' } });

export default {
  port: 8080,
  fetch: routes.fetch,
};

export type AppType = typeof routes;
