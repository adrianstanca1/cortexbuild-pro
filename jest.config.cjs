module.exports = {
    projects: [
        // Backend tests (Node environment)
        {
            displayName: 'backend',
            preset: 'ts-jest/presets/default-esm',
            testEnvironment: 'node',
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
            preset: 'ts-jest',
            testEnvironment: 'jsdom',
            rootDir: './',
            moduleNameMapper: {
                '^@/(.*)$': '<rootDir>/src/$1',
                '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
            },
            transform: {
                '^.+\\.tsx?$': 'ts-jest',
            },
            testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/tests/**/*.test.tsx'],
            setupFilesAfterEnv: ['<rootDir>/tests/setup.test.ts'],
            moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
        },
    ],
};