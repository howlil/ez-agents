import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: [
      'ez-agents/tests/**/*.test.{ts,js}',
      'tests/**/*.test.{ts,js}'
    ],
    testTimeout: 30000,
  },
});
