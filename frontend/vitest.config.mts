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
    include: ['src/**/*.test.{ts,tsx}'],
    testTimeout: 10000,
    coverage: {
      provider: 'istanbul',
      include: ['src/**/*.{ts,tsx}'],
      reporter: ['lcov', 'text'],
      reportsDirectory: '../coverage/frontend',
      thresholds: {
        statements: 80,
        branches: 60,
        functions: 80,
        lines: 80,
      },
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/messages/**',
        'src/types/**',
        'src/**/types.ts',
        'src/**/*.d.ts',
        'src/app/**',
        'src/components/ui/**',
        'src/components/layout/**',
        'src/components/providers/**',
        'src/components/theme/theme-provider.tsx',
        'src/features/schedule/components/dnd/draggable-slot.tsx',
        'src/features/schedule/components/dnd/droppable-cell.tsx',
        'src/features/schedule/components/schedule-generator.tsx',
        'src/features/schedule/components/schedule-importer.tsx',
        'src/features/schedule/components/schedule-planner-editor.tsx',
        'src/features/schedule/components/schedule-planner-read-only.tsx',
        'src/lib/api/realtime.ts',
        'src/lib/api/server.ts',
        'src/lib/auth/session.ts',
        'src/lib/i18n/request.ts',
        'src/lib/i18n/routing.ts',
        'src/proxy.ts',
        'src/setup-tests.ts',
      ],
    },
  },
});
