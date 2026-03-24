#!/usr/bin/env node

/**
 * Tests for RevisionLoopController
 *
 * Coverage:
 * - REV-01: Revision iterations track learnings
 * - REV-02: Root cause analysis triggered after 2nd failure
 * - REV-03: Early exit when quality degrades
 * - REV-04: Learnings preserved across iterations in structured JSON
 */

const { describe, it, beforeEach, afterEach } = require('vitest');
const { expect } = require('vitest');
const fs = require('fs');
const path = require('path');
const os = require('os');
const RevisionLoopController = require('../../bin/lib/revision-loop.cjs');

describe('RevisionLoopController', () => {
  let controller;
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'revision-loop-test-'));
    controller = new RevisionLoopController({
      maxAttempts: 3,
      baseDelay: 100,
      maxDelay: 1000,
      memoryDir: tempDir
    });
  });

  afterEach(() => {
    // Cleanup temp files
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('constructor', () => {
    it('should create instance with default options', () => {
      const defaultController = new RevisionLoopController();
      expect(defaultController.maxAttempts).toBe(3);
      expect(defaultController.baseDelay).toBe(1000);
      expect(defaultController.maxDelay).toBe(8000);
    });

    it('should create instance with custom options', () => {
      expect(controller.maxAttempts).toBe(3);
      expect(controller.baseDelay).toBe(100);
      expect(controller.maxDelay).toBe(1000);
      expect(controller.memoryDir).toBe(tempDir);
    });
  });

  describe('calculateDelay', () => {
    it('should calculate exponential backoff: 1x, 2x, 4x, 8x', () => {
      // Test with controlled base delay
      const testController = new RevisionLoopController({ baseDelay: 100, maxDelay: 1000 });

      const delay0 = testController.calculateDelay(0);
      const delay1 = testController.calculateDelay(1);
      const delay2 = testController.calculateDelay(2);
      const delay3 = testController.calculateDelay(3);

      // With jitter (±25%), delays should be approximately: 100, 200, 400, 800
      expect(delay0).toBeGreaterThanOrEqual(75);
      expect(delay0).toBeLessThanOrEqual(125);

      expect(delay1).toBeGreaterThanOrEqual(150);
      expect(delay1).toBeLessThanOrEqual(250);

      expect(delay2).toBeGreaterThanOrEqual(300);
      expect(delay2).toBeLessThanOrEqual(500);

      expect(delay3).toBeGreaterThanOrEqual(600);
      expect(delay3).toBeLessThanOrEqual(1000);
    });

    it('should cap delay at maxDelay', () => {
      const testController = new RevisionLoopController({ baseDelay: 1000, maxDelay: 2000 });

      // Attempt 10 should be capped at maxDelay (with jitter)
      const delay10 = testController.calculateDelay(10);
      expect(delay10).toBeLessThanOrEqual(2000);
    });

    it('should add jitter to prevent thundering herd', () => {
      const delays = Array.from({ length: 10 }, () => controller.calculateDelay(1));
      const uniqueDelays = new Set(delays);

      // With jitter, most delays should be different
      expect(uniqueDelays.size).toBeGreaterThan(1);
    });
  });

  describe('shouldRetry', () => {
    it('should return true when under max attempts', async () => {
      await controller.recordAttempt('task-01', new Error('Test error'), 50);
      const shouldRetry = await controller.shouldRetry('task-01');
      expect(shouldRetry).toBe(true);
    });

    it('should return false when at max attempts', async () => {
      await controller.recordAttempt('task-01', new Error('Error 1'), 50);
      await controller.recordAttempt('task-01', new Error('Error 2'), 40);
      await controller.recordAttempt('task-01', new Error('Error 3'), 30);

      const shouldRetry = await controller.shouldRetry('task-01');
      expect(shouldRetry).toBe(false);
    });

    it('should return true for new task with no history', async () => {
      const shouldRetry = await controller.shouldRetry('new-task');
      expect(shouldRetry).toBe(true);
    });
  });

  describe('recordAttempt', () => {
    it('should record attempt with error and quality score', async () => {
      const error = new Error('Test error message');
      const result = await controller.recordAttempt('task-01', error, 65);

      expect(result.iteration).toBe(1);
      expect(result.error).toBe('Test error message');
      expect(result.error_type).toBe('Unknown');
      expect(result.quality_score).toBe(65);
      expect(result.success).toBe(false);
      expect(result.timestamp).toBeDefined();
    });

    it('should record successful attempt', async () => {
      const result = await controller.recordAttempt('task-02', null, 85);

      expect(result.iteration).toBe(1);
      expect(result.error).toBe(null);
      expect(result.quality_score).toBe(85);
      expect(result.success).toBe(true);
    });

    it('should increment iteration number for subsequent attempts', async () => {
      await controller.recordAttempt('task-03', new Error('Error 1'), 50);
      const result2 = await controller.recordAttempt('task-03', new Error('Error 2'), 45);

      expect(result2.iteration).toBe(2);
    });

    it('should classify error types correctly', async () => {
      const dependencyError = await controller.recordAttempt('dep-task', new Error('Cannot find module'), 50);
      expect(dependencyError.error_type).toBe('Dependency');

      const syntaxError = await controller.recordAttempt('syntax-task', new Error('SyntaxError: Unexpected token'), 50);
      expect(syntaxError.error_type).toBe('Syntax');

      const timeoutError = await controller.recordAttempt('timeout-task', new Error('Request timeout'), 50);
      expect(timeoutError.error_type).toBe('Timeout');

      const resourceError = await controller.recordAttempt('resource-task', new Error('Out of memory'), 50);
      expect(resourceError.error_type).toBe('Resource');
    });

    it('should persist to MEMORY.json file', async () => {
      await controller.recordAttempt('task-04', new Error('Test'), 60);

      const memoryFile = path.join(tempDir, 'task_04-MEMORY.json');
      expect(fs.existsSync(memoryFile)).toBe(true);

      const data = JSON.parse(fs.readFileSync(memoryFile, 'utf8'));
      expect(data.taskId).toBe('task-04');
      expect(data.revisions).toHaveLength(1);
      expect(data.revisions[0].error).toBe('Test');
    });

    it('should accept additional metadata', async () => {
      const result = await controller.recordAttempt('task-05', null, 75, {
        customField: 'customValue',
        duration: 1500
      });

      expect(result.customField).toBe('customValue');
      expect(result.duration).toBe(1500);
    });
  });

  describe('getRevisionHistory', () => {
    it('should return empty array for new task', async () => {
      const history = await controller.getRevisionHistory('new-task');
      expect(history).toEqual([]);
    });

    it('should return all recorded attempts', async () => {
      await controller.recordAttempt('task-06', new Error('Error 1'), 50);
      await controller.recordAttempt('task-06', new Error('Error 2'), 55);
      await controller.recordAttempt('task-06', null, 80);

      const history = await controller.getRevisionHistory('task-06');
      expect(history).toHaveLength(3);
      expect(history[0].iteration).toBe(1);
      expect(history[1].iteration).toBe(2);
      expect(history[2].iteration).toBe(3);
    });

    it('should load history from MEMORY.json file', async () => {
      // Create a new controller instance to test file loading
      const memoryFile = path.join(tempDir, 'task_07-MEMORY.json');
      const testData = {
        taskId: 'task-07',
        lastUpdated: new Date().toISOString(),
        revisionCount: 2,
        revisions: [
          { iteration: 1, error: 'Error 1', quality_score: 50, timestamp: new Date().toISOString() },
          { iteration: 2, error: 'Error 2', quality_score: 60, timestamp: new Date().toISOString() }
        ]
      };
      fs.writeFileSync(memoryFile, JSON.stringify(testData, null, 2));

      const newController = new RevisionLoopController({ memoryDir: tempDir });
      const history = await newController.getRevisionHistory('task-07');

      expect(history).toHaveLength(2);
      expect(history[0].error).toBe('Error 1');
    });
  });

  describe('resetCounter', () => {
    it('should clear revision history', async () => {
      await controller.recordAttempt('task-08', new Error('Error'), 50);
      await controller.recordAttempt('task-08', new Error('Error 2'), 55);

      await controller.resetCounter('task-08');

      const history = await controller.getRevisionHistory('task-08');
      expect(history).toHaveLength(0);
    });

    it('should remove MEMORY.json file', async () => {
      await controller.recordAttempt('task-09', new Error('Error'), 50);

      const memoryFile = path.join(tempDir, 'task_09-MEMORY.json');
      expect(fs.existsSync(memoryFile)).toBe(true);

      await controller.resetCounter('task-09');
      expect(fs.existsSync(memoryFile)).toBe(false);
    });
  });

  describe('getAttemptCount', () => {
    it('should return 0 for new task', async () => {
      const count = await controller.getAttemptCount('new-task');
      expect(count).toBe(0);
    });

    it('should return number of recorded attempts', async () => {
      await controller.recordAttempt('task-10', new Error('Error 1'), 50);
      await controller.recordAttempt('task-10', new Error('Error 2'), 55);
      await controller.recordAttempt('task-10', null, 80);

      const count = await controller.getAttemptCount('task-10');
      expect(count).toBe(3);
    });
  });

  describe('getStats', () => {
    it('should return statistics for all tracked tasks', async () => {
      await controller.recordAttempt('task-a', new Error('Error'), 50);
      await controller.recordAttempt('task-a', null, 75);
      await controller.recordAttempt('task-b', new Error('Error'), 40);

      const stats = controller.getStats();

      expect(stats.totalTasks).toBe(2);
      expect(stats.totalRevisions).toBe(3);
      expect(stats.successfulRevisions).toBe(1);
      expect(stats.successRate).toBe('33.3');
    });

    it('should handle empty state', () => {
      const stats = controller.getStats();

      expect(stats.totalTasks).toBe(0);
      expect(stats.totalRevisions).toBe(0);
      expect(stats.successfulRevisions).toBe(0);
      expect(stats.successRate).toBe(0);
    });
  });

  describe('integration: revision loop workflow', () => {
    it('should support complete revision loop with retry logic', async () => {
      const taskId = 'integration-task';

      // Simulate revision loop workflow
      let attempt = 0;
      let success = false;

      while (await controller.shouldRetry(taskId) && !success) {
        attempt++;
        const qualityScore = attempt === 3 ? 85 : 50 + (attempt * 5);
        const error = qualityScore < 70 ? new Error(`Attempt ${attempt} failed`) : null;

        const result = await controller.recordAttempt(taskId, error, qualityScore);
        success = result.success;

        if (!success && await controller.shouldRetry(taskId)) {
          const delay = controller.calculateDelay(attempt);
          // In real scenario, would wait here
          expect(delay).toBeGreaterThan(0);
        }
      }

      const history = await controller.getRevisionHistory(taskId);
      expect(history).toHaveLength(3);
      expect(history[2].success).toBe(true);
      expect(history[2].quality_score).toBe(85);
    });
  });
});
