import { OpenAPIHono } from '@hono/zod-openapi';
import { apiReference } from '@scalar/hono-api-reference';
import { cors } from 'hono/cors';
import { organizationsController } from './application/api/organizations/organizations.controller';
import { usersController } from './application/api/users/users.controller';
import { subjectsController } from './application/api/subjects/subjects.controller';
import { subjectGroupsController } from './application/api/subject-groups/subject-groups.controller';
import { classroomsController } from './application/api/classrooms/classrooms.controller';

const app = new OpenAPIHono();

app.use(
  '/api/*',
  cors({
    origin: 'http://localhost:3000',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
);

app.get('/', (c) => {
  return c.text('¡Backend working!');
});

app.route('/api/users', usersController);
app.route('/api/organizations/:orgId/subjects', subjectsController);
app.route('/api/organizations/:orgId/classrooms', classroomsController);
app.route('/api/subjects/:subjectId/groups', subjectGroupsController);
app.route('/api/organizations', organizationsController);

app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'TFG Horarios API',
  },
});

app.get(
  '/reference',
  apiReference({
    spec: {
      url: '/doc',
    },
    theme: 'moon',
  })
);

export default {
  port: 8080,
  fetch: app.fetch,
};
