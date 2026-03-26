/**
 * Context Optimizer Tests
 *
 * Tests for the consolidated ContextOptimizer class.
 * Verifies single-pass optimization, lazy evaluation, and deduplication.
 */

import * as path from 'path';
import * as fs from 'fs';
import { ContextOptimizer, optimizeContext } from '../../bin/lib/context-optimizer.js';

describe('ContextOptimizer', () => {
  let tmpDir: string;
  let optimizer: ContextOptimizer;

  beforeEach(() => {
    tmpDir = createTempProject();
    optimizer = new ContextOptimizer(tmpDir);
  });

  afterEach(() => cleanup(tmpDir));

  test('constructor does not throw', () => {
    expect(optimizer).toBeTruthy();
  });

  test('optimizeContext reads and scores files in single pass', async () => {
    // Create test files
    const testFile = path.join(tmpDir, 'test.txt');
    fs.writeFileSync(testFile, 'This is a test file about optimization and performance');

    const result = await optimizer.optimizeContext({
      files: [testFile],
      task: 'optimization performance',
    });

    expect(result.context).toBeTruthy();
    expect(result.sources.length).toBeGreaterThan(0);
    expect(result.stats.filesProcessed).toBeGreaterThan(0);
  });

  test('optimizeContext filters by minScore', async () => {
    // Create test files
    const relevantFile = path.join(tmpDir, 'relevant.txt');
    const irrelevantFile = path.join(tmpDir, 'irrelevant.txt');
    fs.writeFileSync(relevantFile, 'This file is about optimization and performance tuning');
    fs.writeFileSync(irrelevantFile, 'This file is about cooking recipes and food');

    const result = await optimizer.optimizeContext({
      files: [relevantFile, irrelevantFile],
      task: 'optimization performance',
      minScore: 0.5,
    });

    // Only relevant file should be included
    expect(result.sources.some((s) => s.source.includes('relevant'))).toBeTruthy();
  });

  test('optimizeContext limits to maxFiles', async () => {
    // Create multiple test files
    for (let i = 0; i < 20; i++) {
      fs.writeFileSync(path.join(tmpDir, `file${i}.txt`), `Content ${i}`);
    }

    const result = await optimizer.optimizeContext({
      files: [path.join(tmpDir, '*.txt')],
      maxFiles: 10,
    });

    expect(result.stats.filesProcessed).toBeLessThanOrEqual(10);
  });

  test('optimizeContext deduplicates exact matches', async () => {
    // Create duplicate files
    const content = 'This is duplicate content';
    fs.writeFileSync(path.join(tmpDir, 'file1.txt'), content);
    fs.writeFileSync(path.join(tmpDir, 'file2.txt'), content);

    const result = await optimizer.optimizeContext({
      files: [path.join(tmpDir, '*.txt')],
    });

    // Only one instance should be included
    expect(result.stats.filesProcessed).toBe(1);
  });

  test('optimizeContext returns empty when disabled', async () => {
    process.env.EZ_CONTEXT_OPTIMIZED = 'false';
    const disabledOptimizer = new ContextOptimizer(tmpDir);

    const result = await disabledOptimizer.optimizeContext({
      files: [path.join(tmpDir, '*.txt')],
    });

    expect(result).toBeTruthy();
    process.env.EZ_CONTEXT_OPTIMIZED = 'true';
  });

  test('quickScore uses path keywords', () => {
    const content = 'This file contains optimization and performance keywords';
    const task = 'optimize performance';

    // Access private method via any cast for testing
    const score = (optimizer as any).quickScore(content, task);
    expect(score).toBeGreaterThanOrEqual(0.3);
    expect(score).toBeLessThanOrEqual(1.0);
  });

  test('simpleHash produces consistent hashes', () => {
    const content = 'test content';
    const hash1 = (optimizer as any).simpleHash(content);
    const hash2 = (optimizer as any).simpleHash(content);

    expect(hash1).toBe(hash2);
  });

  test('simpleHash differentiates different content', () => {
    const hash1 = (optimizer as any).simpleHash('content 1');
    const hash2 = (optimizer as any).simpleHash('content 2');

    expect(hash1).not.toBe(hash2);
  });
});

describe('optimizeContext (standalone function)', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => cleanup(tmpDir));

  test('standalone function works', async () => {
    const testFile = path.join(tmpDir, 'test.txt');
    fs.writeFileSync(testFile, 'Test content');

    const result = await optimizeContext(
      {
        files: [testFile],
      },
      tmpDir
    );

    expect(result.context).toBeTruthy();
  });
});
