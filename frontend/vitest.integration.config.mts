import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setup-tests.ts'],
    include: ['src/**/*.integration.test.{ts,tsx}'],
    testTimeout: 10000,
    coverage: {
      provider: 'istanbul',
      reporter: ['lcov', 'text'],
      reportsDirectory: '../coverage/frontend-integration',
      all: true,
      include: [
        'src/components/shared/generic-bulk-uploader.tsx',
        'src/components/shared/resource/resource-actions-toolbar.tsx',
        'src/features/academic-year/components/academic-year-form-modal.tsx',
        'src/features/academic-year/components/academic-years-dashboard.tsx',
        'src/features/classroom/components/classroom-actions.tsx',
        'src/features/classroom-reservation/components/reservation-planner.tsx',
        'src/features/degree/components/degree-bulk-uploader.tsx',
        'src/features/organizations/components/organizations-dashboard.tsx',
        'src/features/schedule-time-config/components/time-config-manager.tsx',
      ],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.integration.test.{ts,tsx}',
        'src/test/**',
        'src/app/**',
        'src/messages/**',
        'src/types/**',
        'src/**/actions.ts',
        'src/**/queries.ts',
        'src/**/*.d.ts',
        'src/components/ui/**',
        'src/components/providers/**',
        'src/components/layout/**',
        'src/setup-tests.ts',
      ],
    },
  },
});
