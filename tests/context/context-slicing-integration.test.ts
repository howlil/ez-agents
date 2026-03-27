/**
 * Context Slicing Integration Tests
 *
 * End-to-end integration tests for:
 * - ContextSlicer → ContextOptimizer integration
 * - ContextSlicer → SummarizeStrategy integration
 * - TokenTracker → metrics.json integration
 * - Full workflow: slice → score → summarize → cache → track
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ContextSlicer } from '../../bin/lib/context/context-slicer.js';
import { TokenTracker } from '../../bin/lib/context/token-tracker.js';
import { ContextOptimizer } from '../../bin/lib/context/context-optimizer.js';
import * as fs from 'fs/promises';

describe('Context Slicing Integration', () => {
  const testMetricsPath = '.planning/metrics.integration.test.json';

  beforeEach(async () => {
    // Clean up test file before each test
    try {
      await fs.unlink(testMetricsPath);
    } catch {
      // File doesn't exist yet - that's ok
    }
  });

  afterEach(async () => {
    // Clean up test file after each test
    try {
      await fs.unlink(testMetricsPath);
    } catch {
      // File doesn't exist - that's ok
    }
  });

  it('should integrate ContextSlicer with ContextOptimizer', async () => {
    const slicer = new ContextSlicer();
    const files = ['package.json'];
    const task = 'Integration test';

    const result = await slicer.sliceContext(files, task);

    expect(result).toBeDefined();
    expect(result.context).toBeDefined();
    expect(result.tiers.hot).toBeDefined();
    expect(result.tiers.warm).toBeDefined();
    expect(result.tiers.cold).toBeDefined();
    expect(result.stats.totalTokens).toBeLessThanOrEqual(8000);
  });

  it('should integrate ContextSlicer with SummarizeStrategy', async () => {
    const slicer = new ContextSlicer({
      summarizationThreshold: 0.5
    });

    const result = await slicer.sliceContext(['package.json'], 'Test task');

    // Verify summarization was attempted (even if no files met threshold)
    expect(result).toBeDefined();
    expect(result.stats.summarizedCount).toBeGreaterThanOrEqual(0);
  });

  it('should track metrics in metrics.json', async () => {
    const slicer = new ContextSlicer();
    const tracker = new TokenTracker(testMetricsPath);

    const result = await slicer.sliceContext(['package.json'], 'Test task');

    await tracker.logUsage({
      phase: 7,
      plan: 1,
      task: 'Integration test',
      tokensUsed: result.stats.totalTokens,
      budget: 8000,
      timestamp: new Date().toISOString()
    });

    const summary = await tracker.getPhaseSummary(7);

    expect(summary.totalTokens).toBeGreaterThan(0);
    expect(summary.taskCount).toBe(1);
  });

  it('should cache results for repeated calls', async () => {
    const slicer = new ContextSlicer();
    const files = ['package.json'];
    const task = 'Cache test';

    // First call (cache miss)
    const result1 = await slicer.sliceContext(files, task);

    // Second call (cache hit)
    const result2 = await slicer.sliceContext(files, task);

    // Both should have valid results
    expect(result1).toBeDefined();
    expect(result2).toBeDefined();
    expect(result1.context).toBe(result2.context);
  });

  it('should enforce token budget across full workflow', async () => {
    const slicer = new ContextSlicer({
      tokenBudget: 5000,
      minScore: 0.3,
      maxFiles: 10
    });

    const result = await slicer.sliceContext(['package.json'], 'Budget test');

    expect(result.stats.totalTokens).toBeLessThanOrEqual(5000);
    expect(result.stats.budgetRemaining).toBeGreaterThanOrEqual(0);
  });

  it('should classify tiers correctly in end-to-end workflow', async () => {
    const slicer = new ContextSlicer();

    const result = await slicer.sliceContext(['package.json'], 'Tier test');

    // Verify tier structure
    expect(result.tiers).toBeDefined();
    expect(Array.isArray(result.tiers.hot)).toBe(true);
    expect(Array.isArray(result.tiers.warm)).toBe(true);
    expect(Array.isArray(result.tiers.cold)).toBe(true);
  });

  it('should handle multiple file patterns', async () => {
    const slicer = new ContextSlicer();

    const result = await slicer.sliceContext(
      ['package.json', 'tsconfig.json'],
      'Multiple files test'
    );

    expect(result).toBeDefined();
    expect(result.stats.filesIncluded).toBeGreaterThan(0);
  });

  it('should provide stats for metrics dashboard', async () => {
    const slicer = new ContextSlicer();

    const result = await slicer.sliceContext(['package.json'], 'Stats test');

    // Verify all stats are present
    expect(result.stats).toBeDefined();
    expect(typeof result.stats.totalTokens).toBe('number');
    expect(typeof result.stats.budgetUsed).toBe('number');
    expect(typeof result.stats.budgetRemaining).toBe('number');
    expect(typeof result.stats.filesIncluded).toBe('number');
    expect(typeof result.stats.filesExcluded).toBe('number');
    expect(typeof result.stats.summarizedCount).toBe('number');
    expect(typeof result.stats.cacheHits).toBe('number');
    expect(typeof result.stats.cacheMisses).toBe('number');
  });

  it('should work with ContextOptimizer directly', async () => {
    const optimizer = new ContextOptimizer();

    const result = await optimizer.optimizeContext({
      files: ['package.json'],
      task: 'Direct optimizer test',
      minScore: 0.3,
      maxFiles: 5,
      maxTokens: 5000
    });

    expect(result).toBeDefined();
    expect(result.context).toBeDefined();
    expect(result.sources.length).toBeGreaterThan(0);
    expect(result.stats.totalTokens).toBeLessThanOrEqual(5000);
  });

  it('should detect budget violations in TokenTracker', async () => {
    const tracker = new TokenTracker(testMetricsPath);

    await tracker.logUsage({
      phase: 7,
      plan: 1,
      task: 'Over budget test',
      tokensUsed: 9000,
      budget: 8000,
      timestamp: new Date().toISOString()
    });

    const summary = await tracker.getPhaseSummary(7);

    expect(summary.budgetViolations).toBe(1);
  });
});
