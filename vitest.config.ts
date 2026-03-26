import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: [
      'tests/unit/**/*.test.ts',
      'tests/integration/**/*.test.ts',
      'tests/types/**/*.types.test.ts'
    ],
    exclude: [
      'tests/fixtures/**',
      'node_modules/**'
    ],
    testTimeout: 30000,
    pool: 'forks',
    poolOptions: {
      forks: {
        isolate: false,
      },
    },
    coverage: {
      provider: 'c8',
      threshold: 70,
      include: ['bin/lib/**/*.ts'],
      exclude: ['tests/**', 'node_modules/**']
    }
  },
});
