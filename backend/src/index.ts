import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';

const app = new OpenAPIHono();

app.get('/', (c) => {
  return c.text('¡Backend working!');
});

app.use(
  '/api/*',
  cors({
    origin: 'http://localhost:3000',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
);

export default {
  port: 8080,
  fetch: app.fetch,
};
