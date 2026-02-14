module.exports = {
    projects: [
        // Backend tests (Node environment)
        {
            displayName: 'backend',
            preset: 'ts-jest/presets/default-esm',
            testEnvironment: 'node',
            setupFiles: ['<rootDir>/jest.setup.js'],
            rootDir: './server',
            extensionsToTreatAsEsm: ['.ts'],
            moduleNameMapper: {
                '^(\\.{1,2}/.*)\\.js$': '$1',
            },
            transform: {
                '^.+\\.tsx?$': [
                    'ts-jest',
                    {
                        useESM: true,
                    },
                ],
            },
            testMatch: ['<rootDir>/__tests__/**/*.test.ts', '<rootDir>/tests/**/*.test.ts'],
            moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
        },
        // Frontend tests (jsdom environment)
        {
            displayName: 'frontend',
            testEnvironment: 'jsdom',
            rootDir: './',
            moduleNameMapper: {
                '^@/(.*)$': '<rootDir>/src/$1',
                '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
            },
            transform: {
                '^.+\\.[tj]sx?$': [
                    'babel-jest',
                    {
                        presets: [
                            ['@babel/preset-env', { targets: { node: 'current' } }],
                            ['@babel/preset-react', { runtime: 'automatic' }],
                            '@babel/preset-typescript',
                        ],
                        plugins: ['babel-plugin-transform-import-meta'],
                    },
                ],
            },
            testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/tests/**/*.test.tsx'],
            setupFiles: ['<rootDir>/tests/jest.setup.ts'],
            setupFilesAfterEnv: ['<rootDir>/tests/jest.after-env.ts', '<rootDir>/tests/setup.test.ts'],
            moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
        },
    ],
};
