export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
    transform: {
      '^.+\\.ts$': 'ts-jest',
    },
    collectCoverageFrom: [
      'src/**/*.ts',
      '!src/index.ts',
      '!src/**/*.dto.ts',
      '!src/models/**',
      '!src/config/db.ts',
    ],
    coverageThreshold: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    moduleFileExtensions: ['ts', 'js', 'json'],
    verbose: false, // Reducir verbosidad para evitar spam
    forceExit: true,
    detectOpenHandles: true,
    maxWorkers: 1, // Solo un worker para evitar conflictos con MongoDB
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    testTimeout: 30000, // 30 segundos global
    // Configuración específica para evitar memory leaks
    logHeapUsage: false,
    globals: {
      'ts-jest': {
        useESM: true,
      },
    },
    moduleNameMapper: {
      '^(\\.{1,2}/.*)\\.js$': '$1',
    },
  };