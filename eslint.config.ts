import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    ignores: ['**/dist/**', '**/.next/**', '**/node_modules/**', '**/build/**', '**/coverage/**'],
  },

  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            'eslint.config.ts',
            'vitest.config.ts',
            'frontend/postcss.config.mjs',
          ],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
]);
