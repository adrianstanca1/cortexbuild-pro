import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['**/__tests__/**/*.test.{ts,tsx}', 'tests/**/!(e2e)/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/tests/e2e/**', '**/__tests__/**/*.e2e.{ts,tsx}', '**/__tests__/workflow-editor.test.tsx'],
    setupFiles: ['./vitest.setup.ts'],
    alias: {
      '@': resolve(__dirname, '.'),
    },
    server: {
      deps: {
        inline: ['next-auth', '@prisma/client'],
      },
    },
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
});
