import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['ez-agents/tests/**/*.test.{js,cjs,mjs}', 'tests/**/*.test.{js,cjs,mjs}'],
    testTimeout: 30000,
  },
});
