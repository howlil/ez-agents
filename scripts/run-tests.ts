#!/usr/bin/env node
/**
 * Cross-platform test runner — uses Vitest for running tests.
 * This ensures proper ESM support and vitest globals.
 */

import { dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

try {
  // Run vitest with all test files
  execFileSync('npx', ['vitest', 'run', '--config', 'vitest.config.ts'], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: { ...process.env },
  });
} catch (err) {
  const status = (err as { status?: number }).status || 1;
  process.exit(status);
}
