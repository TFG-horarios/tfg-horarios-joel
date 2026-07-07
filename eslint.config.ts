declare global {
  interface ImportMeta {
    dirname: string;
    filename: string;
  }
}

import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    ignores: [
      '**/dist/**',
      '**/.next/**',
      '**/node_modules/**',
      '**/build/**',
      '**/coverage/**',
    ],
  },

  {
    files: ['**/*.{js,mjs,cjs,ts,tsx,mts,cts}'],
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            'eslint.config.ts',
            'frontend/postcss.config.mjs',
            'frontend/vitest.config.mts',
            'frontend/vitest.integration.config.mts',
          ],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  {
    files: ['backend/**/*.{js,ts}', 'shared/**/*.{js,ts}', '*.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  {
    files: ['frontend/**/*.{js,jsx,ts,tsx,mjs}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
]);
