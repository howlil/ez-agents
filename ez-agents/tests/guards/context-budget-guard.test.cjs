/**
 * Context Budget Guard Tests
 */

const { describe, it } = require('vitest');
const { strict: assert } = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Import the guard
const { 
  getTokenUsage,
  checkContextBudget,
  shouldStop,
  getRecommendedAction,
  checkBudget,
  THRESHOLDS
} = require('../../ez-agents/bin/guards/context-budget-guard.cjs');

describe('Context Budget Guard', () => {
  describe('checkContextBudget', () => {
    it('should return no warnings for low usage', () => {
      const result = checkContextBudget(10000, 100000);
      assert.strictEqual(result.percent, 10);
      assert.strictEqual(result.warnings.length, 0);
      assert.strictEqual(result.shouldStop, false);
    });
    
    it('should return info warning at 50%', () => {
      const result = checkContextBudget(50000, 100000);
      assert.strictEqual(result.percent, 50);
      assert.strictEqual(result.warnings.length, 1);
      assert.strictEqual(result.warnings[0].level, 'info');
      assert.strictEqual(result.shouldStop, false);
    });
    
    it('should return warning at 70%', () => {
      const result = checkContextBudget(70000, 100000);
      assert.strictEqual(result.percent, 70);
      assert.strictEqual(result.warnings.length, 2);
      assert.strictEqual(result.warnings[1].level, 'warning');
      assert.strictEqual(result.shouldStop, false);
    });
    
    it('should return error and shouldStop at 80%', () => {
      const result = checkContextBudget(80000, 100000);
      assert.strictEqual(result.percent, 80);
      assert.strictEqual(result.warnings.length, 3);
      assert.strictEqual(result.warnings[2].level, 'error');
      assert.strictEqual(result.shouldStop, true);
    });
    
    it('should return all warnings at 95%', () => {
      const result = checkContextBudget(95000, 100000);
      assert.strictEqual(result.percent, 95);
      assert.strictEqual(result.warnings.length, 3);
      assert.strictEqual(result.shouldStop, true);
      assert.strictEqual(result.remaining, 5000);
    });
  });
  
  describe('shouldStop', () => {
    it('should return false below 80%', () => {
      assert.strictEqual(shouldStop(79000, 100000), false);
      assert.strictEqual(shouldStop(50000, 100000), false);
    });
    
    it('should return true at 80% and above', () => {
      assert.strictEqual(shouldStop(80000, 100000), true);
      assert.strictEqual(shouldStop(90000, 100000), true);
    });
  });
  
  describe('getRecommendedAction', () => {
    it('should return OK for low usage', () => {
      const action = getRecommendedAction(30000, 100000);
      assert.ok(action.includes('healthy'));
    });
    
    it('should return INFO for 50-69%', () => {
      const action = getRecommendedAction(60000, 100000);
      assert.ok(action.includes('INFO'));
      assert.ok(action.includes('Monitor'));
    });
    
    it('should return WARNING for 70-79%', () => {
      const action = getRecommendedAction(75000, 100000);
      assert.ok(action.includes('WARNING'));
      assert.ok(action.includes('split'));
    });
    
    it('should return STOP for 80%+', () => {
      const action = getRecommendedAction(85000, 100000);
      assert.ok(action.includes('STOP'));
      assert.ok(action.includes('Split'));
    });
  });
  
  describe('getTokenUsage', () => {
    it('should return default when no context file', () => {
      const result = getTokenUsage(null);
      assert.strictEqual(result.current, 0);
      assert.strictEqual(result.max, 100000);
      assert.strictEqual(result.model, 'default');
    });
    
    it('should return default when file does not exist', () => {
      const result = getTokenUsage('/nonexistent/file.md');
      assert.strictEqual(result.current, 0);
      assert.strictEqual(result.max, 100000);
    });
    
    it('should parse token usage from context file', () => {
      const tempFile = path.join(os.tmpdir(), `context-${Date.now()}.md`);
      const content = `
# Context
tokens_used: 50000
token_limit: 100000
model: claude-3-sonnet
`;
      fs.writeFileSync(tempFile, content);
      
      try {
        const result = getTokenUsage(tempFile);
        assert.strictEqual(result.current, 50000);
        assert.strictEqual(result.max, 100000);
        assert.strictEqual(result.model, 'claude-3-sonnet');
      } finally {
        fs.unlinkSync(tempFile);
      }
    });
  });
  
  describe('checkBudget', () => {
    it('should return complete budget status', () => {
      const result = checkBudget(null, 'gpt-4');
      assert.ok(result.model);
      assert.ok(result.limit);
      assert.ok('percent' in result);
      assert.ok('warnings' in result);
      assert.ok('action' in result);
    });
  });
});
