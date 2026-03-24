#!/usr/bin/env node

/**
 * Tests for LearningTracker
 *
 * Coverage:
 * - REV-01: Revision iterations track learnings
 * - REV-04: Learnings preserved across iterations in structured JSON
 */

const { describe, it, beforeEach, afterEach } = require('vitest');
const { expect } = require('vitest');
const fs = require('fs');
const path = require('path');
const os = require('os');
const LearningTracker = require('../../bin/lib/learning-tracker.cjs');

describe('LearningTracker', () => {
  let tracker;
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-tracker-test-'));
    tracker = new LearningTracker({ memoryDir: tempDir });
  });

  afterEach(() => {
    // Cleanup temp files
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('constructor', () => {
    it('should create instance with default memoryDir', () => {
      const defaultTracker = new LearningTracker();
      expect(defaultTracker.memoryDir).toBeDefined();
    });

    it('should create instance with custom memoryDir', () => {
      expect(tracker.memoryDir).toBe(tempDir);
    });

    it('should create memory directory if not exists', () => {
      const newDir = path.join(os.tmpdir(), 'new-learning-dir-' + Date.now());
      try {
        const newTracker = new LearningTracker({ memoryDir: newDir });
        expect(fs.existsSync(newDir)).toBe(true);
      } finally {
        if (fs.existsSync(newDir)) {
          fs.rmSync(newDir, { recursive: true, force: true });
        }
      }
    });
  });

  describe('recordLearning', () => {
    it('should record learning with required fields', async () => {
      const learning = {
        iteration: 1,
        error_type: 'Syntax',
        root_cause: 'Missing semicolon on line 10',
        fix_attempted: 'Added semicolon',
        quality_delta: 15
      };

      const result = await tracker.recordLearning('task-01', learning);

      expect(result.iteration).toBe(1);
      expect(result.error_type).toBe('Syntax');
      expect(result.root_cause).toBe('Missing semicolon on line 10');
      expect(result.fix_attempted).toBe('Added semicolon');
      expect(result.quality_delta).toBe(15);
      expect(result.timestamp).toBeDefined();
      expect(result.tags).toBeDefined();
      expect(Array.isArray(result.tags)).toBe(true);
    });

    it('should generate semantic tags automatically', async () => {
      const learning = {
        iteration: 1,
        error_type: 'Dependency',
        root_cause: 'Module not found: lodash is not installed',
        fix_attempted: 'npm install lodash'
      };

      const result = await tracker.recordLearning('task-02', learning);

      expect(result.tags).toContain('dependency');
      expect(result.tags.length).toBeGreaterThan(0);
    });

    it('should accept custom tags', async () => {
      const learning = {
        iteration: 1,
        error_type: 'Logic',
        root_cause: 'Off-by-one error',
        fix_attempted: 'Fixed loop boundary',
        tags: ['loop', 'boundary', 'array']
      };

      const result = await tracker.recordLearning('task-03', learning);

      expect(result.tags).toEqual(['loop', 'boundary', 'array']);
    });

    it('should persist to MEMORY.json file', async () => {
      await tracker.recordLearning('task-04', {
        iteration: 1,
        error_type: 'Timeout',
        root_cause: 'API request took too long',
        fix_attempted: 'Increased timeout threshold'
      });

      const memoryFile = path.join(tempDir, 'task_04-MEMORY.json');
      expect(fs.existsSync(memoryFile)).toBe(true);

      const data = JSON.parse(fs.readFileSync(memoryFile, 'utf8'));
      expect(data.taskId).toBe('task-04');
      expect(data.revisionCount).toBe(1);
      expect(data.revisions).toHaveLength(1);
      expect(data.revisions[0].error_type).toBe('Timeout');
    });

    it('should track multiple revisions for same task', async () => {
      await tracker.recordLearning('task-05', {
        iteration: 1,
        error_type: 'Syntax',
        root_cause: 'Missing bracket',
        fix_attempted: 'Added bracket'
      });

      await tracker.recordLearning('task-05', {
        iteration: 2,
        error_type: 'Logic',
        root_cause: 'Wrong condition',
        fix_attempted: 'Fixed condition',
        quality_delta: 20
      });

      const learnings = await tracker.getLearnings('task-05');
      expect(learnings.revisionCount).toBe(2);
      expect(learnings.revisions).toHaveLength(2);
      expect(learnings.revisions[0].error_type).toBe('Syntax');
      expect(learnings.revisions[1].error_type).toBe('Logic');
    });

    it('should handle default values for optional fields', async () => {
      const result = await tracker.recordLearning('task-06', {});

      expect(result.iteration).toBe(1);
      expect(result.error_type).toBe('Unknown');
      expect(result.root_cause).toBe('');
      expect(result.fix_attempted).toBe('');
      expect(result.quality_delta).toBe(0);
    });
  });

  describe('getLearnings', () => {
    it('should return empty learnings for new task', async () => {
      const learnings = await tracker.getLearnings('new-task');

      expect(learnings.taskId).toBe('new-task');
      expect(learnings.revisionCount).toBe(0);
      expect(learnings.revisions).toEqual([]);
    });

    it('should return all learnings for a task', async () => {
      await tracker.recordLearning('task-07', {
        iteration: 1,
        error_type: 'Dependency',
        root_cause: 'Missing package'
      });

      await tracker.recordLearning('task-07', {
        iteration: 2,
        error_type: 'Syntax',
        root_cause: 'Parse error'
      });

      const learnings = await tracker.getLearnings('task-07');

      expect(learnings.revisionCount).toBe(2);
      expect(learnings.revisions).toHaveLength(2);
    });

    it('should load learnings from MEMORY.json file', async () => {
      const memoryFile = path.join(tempDir, 'task_08-MEMORY.json');
      const testData = {
        taskId: 'task-08',
        lastUpdated: new Date().toISOString(),
        revisionCount: 2,
        revisions: [
          { iteration: 1, error_type: 'Syntax', root_cause: 'Error 1', timestamp: new Date().toISOString() },
          { iteration: 2, error_type: 'Logic', root_cause: 'Error 2', timestamp: new Date().toISOString() }
        ]
      };
      fs.writeFileSync(memoryFile, JSON.stringify(testData, null, 2));

      const newTracker = new LearningTracker({ memoryDir: tempDir });
      const learnings = await newTracker.getLearnings('task-08');

      expect(learnings.revisionCount).toBe(2);
      expect(learnings.revisions[0].error_type).toBe('Syntax');
      expect(learnings.revisions[1].error_type).toBe('Logic');
    });
  });

  describe('searchLearnings', () => {
    it('should find learnings by error type', async () => {
      await tracker.recordLearning('task-01', {
        iteration: 1,
        error_type: 'Syntax',
        root_cause: 'Missing semicolon'
      });

      await tracker.recordLearning('task-02', {
        iteration: 1,
        error_type: 'Dependency',
        root_cause: 'Module not found'
      });

      await tracker.recordLearning('task-03', {
        iteration: 1,
        error_type: 'Syntax',
        root_cause: 'Unexpected token'
      });

      const results = await tracker.searchLearnings('Syntax');

      expect(results.length).toBe(2);
      expect(results.every(r => r.error_type === 'Syntax')).toBe(true);
    });

    it('should find learnings by root cause keyword', async () => {
      await tracker.recordLearning('task-04', {
        iteration: 1,
        error_type: 'Dependency',
        root_cause: 'lodash module not found'
      });

      await tracker.recordLearning('task-05', {
        iteration: 1,
        error_type: 'Syntax',
        root_cause: 'Missing import statement'
      });

      const results = await tracker.searchLearnings('module');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].root_cause.toLowerCase()).toContain('module');
    });

    it('should find learnings by tag', async () => {
      await tracker.recordLearning('task-06', {
        iteration: 1,
        error_type: 'Logic',
        root_cause: 'Array index out of bounds',
        tags: ['array', 'index', 'bounds']
      });

      const results = await tracker.searchLearnings('array');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].tags).toContain('array');
    });

    it('should limit results', async () => {
      for (let i = 0; i < 15; i++) {
        await tracker.recordLearning(`task-${i}`, {
          iteration: 1,
          error_type: 'Syntax',
          root_cause: `Error ${i}`
        });
      }

      const results = await tracker.searchLearnings('Syntax', { limit: 5 });

      expect(results.length).toBeLessThanOrEqual(5);
    });

    it('should sort by match score', async () => {
      await tracker.recordLearning('task-07', {
        iteration: 1,
        error_type: 'Syntax',
        root_cause: 'Syntax error in parser',
        tags: ['syntax']
      });

      await tracker.recordLearning('task-08', {
        iteration: 1,
        error_type: 'Logic',
        root_cause: 'Minor syntax issue',
        tags: ['logic']
      });

      const results = await tracker.searchLearnings('Syntax');

      // Exact error type match should score higher
      expect(results[0].error_type).toBe('Syntax');
    });
  });

  describe('getLearningsByCategory', () => {
    it('should return learnings for specific category', async () => {
      await tracker.recordLearning('task-01', {
        iteration: 1,
        error_type: 'Dependency',
        root_cause: 'Missing package'
      });

      await tracker.recordLearning('task-02', {
        iteration: 1,
        error_type: 'Dependency',
        root_cause: 'Version conflict'
      });

      await tracker.recordLearning('task-03', {
        iteration: 1,
        error_type: 'Syntax',
        root_cause: 'Parse error'
      });

      const results = await tracker.getLearningsByCategory('Dependency');

      expect(results.length).toBe(2);
      expect(results.every(r => r.error_type === 'Dependency')).toBe(true);
    });
  });

  describe('getPatterns', () => {
    it('should analyze patterns across all learnings', async () => {
      await tracker.recordLearning('task-01', {
        iteration: 1,
        error_type: 'Syntax',
        root_cause: 'Missing semicolon'
      });

      await tracker.recordLearning('task-02', {
        iteration: 1,
        error_type: 'Syntax',
        root_cause: 'Missing semicolon'
      });

      await tracker.recordLearning('task-03', {
        iteration: 1,
        error_type: 'Dependency',
        root_cause: 'Module not found'
      });

      const patterns = await tracker.getPatterns();

      expect(patterns.categoryCount.Syntax).toBe(2);
      expect(patterns.categoryCount.Dependency).toBe(1);
      expect(patterns.totalTasks).toBe(3);
      expect(patterns.totalRevisions).toBe(3);
    });

    it('should identify common root causes', async () => {
      await tracker.recordLearning('task-01', {
        iteration: 1,
        error_type: 'Syntax',
        root_cause: 'Missing semicolon'
      });

      await tracker.recordLearning('task-02', {
        iteration: 1,
        error_type: 'Syntax',
        root_cause: 'Missing semicolon'
      });

      await tracker.recordLearning('task-03', {
        iteration: 1,
        error_type: 'Syntax',
        root_cause: 'Missing bracket'
      });

      const patterns = await tracker.getPatterns();

      expect(patterns.commonRootCauses.length).toBeGreaterThan(0);
      expect(patterns.commonRootCauses[0].cause).toBe('Missing semicolon');
      expect(patterns.commonRootCauses[0].count).toBe(2);
    });

    it('should track task failure counts', async () => {
      await tracker.recordLearning('task-01', {
        iteration: 1,
        error_type: 'Syntax',
        root_cause: 'Error'
      });

      await tracker.recordLearning('task-01', {
        iteration: 2,
        error_type: 'Logic',
        root_cause: 'Error'
      });

      await tracker.recordLearning('task-02', {
        iteration: 1,
        error_type: 'Dependency',
        root_cause: 'Error'
      });

      const patterns = await tracker.getPatterns();

      expect(patterns.taskFailures['task-01']).toBe(2);
      expect(patterns.taskFailures['task-02']).toBe(1);
    });
  });

  describe('clearLearnings', () => {
    it('should clear learnings from memory', async () => {
      await tracker.recordLearning('task-01', {
        iteration: 1,
        error_type: 'Syntax',
        root_cause: 'Error'
      });

      await tracker.clearLearnings('task-01');

      const learnings = await tracker.getLearnings('task-01');
      expect(learnings.revisionCount).toBe(0);
    });

    it('should remove MEMORY.json file', async () => {
      await tracker.recordLearning('task-02', {
        iteration: 1,
        error_type: 'Syntax',
        root_cause: 'Error'
      });

      const memoryFile = path.join(tempDir, 'task_02-MEMORY.json');
      expect(fs.existsSync(memoryFile)).toBe(true);

      await tracker.clearLearnings('task-02');
      expect(fs.existsSync(memoryFile)).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return summary statistics', async () => {
      await tracker.recordLearning('task-01', {
        iteration: 1,
        error_type: 'Syntax',
        root_cause: 'Error',
        success: true
      });

      await tracker.recordLearning('task-02', {
        iteration: 1,
        error_type: 'Dependency',
        root_cause: 'Error',
        success: false
      });

      const stats = await tracker.getStats();

      expect(stats.totalTasks).toBe(2);
      expect(stats.totalRevisions).toBe(2);
      expect(stats.successfulRevisions).toBe(1);
      expect(stats.topCategories).toBeDefined();
      expect(stats.topRootCauses).toBeDefined();
    });
  });

  describe('integration: learning tracking workflow', () => {
    it('should support complete learning tracking across iterations', async () => {
      const taskId = 'integration-task';

      // Simulate multiple revision iterations
      const iterations = [
        { error_type: 'Syntax', root_cause: 'Missing semicolon', fix_attempted: 'Added semicolon', quality_delta: 10 },
        { error_type: 'Logic', root_cause: 'Wrong condition', fix_attempted: 'Fixed condition', quality_delta: 15 },
        { error_type: null, root_cause: 'All issues resolved', fix_attempted: 'Final review', quality_delta: 25, success: true }
      ];

      for (const iteration of iterations) {
        await tracker.recordLearning(taskId, {
          iteration: iterations.indexOf(iteration) + 1,
          ...iteration
        });
      }

      const learnings = await tracker.getLearnings(taskId);
      expect(learnings.revisionCount).toBe(3);
      expect(learnings.revisions[2].success).toBe(true);

      // Search should find the learnings
      const syntaxResults = await tracker.searchLearnings('Syntax');
      expect(syntaxResults.some(r => r.taskId === taskId)).toBe(true);

      // Patterns should reflect the iterations
      const patterns = await tracker.getPatterns();
      expect(patterns.taskFailures[taskId]).toBe(3);
    });
  });

  describe('schema validation', () => {
    it('should produce learnings matching expected schema', async () => {
      const learning = {
        iteration: 1,
        error_type: 'Syntax',
        root_cause: 'Test root cause',
        fix_attempted: 'Test fix',
        quality_delta: 10,
        tags: ['test', 'syntax']
      };

      const result = await tracker.recordLearning('schema-task', learning);

      // Verify all required schema fields
      expect(result).toHaveProperty('iteration');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('error_type');
      expect(result).toHaveProperty('root_cause');
      expect(result).toHaveProperty('fix_attempted');
      expect(result).toHaveProperty('quality_delta');
      expect(result).toHaveProperty('tags');
      expect(result).toHaveProperty('success');

      // Verify types
      expect(typeof result.iteration).toBe('number');
      expect(typeof result.timestamp).toBe('string');
      expect(typeof result.error_type).toBe('string');
      expect(typeof result.root_cause).toBe('string');
      expect(typeof result.fix_attempted).toBe('string');
      expect(typeof result.quality_delta).toBe('number');
      expect(Array.isArray(result.tags)).toBe(true);
      expect(typeof result.success).toBe('boolean');
    });
  });
});
