import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: [
    './src/modules/auth/infrastructure/database/*.schema.ts',
    './src/modules/user/infrastructure/database/*.schema.ts',
    './src/modules/organization/infrastructure/database/*.schema.ts',
    './src/modules/classroom/infrastructure/database/*.schema.ts',
    './src/modules/subject/infrastructure/database/*.schema.ts',
    './src/modules/subject-group/infrastructure/database/*.schema.ts',
    './src/modules/scheduler/infrastructure/database/*.schema.ts',
  ],
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
