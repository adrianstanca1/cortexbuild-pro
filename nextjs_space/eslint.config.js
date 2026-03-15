/** @type {import('eslint').Linter.Config} */
const config = {
  ignores: ['.next/', 'node_modules/', 'dist/', 'build/', 'coverage/'],
  overrides: [
    {
      files: ['**/*.{js,jsx,ts,tsx}'],
      extends: [
        'next/core-web-vitals',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'prettier'
      ],
      parserOptions: {
        project: ['./tsconfig.json'],
      },
      settings: {
        react: {
          version: 'detect',
        },
      },
      rules: {
        // TypeScript ESLint rules
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        
        // React rules
        'react/react-in-jsx-scope': 'off',
        'react/prop-types': 'off',
        
        // General rules
        'no-console': ['warn', { allow: ['warn', 'error'] }],
        
        // Prettier
        'prettier/prettier': 'error',
      },
    },
  ],
};

export default config;