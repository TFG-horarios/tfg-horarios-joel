import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => {
  return c.text('¡Backend working!');
});

export default {
  port: 8080,
  fetch: app.fetch,
};
