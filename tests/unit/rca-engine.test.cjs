#!/usr/bin/env node

/**
 * Tests for RCAEngine
 *
 * Coverage:
 * - REV-02: Root cause analysis performed after 2nd failure
 */

const { describe, it, beforeEach, afterEach } = require('vitest');
const { expect } = require('vitest');
const RCAEngine, { ErrorCategory, FIX_STRATEGIES } = require('../../bin/lib/rca-engine.cjs');

describe('RCAEngine', () => {
  let rca;

  beforeEach(() => {
    rca = new RCAEngine();
  });

  describe('constructor', () => {
    it('should create instance with default options', () => {
      const defaultRca = new RCAEngine();
      expect(defaultRca.triggerThreshold).toBe(2);
    });

    it('should create instance with custom trigger threshold', () => {
      const customRca = new RCAEngine({ triggerThreshold: 3 });
      expect(customRca.triggerThreshold).toBe(3);
    });
  });

  describe('ErrorCategory enum', () => {
    it('should have all 5 standard categories', () => {
      expect(ErrorCategory.DEPENDENCY).toBe('Dependency');
      expect(ErrorCategory.SYNTAX).toBe('Syntax');
      expect(ErrorCategory.LOGIC).toBe('Logic');
      expect(ErrorCategory.RESOURCE).toBe('Resource');
      expect(ErrorCategory.TIMEOUT).toBe('Timeout');
      expect(ErrorCategory.UNKNOWN).toBe('Unknown');
    });
  });

  describe('FIX_STRATEGIES', () => {
    it('should have strategies for all categories', () => {
      expect(FIX_STRATEGIES[ErrorCategory.DEPENDENCY]).toBeDefined();
      expect(FIX_STRATEGIES[ErrorCategory.SYNTAX]).toBeDefined();
      expect(FIX_STRATEGIES[ErrorCategory.LOGIC]).toBeDefined();
      expect(FIX_STRATEGIES[ErrorCategory.RESOURCE]).toBeDefined();
      expect(FIX_STRATEGIES[ErrorCategory.TIMEOUT]).toBeDefined();
    });

    it('should have multiple strategies per category', () => {
      expect(FIX_STRATEGIES[ErrorCategory.DEPENDENCY].length).toBeGreaterThan(0);
      expect(FIX_STRATEGIES[ErrorCategory.SYNTAX].length).toBeGreaterThan(0);
    });
  });

  describe('analyze', () => {
    it('should classify Dependency errors correctly', async () => {
      const error = new Error('Cannot find module \'lodash\'');
      const context = {
        taskId: 'task-01',
        taskType: 'build',
        recentChanges: ['package.json'],
        failureCount: 2
      };

      const analysis = await rca.analyze(error, context);

      expect(analysis.category).toBe(ErrorCategory.DEPENDENCY);
      expect(analysis.taskId).toBe('task-01');
      expect(analysis.error_message).toContain('Cannot find module');
    });

    it('should classify Syntax errors correctly', async () => {
      const error = new Error('SyntaxError: Unexpected token }');
      const context = {
        taskId: 'task-02',
        taskType: 'lint',
        recentChanges: ['src/index.js'],
        failureCount: 2
      };

      const analysis = await rca.analyze(error, context);

      expect(analysis.category).toBe(ErrorCategory.SYNTAX);
    });

    it('should classify Logic errors correctly', async () => {
      const error = new Error('Assertion failed: expected 5, received 3');
      const context = {
        taskId: 'task-03',
        taskType: 'test',
        recentChanges: ['src/calculator.js'],
        failureCount: 2
      };

      const analysis = await rca.analyze(error, context);

      expect(analysis.category).toBe(ErrorCategory.LOGIC);
    });

    it('should classify Resource errors correctly', async () => {
      const error = new Error('Error: ENOSPC: no space left on device');
      const context = {
        taskId: 'task-04',
        taskType: 'build',
        recentChanges: [],
        failureCount: 2
      };

      const analysis = await rca.analyze(error, context);

      expect(analysis.category).toBe(ErrorCategory.RESOURCE);
    });

    it('should classify Timeout errors correctly', async () => {
      const error = new Error('Error: Request timeout after 30000ms');
      const context = {
        taskId: 'task-05',
        taskType: 'api',
        recentChanges: ['src/api.js'],
        failureCount: 2
      };

      const analysis = await rca.analyze(error, context);

      expect(analysis.category).toBe(ErrorCategory.TIMEOUT);
    });

    it('should classify unknown errors correctly', async () => {
      const error = new Error('Some unknown error occurred');
      const context = {
        taskId: 'task-06',
        taskType: 'unknown',
        recentChanges: [],
        failureCount: 2
      };

      const analysis = await rca.analyze(error, context);

      expect(analysis.category).toBe(ErrorCategory.UNKNOWN);
    });

    it('should include recommended actions', async () => {
      const error = new Error('Cannot find module \'express\'');
      const context = {
        taskId: 'task-07',
        taskType: 'build',
        recentChanges: [],
        failureCount: 2
      };

      const analysis = await rca.analyze(error, context);

      expect(analysis.recommended_actions).toBeDefined();
      expect(analysis.recommended_actions.length).toBeGreaterThan(0);
    });

    it('should calculate confidence score', async () => {
      const error = new Error('SyntaxError: Unexpected token');
      const context = {
        taskId: 'task-08',
        taskType: 'lint',
        recentChanges: [],
        failureCount: 2
      };

      const analysis = await rca.analyze(error, context);

      expect(analysis.confidence).toBeGreaterThan(0);
      expect(analysis.confidence).toBeLessThanOrEqual(1);
    });

    it('should analyze context for risk factors', async () => {
      const error = new Error('Cannot find module');
      const context = {
        taskId: 'task-09',
        taskType: 'build',
        recentChanges: ['package.json', 'src/config.js'],
        dependencyState: {
          outdated: ['lodash'],
          missing: ['express'],
          conflicts: []
        },
        failureCount: 2
      };

      const analysis = await rca.analyze(error, context);

      expect(analysis.context_analysis).toBeDefined();
      expect(analysis.context_analysis.dependencyIssues.length).toBeGreaterThan(0);
    });

    it('should detect patterns on multiple failures', async () => {
      const context = {
        taskId: 'task-10',
        taskType: 'build',
        recentChanges: [],
        failureCount: 3
      };

      // First analysis
      await rca.analyze(new Error('Cannot find module'), context);

      // Second analysis (same category)
      const analysis = await rca.analyze(new Error('Module not found: express'), context);

      expect(analysis.patterns).toBeDefined();
      expect(analysis.patterns.isRecurring).toBe(true);
    });

    it('should store analysis history', async () => {
      const context = {
        taskId: 'task-11',
        taskType: 'build',
        recentChanges: [],
        failureCount: 2
      };

      await rca.analyze(new Error('Error 1'), context);
      await rca.analyze(new Error('Error 2'), context);

      const history = rca.getAnalysisHistory('task-11');
      expect(history.length).toBe(2);
    });
  });

  describe('suggestFix', () => {
    it('should suggest fix for Dependency category', () => {
      const fix = rca.suggestFix(ErrorCategory.DEPENDENCY);

      expect(fix.category).toBe(ErrorCategory.DEPENDENCY);
      expect(fix.primary_fix).toBeDefined();
      expect(fix.alternative_fixes).toBeDefined();
      expect(fix.all_strategies.length).toBeGreaterThan(0);
    });

    it('should suggest fix for Syntax category', () => {
      const fix = rca.suggestFix(ErrorCategory.SYNTAX);

      expect(fix.category).toBe(ErrorCategory.SYNTAX);
      expect(fix.primary_fix).toContain('lint');
    });

    it('should suggest fix for Logic category', () => {
      const fix = rca.suggestFix(ErrorCategory.LOGIC);

      expect(fix.category).toBe(ErrorCategory.LOGIC);
      expect(fix.primary_fix).toBeDefined();
    });

    it('should suggest fix for Resource category', () => {
      const fix = rca.suggestFix(ErrorCategory.RESOURCE);

      expect(fix.category).toBe(ErrorCategory.RESOURCE);
      expect(fix.primary_fix).toBeDefined();
    });

    it('should suggest fix for Timeout category', () => {
      const fix = rca.suggestFix(ErrorCategory.TIMEOUT);

      expect(fix.category).toBe(ErrorCategory.TIMEOUT);
      expect(fix.primary_fix).toBeDefined();
    });

    it('should estimate success rate', () => {
      const fix = rca.suggestFix(ErrorCategory.SYNTAX);

      expect(fix.estimated_success_rate).toBeGreaterThan(0);
      expect(fix.estimated_success_rate).toBeLessThanOrEqual(1);
    });

    it('should handle unknown category', () => {
      const fix = rca.suggestFix('UnknownCategory');

      expect(fix.category).toBe('UnknownCategory');
      expect(fix.primary_fix).toBeDefined();
    });
  });

  describe('shouldTrigger', () => {
    it('should return false for first failure', () => {
      const shouldTrigger = rca.shouldTrigger('task-01', 1);
      expect(shouldTrigger).toBe(false);
    });

    it('should return true for second failure (threshold)', () => {
      const shouldTrigger = rca.shouldTrigger('task-02', 2);
      expect(shouldTrigger).toBe(true);
    });

    it('should return true for subsequent failures', () => {
      const shouldTrigger = rca.shouldTrigger('task-03', 5);
      expect(shouldTrigger).toBe(true);
    });

    it('should respect custom trigger threshold', () => {
      const customRca = new RCAEngine({ triggerThreshold: 3 });

      expect(customRca.shouldTrigger('task-04', 2)).toBe(false);
      expect(customRca.shouldTrigger('task-04', 3)).toBe(true);
    });
  });

  describe('getAnalysisHistory', () => {
    it('should return empty array for unknown task', () => {
      const history = rca.getAnalysisHistory('unknown-task');
      expect(history).toEqual([]);
    });

    it('should return all analyses for a task', async () => {
      const context = {
        taskId: 'task-05',
        taskType: 'build',
        recentChanges: [],
        failureCount: 2
      };

      await rca.analyze(new Error('Error 1'), context);
      await rca.analyze(new Error('Error 2'), context);
      await rca.analyze(new Error('Error 3'), context);

      const history = rca.getAnalysisHistory('task-05');
      expect(history.length).toBe(3);
    });
  });

  describe('_classifyError', () => {
    it('should handle string errors', () => {
      const category = rca._classifyError('Cannot find module lodash');
      expect(category).toBe(ErrorCategory.DEPENDENCY);
    });

    it('should handle Error objects', () => {
      const category = rca._classifyError(new Error('SyntaxError: parse error'));
      expect(category).toBe(ErrorCategory.SYNTAX);
    });

    it('should handle null/undefined', () => {
      const category1 = rca._classifyError(null);
      expect(category1).toBe(ErrorCategory.UNKNOWN);

      const category2 = rca._classifyError(undefined);
      expect(category2).toBe(ErrorCategory.UNKNOWN);
    });

    it('should be case insensitive', () => {
      const category1 = rca._classifyError('TIMEOUT exceeded');
      expect(category1).toBe(ErrorCategory.TIMEOUT);

      const category2 = rca._classifyError('syntax ERROR');
      expect(category2).toBe(ErrorCategory.SYNTAX);
    });
  });

  describe('integration: RCA workflow', () => {
    it('should support complete RCA workflow with fix suggestion', async () => {
      const taskId = 'integration-task';
      const error = new Error('Cannot find module \'express\'');

      const context = {
        taskId,
        taskType: 'build',
        recentChanges: ['package.json', 'src/index.js'],
        dependencyState: {
          outdated: [],
          missing: ['express'],
          conflicts: []
        },
        failureCount: 2
      };

      // Analyze error
      const analysis = await rca.analyze(error, context);

      // Verify analysis
      expect(analysis.category).toBe(ErrorCategory.DEPENDENCY);
      expect(analysis.confidence).toBeGreaterThan(0.5);
      expect(analysis.recommended_actions.length).toBeGreaterThan(0);

      // Get fix suggestion
      const fix = rca.suggestFix(analysis.category, context);

      // Verify fix suggestion
      expect(fix.category).toBe(ErrorCategory.DEPENDENCY);
      expect(fix.primary_fix).toContain('Install missing dependency');
      expect(fix.estimated_success_rate).toBe(0.85);

      // Store analysis for pattern detection
      await rca.analyze(new Error('Module not found: lodash'), {
        ...context,
        failureCount: 3
      });

      const history = rca.getAnalysisHistory(taskId);
      expect(history.length).toBe(2);
      expect(history[1].patterns.isRecurring).toBe(true);
    });
  });

  describe('pattern detection', () => {
    it('should detect recurring same-category failures', async () => {
      const context = {
        taskId: 'pattern-task',
        taskType: 'build',
        recentChanges: [],
        failureCount: 3
      };

      // Simulate recurring dependency errors
      await rca.analyze(new Error('Cannot find module A'), context);
      await rca.analyze(new Error('Cannot find module B'), context);
      const analysis = await rca.analyze(new Error('Cannot find module C'), context);

      expect(analysis.patterns.isRecurring).toBe(true);
      expect(analysis.patterns.sameCategoryCount).toBe(3);
    });

    it('should detect escalating failures across categories', async () => {
      const context = {
        taskId: 'escalation-task',
        taskType: 'build',
        recentChanges: [],
        failureCount: 4
      };

      // Simulate escalating errors
      await rca.analyze(new Error('SyntaxError: parse error'), context);
      await rca.analyze(new Error('Assertion failed'), context);
      await rca.analyze(new Error('Request timeout'), context);
      const analysis = await rca.analyze(new Error('Cannot find module'), context);

      expect(analysis.patterns.isEscalating).toBe(true);
      expect(analysis.patterns.uniqueCategories.length).toBeGreaterThan(2);
    });
  });

  describe('context analysis', () => {
    it('should identify risky configuration changes', async () => {
      const error = new Error('Cannot find module');
      const context = {
        taskId: 'config-task',
        taskType: 'build',
        recentChanges: ['config.json', '.env'],
        failureCount: 2
      };

      const analysis = await rca.analyze(error, context);

      expect(analysis.context_analysis.riskFactors.some(
        r => r.toLowerCase().includes('configuration')
      )).toBe(true);
    });

    it('should identify risky dependency changes', async () => {
      const error = new Error('Module not found');
      const context = {
        taskId: 'dep-task',
        taskType: 'build',
        recentChanges: ['package.json', 'package-lock.json'],
        failureCount: 2
      };

      const analysis = await rca.analyze(error, context);

      expect(analysis.context_analysis.riskFactors.some(
        r => r.toLowerCase().includes('dependency')
      )).toBe(true);
    });

    it('should identify risky async changes', async () => {
      const error = new Error('Timeout');
      const context = {
        taskId: 'async-task',
        taskType: 'api',
        recentChanges: ['src/async-handler.js'],
        failureCount: 2
      };

      const analysis = await rca.analyze(error, context);

      expect(analysis.context_analysis.riskFactors.some(
        r => r.toLowerCase().includes('async') || r.toLowerCase().includes('timing')
      )).toBe(true);
    });
  });
});
