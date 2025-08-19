/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
    }],
  },
  testMatch: [
    '<rootDir>/lib/**/__tests__/**/*.(ts|tsx)',
    '<rootDir>/lib/**/*.(test|spec).(ts|tsx)',
    '<rootDir>/entrypoints/**/__tests__/**/*.(ts|tsx)',
    '<rootDir>/entrypoints/**/*.(test|spec).(ts|tsx)',
  ],
  collectCoverageFrom: [
    'lib/**/*.(ts|tsx)',
    'entrypoints/**/*.(ts|tsx)',
    '!lib/**/*.d.ts',
    '!lib/**/__tests__/**',
    '!entrypoints/**/__tests__/**',
    '!entrypoints/**/main.tsx',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};