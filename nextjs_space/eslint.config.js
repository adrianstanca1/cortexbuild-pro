import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-plugin-prettier';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
  // Ignore patterns
  {
    ignores: [
      '.next/',
      'node_modules/',
      'dist/',
      'build/',
      'coverage/',
      '**/*.config.js',
      '**/*.config.ts',
      '__tests__/',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      'tests/',
      'vitest.config.ts',
      'vitest.server.config.ts',
      'vitest.setup.ts',
      'validation-script.ts',
      'scripts/',
      'server/',
      '_archived_variants/',
      'public/',
      'simple-validation.js',
      'types/serviceworker.d.ts',
    ]
  },
  // Base JS recommended rules
  js.configs.recommended,
  // TypeScript and React files
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
      },
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      'react': react,
      'react-hooks': reactHooks,
      'prettier': prettier,
    },
    rules: {
      // TypeScript ESLint rules
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-require-imports': 'off',

      // React rules
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // General rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': 'off', // Use @typescript-eslint/no-unused-vars instead
      'no-undef': 'off', // TypeScript handles this

      // Prettier - set to warn for now to allow build to proceed
      'prettier/prettier': 'warn',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  // JavaScript files
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
];