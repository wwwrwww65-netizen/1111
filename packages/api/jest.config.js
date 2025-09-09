const noDb = process.env.NO_DB_TESTS === '1';

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  testPathIgnorePatterns: noDb
    ? [
        '/node_modules/',
        '/dist/',
        '/src/__tests__/e2e\\..*\\.test\\.ts$',
        '/src/__tests__/.*integration.*\\.test\\.ts$',
        '/src/__tests__/products\\.crud\\.test\\.ts$',
        '/src/__tests__/webhooks\\.shipping\\.test\\.ts$',
      ]
    : ['/node_modules/', '/dist/'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
};