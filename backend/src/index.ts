import { OpenAPIHono } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import { cors } from 'hono/cors';
import { organizationsController } from './infrastructure/http/api/organizations/organizations.controller';
import { usersController } from './infrastructure/http/api/users/users.controller';
import { subjectsController } from './infrastructure/http/api/subjects/subjects.controller';
import { subjectGroupsController } from './infrastructure/http/api/subject-groups/subject-groups.controller';
import { classroomsController } from './infrastructure/http/api/classrooms/classrooms.controller';
import { authController } from './infrastructure/http/api/auth/auth.controller';
import { registerDependencies } from './infrastructure/di/register-dependencies';

registerDependencies();

const app = new OpenAPIHono();

app.use(
  '/api/*',
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  })
);

app.route('/api/auth', authController);

app.route('/api/organizations/:orgId/subjects', subjectsController);
app.route('/api/organizations/:orgId/classrooms', classroomsController);
app.route(
  '/api/organizations/:orgId/subjects/:subjectId/groups',
  subjectGroupsController
);
app.route('/api/organizations', organizationsController);
app.route('/api/users', usersController);

app.get(
  '/reference',
  Scalar({
    spec: {
      url: '/doc',
    },
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
