import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: [
    './src/modules/user/infrastructure/db/*.schema.ts',
    './src/modules/organization/infrastructure/db/*.schema.ts',
    './src/modules/classroom/infrastructure/db/*.schema.ts',
    './src/modules/subject/infrastructure/db/*.schema.ts',
    './src/modules/subject-group/infrastructure/db/*.schema.ts',
    './src/modules/itinerary/infrastructure/db/*.schema.ts',
    './src/modules/schedule/infrastructure/db/*.schema.ts',
    './src/modules/degree/infrastructure/db/*.schema.ts',
    './src/modules/schedule-slot/infrastructure/db/*.schema.ts',
    './src/modules/member/infrastructure/db/*.schema.ts',
    './src/modules/classroom-reservation/infrastructure/db/*.schema.ts',
    './src/modules/academic-year/infrastructure/db/*.schema.ts',
  ],
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
