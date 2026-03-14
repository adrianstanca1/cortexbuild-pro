import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Enable global test APIs (describe, it, expect)
    globals: true,
    // Use jsdom for DOM testing
    environment: 'jsdom',
    // Setup files to run before tests
    setupFiles: ['./tests/vitest.setup.ts'],
    // Include patterns
    include: ['tests/**/*.{test,spec}.{ts,tsx}', 'src/**/*.{test,spec}.{ts,tsx}'],
    // Exclude patterns
    exclude: ['tests/e2e/**/*', 'node_modules/**/*'],
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
        'server/',
        'nextjs_space/',
        '_archived_variants/',
      ],
      thresholds: {
        lines: 0,
        functions: 0,
        branches: 0,
        statements: 0,
      },
    },
    // Reporters
    reporters: ['default', 'json', 'html'],
    outputFile: {
      json: './test-results/vitest-results.json',
      html: './test-results/vitest-report.html',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
});
