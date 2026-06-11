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
import { JwtService } from './modules/auth/infrastructure/services/jwt.service';
import { createAuthMiddleware } from './core/middlewares/auth.middleware';
import { createDegreeModule } from './modules/degree/degree.module';
import { createClassroomModule } from './modules/classroom/classroom.module';
import { createItineraryModule } from './modules/itinerary/itinerary.module';
import { createSubjectModule } from './modules/subject/subject.module';
import { createSubjectGroupModule } from './modules/subject-group/subject-group.module';
import { createScheduleModule } from './modules/schedule/schedule.module';
import { DrizzleMemberRepository } from './modules/member/infrastructure/db/drizzle.member.repository';
import { DrizzleSubjectRepository } from './modules/subject/infrastructure/db/drizzle.subject.repository';
import { createClassroomReservationModule } from './modules/classroom-reservation/classroom-reservation.module';
import { DrizzleScheduleRepository } from './modules/schedule/infrastructure/db/drizzle.schedule.repository';
import { DrizzleScheduleSlotRepository } from './modules/schedule-slot/infrastructure/db/drizzle.schedule-slot.repository';
import { createAcademicYearModule } from './modules/academic-year/academic-year.module';
import { DrizzleAcademicYearRepository } from './modules/academic-year/infrastructure/db/drizzle.academic-year.repository';

const api = new OpenAPIHono();
const protectedApi = new OpenAPIHono();

const jwtSecret = Bun.env.JWT_SECRET || '';
const jwtExpiresInSeconds = Number(Bun.env.JWT_EXPIRES_IN_SECONDS) || 86400;
if (!jwtSecret) throw new Error('JWT_SECRET missing');
const jwtService = new JwtService(jwtSecret, jwtExpiresInSeconds);
const authMiddleware = createAuthMiddleware(jwtService);
const userRepository = new DrizzleUserRepository(db);
const memberRepository = new DrizzleMemberRepository(db);
const subjectRepository = new DrizzleSubjectRepository(db);
const scheduleRepository = new DrizzleScheduleRepository(db);
const scheduleSlotRepository = new DrizzleScheduleSlotRepository(db);
const academicYearRepository = new DrizzleAcademicYearRepository(db);

api.use(
  '/api/*',
  cors({
    origin: Bun.env.FRONTEND_URL ?? 'http://localhost:3000',
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  })
);

api.onError(globalErrorMiddleware);

protectedApi.use('/*', authMiddleware);
const protectedRoutes = protectedApi
  .route('/', createOrganizationModule(db, memberRepository))
  .route('/', createUserModule(db))
  .route('/', createMemberModule(db, userRepository))
  .route('/', createDegreeModule(db, memberRepository))
  .route('/', createClassroomModule(db, memberRepository))
  .route('/', createItineraryModule(db, memberRepository))
  .route('/', createSubjectModule(db, memberRepository))
  .route('/', createSubjectGroupModule(db, memberRepository, subjectRepository))
  .route('/', createScheduleModule(db))
  .route('/', createAcademicYearModule(db, memberRepository))
  .route(
    '/',
    createClassroomReservationModule(
      db,
      memberRepository,
      scheduleRepository,
      scheduleSlotRepository,
      academicYearRepository
    )
  );

const routes = api
  .route('/api', createAuthModule(jwtService, userRepository))
  .route('/api', protectedRoutes);

api.get('/reference', Scalar({ url: '/doc', theme: 'moon' }));
api.doc('/doc', { openapi: '3.0.0', info: { version: '1.0.0', title: 'TFG' } });

export default {
  port: 8080,
  fetch: routes.fetch,
};

export type AppType = typeof routes;
