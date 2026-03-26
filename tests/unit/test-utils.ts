/**
 * Test Utilities
 * Shared utilities for unit tests
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Create a temporary directory for testing
 */
export function createTempDir(prefix = 'test-'): string {
  const tempDir = path.join(process.cwd(), 'tests', 'tmp', `${prefix}${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });
  return tempDir;
}

/**
 * Cleanup temporary directory
 */
export function cleanupTempDir(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

/**
 * Re-export test from node:test for convenience
 */
export { test, describe, beforeEach, afterEach, it } from 'node:test';
export { default as assert } from 'node:assert';

/**
 * Create a mock file object for testing
 */
export function createMockFile(
  path: string,
  content: string
): { path: string; content: string } {
  return { path, content };
}

/**
 * Create a mock skill object for testing
 */
export function createMockSkill(overrides?: Partial<{
  name: string;
  description: string;
  version: string;
  category: string;
  triggers: Record<string, unknown>;
  structure: Record<string, unknown>;
  workflow: Record<string, unknown>;
  prerequisites: string[];
  dependencies: Record<string, unknown>;
}>): Record<string, unknown> {
  return {
    name: 'test-skill',
    description: 'A test skill',
    version: '1.0.0',
    category: 'test',
    triggers: {
      keywords: ['test'],
      filePatterns: ['*.test.ts'],
      commands: ['test'],
    },
    structure: {
      directories: ['tests'],
      files: ['test.ts'],
    },
    workflow: {
      setup: ['npm install'],
      execution: ['npm test'],
      cleanup: [],
    },
    prerequisites: [],
    dependencies: {},
    ...overrides,
  };
}

/**
 * Create a mock trade-off for testing
 */
export function createMockTradeoff(overrides?: Partial<{
  id: string;
  title: string;
  description: string;
  options: string[];
  decision: string;
  rationale: string;
  consequences: string[];
}>): Record<string, unknown> {
  return {
    id: 'tradeoff-1',
    title: 'Test Trade-off',
    description: 'A test trade-off',
    options: ['Option A', 'Option B'],
    decision: 'Option A',
    rationale: 'Test rationale',
    consequences: ['Consequence 1'],
    ...overrides,
  };
}

/**
 * Create a mock quality gate result
 */
export function createMockGateResult(overrides?: Partial<{
  passed: boolean;
  violations: Array<{ rule: string; message: string }>;
  warnings: string[];
}>): Record<string, unknown> {
  return {
    passed: true,
    violations: [],
    warnings: [],
    ...overrides,
  };
}
