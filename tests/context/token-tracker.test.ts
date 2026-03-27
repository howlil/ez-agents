/**
 * TokenTracker Tests
 *
 * Tests for the TokenTracker class including:
 * - Constructor and configuration
 * - logUsage method (append to metrics.json)
 * - getPhaseSummary method (aggregation, filtering)
 * - Budget violation detection
 * - File I/O operations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TokenTracker } from '../../bin/lib/context/token-tracker.js';
import type { TokenUsage } from '../../bin/lib/context/token-tracker.js';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('TokenTracker', () => {
  let tracker: TokenTracker;
  const testMetricsPath = '.planning/metrics.test.json';

  beforeEach(async () => {
    tracker = new TokenTracker(testMetricsPath);
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

  describe('Constructor', () => {
    it('should create instance with default path', () => {
      const defaultTracker = new TokenTracker();
      expect(defaultTracker).toBeDefined();
    });

    it('should accept custom metrics path', () => {
      const customTracker = new TokenTracker('.planning/custom-metrics.json');
      expect(customTracker).toBeDefined();
    });
  });

  describe('logUsage', () => {
    it('should append token usage to metrics.json', async () => {
      const usage: TokenUsage = {
        phase: 7,
        plan: 1,
        task: 'Implement context slicer',
        tokensUsed: 7200,
        budget: 8000,
        timestamp: new Date().toISOString()
      };

      await tracker.logUsage(usage);

      const content = await fs.readFile(testMetricsPath, 'utf-8');
      const metrics = JSON.parse(content);

      expect(metrics.tokenUsage).toBeDefined();
      expect(Array.isArray(metrics.tokenUsage)).toBe(true);
      expect(metrics.tokenUsage.length).toBe(1);
      expect(metrics.tokenUsage[0].phase).toBe(7);
      expect(metrics.tokenUsage[0].task).toBe('Implement context slicer');
    });

    it('should append multiple usage records', async () => {
      const usage1: TokenUsage = {
        phase: 7,
        plan: 1,
        task: 'Task 1',
        tokensUsed: 7000,
        budget: 8000,
        timestamp: new Date().toISOString()
      };

      const usage2: TokenUsage = {
        phase: 7,
        plan: 1,
        task: 'Task 2',
        tokensUsed: 7500,
        budget: 8000,
        timestamp: new Date().toISOString()
      };

      await tracker.logUsage(usage1);
      await tracker.logUsage(usage2);

      const content = await fs.readFile(testMetricsPath, 'utf-8');
      const metrics = JSON.parse(content);

      expect(metrics.tokenUsage.length).toBe(2);
      expect(metrics.tokenUsage[0].task).toBe('Task 1');
      expect(metrics.tokenUsage[1].task).toBe('Task 2');
    });

    it('should create tokenUsage array if not exists', async () => {
      // First, create a metrics file without tokenUsage
      const initialMetrics = {
        milestone: 'v5.0.0',
        started_at: new Date().toISOString(),
        budget: { ceiling: 50.00, alert_threshold: 0.8, projected: 0.00, spent: 0.00 },
        phases: {},
        cumulative: { total_tokens: 0, total_cost_usd: 0.00, by_provider: {} }
      };

      await fs.writeFile(testMetricsPath, JSON.stringify(initialMetrics, null, 2));

      const usage: TokenUsage = {
        phase: 7,
        plan: 1,
        task: 'Test task',
        tokensUsed: 5000,
        budget: 8000,
        timestamp: new Date().toISOString()
      };

      await tracker.logUsage(usage);

      const content = await fs.readFile(testMetricsPath, 'utf-8');
      const metrics = JSON.parse(content);

      expect(metrics.tokenUsage).toBeDefined();
      expect(metrics.tokenUsage.length).toBe(1);
    });
  });

  describe('getPhaseSummary', () => {
    it('should return phase token summary', async () => {
      const usage1: TokenUsage = {
        phase: 7,
        plan: 1,
        task: 'Task 1',
        tokensUsed: 7000,
        budget: 8000,
        timestamp: new Date().toISOString()
      };

      const usage2: TokenUsage = {
        phase: 7,
        plan: 1,
        task: 'Task 2',
        tokensUsed: 7500,
        budget: 8000,
        timestamp: new Date().toISOString()
      };

      await tracker.logUsage(usage1);
      await tracker.logUsage(usage2);

      const summary = await tracker.getPhaseSummary(7);

      expect(summary.phase).toBe(7);
      expect(summary.totalTokens).toBe(14500);
      expect(summary.taskCount).toBe(2);
      expect(summary.averagePerTask).toBe(7250);
    });

    it('should return zero summary for phase with no usage', async () => {
      const summary = await tracker.getPhaseSummary(99);

      expect(summary.phase).toBe(99);
      expect(summary.totalTokens).toBe(0);
      expect(summary.taskCount).toBe(0);
      expect(summary.averagePerTask).toBe(0);
      expect(summary.budgetViolations).toBe(0);
    });

    it('should filter by phase number', async () => {
      const usage7: TokenUsage = {
        phase: 7,
        plan: 1,
        task: 'Phase 7 Task',
        tokensUsed: 7000,
        budget: 8000,
        timestamp: new Date().toISOString()
      };

      const usage8: TokenUsage = {
        phase: 8,
        plan: 1,
        task: 'Phase 8 Task',
        tokensUsed: 8000,
        budget: 9000,
        timestamp: new Date().toISOString()
      };

      await tracker.logUsage(usage7);
      await tracker.logUsage(usage8);

      const summary7 = await tracker.getPhaseSummary(7);
      const summary8 = await tracker.getPhaseSummary(8);

      expect(summary7.totalTokens).toBe(7000);
      expect(summary8.totalTokens).toBe(8000);
    });
  });

  describe('Budget Violation Detection', () => {
    it('should detect budget violations', async () => {
      const usage: TokenUsage = {
        phase: 7,
        plan: 1,
        task: 'Over budget task',
        tokensUsed: 9000,
        budget: 8000,
        timestamp: new Date().toISOString()
      };

      await tracker.logUsage(usage);

      const summary = await tracker.getPhaseSummary(7);

      expect(summary.budgetViolations).toBe(1);
    });

    it('should not count tasks within budget as violations', async () => {
      const usage: TokenUsage = {
        phase: 7,
        plan: 1,
        task: 'Within budget task',
        tokensUsed: 7000,
        budget: 8000,
        timestamp: new Date().toISOString()
      };

      await tracker.logUsage(usage);

      const summary = await tracker.getPhaseSummary(7);

      expect(summary.budgetViolations).toBe(0);
    });

    it('should count multiple violations', async () => {
      const usage1: TokenUsage = {
        phase: 7,
        plan: 1,
        task: 'Over budget 1',
        tokensUsed: 9000,
        budget: 8000,
        timestamp: new Date().toISOString()
      };

      const usage2: TokenUsage = {
        phase: 7,
        plan: 1,
        task: 'Over budget 2',
        tokensUsed: 10000,
        budget: 8000,
        timestamp: new Date().toISOString()
      };

      await tracker.logUsage(usage1);
      await tracker.logUsage(usage2);

      const summary = await tracker.getPhaseSummary(7);

      expect(summary.budgetViolations).toBe(2);
    });
  });

  describe('isBudgetViolated', () => {
    it('should return true when tokensUsed > budget', () => {
      const usage: TokenUsage = {
        phase: 7,
        plan: 1,
        task: 'Test',
        tokensUsed: 9000,
        budget: 8000,
        timestamp: new Date().toISOString()
      };

      expect(tracker.isBudgetViolated(usage)).toBe(true);
    });

    it('should return false when tokensUsed <= budget', () => {
      const usage: TokenUsage = {
        phase: 7,
        plan: 1,
        task: 'Test',
        tokensUsed: 7000,
        budget: 8000,
        timestamp: new Date().toISOString()
      };

      expect(tracker.isBudgetViolated(usage)).toBe(false);
    });
  });

  describe('getAllUsage', () => {
    it('should return all token usage records', async () => {
      const usage1: TokenUsage = {
        phase: 7,
        plan: 1,
        task: 'Task 1',
        tokensUsed: 7000,
        budget: 8000,
        timestamp: new Date().toISOString()
      };

      const usage2: TokenUsage = {
        phase: 8,
        plan: 1,
        task: 'Task 2',
        tokensUsed: 8000,
        budget: 9000,
        timestamp: new Date().toISOString()
      };

      await tracker.logUsage(usage1);
      await tracker.logUsage(usage2);

      const allUsage = await tracker.getAllUsage();

      expect(allUsage.length).toBe(2);
      expect(allUsage[0].phase).toBe(7);
      expect(allUsage[1].phase).toBe(8);
    });
  });

  describe('getUsageByPhase', () => {
    it('should return usage records filtered by phase', async () => {
      const usage7a: TokenUsage = {
        phase: 7,
        plan: 1,
        task: 'Task 1',
        tokensUsed: 7000,
        budget: 8000,
        timestamp: new Date().toISOString()
      };

      const usage7b: TokenUsage = {
        phase: 7,
        plan: 1,
        task: 'Task 2',
        tokensUsed: 7500,
        budget: 8000,
        timestamp: new Date().toISOString()
      };

      const usage8: TokenUsage = {
        phase: 8,
        plan: 1,
        task: 'Task 3',
        tokensUsed: 8000,
        budget: 9000,
        timestamp: new Date().toISOString()
      };

      await tracker.logUsage(usage7a);
      await tracker.logUsage(usage7b);
      await tracker.logUsage(usage8);

      const phase7Usage = await tracker.getUsageByPhase(7);

      expect(phase7Usage.length).toBe(2);
      expect(phase7Usage.every(u => u.phase === 7)).toBe(true);
    });
  });
});
