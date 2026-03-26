import { describe, it, expect } from 'vitest';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GUARD_PATH = join(__dirname, '..', '..', 'bin', 'guards', 'context-budget-guard.cjs');

// Dynamic import for CommonJS module
const { 
  checkContextBudget, 
  getTokenUsage, 
  shouldStop, 
  getWarningLevel, 
  getWarningMessage,
  THRESHOLDS,
  WARNING_MESSAGES 
} = await import(GUARD_PATH);

describe('Context Budget Guard', () => {
  describe('checkContextBudget', () => {
    it('returns info warning at 50%', () => {
      const result = checkContextBudget(500, 1000);
      expect(result.percent).toBe(50);
      expect(result.level).toBe('info');
      expect(result.message).toContain('50%');
      expect(result.shouldStop).toBe(false);
    });

    it('returns warning at 70%', () => {
      const result = checkContextBudget(700, 1000);
      expect(result.percent).toBe(70);
      expect(result.level).toBe('warning');
      expect(result.message).toContain('70%');
      expect(result.shouldStop).toBe(false);
    });

    it('returns error and shouldStop:true at 80%', () => {
      const result = checkContextBudget(800, 1000);
      expect(result.percent).toBe(80);
      expect(result.level).toBe('error');
      expect(result.message).toContain('80%');
      expect(result.shouldStop).toBe(true);
    });

    it('returns no warnings below 50%', () => {
      const result = checkContextBudget(400, 1000);
      expect(result.percent).toBe(40);
      expect(result.level).toBe('none');
      expect(result.message).toBe(undefined);
      expect(result.shouldStop).toBe(false);
    });

    it('handles zero usage', () => {
      const result = checkContextBudget(0, 1000);
      expect(result.percent).toBe(0);
      expect(result.level).toBe('none');
      expect(result.shouldStop).toBe(false);
    });

    it('handles 100% usage', () => {
      const result = checkContextBudget(1000, 1000);
      expect(result.percent).toBe(100);
      expect(result.level).toBe('error');
      expect(result.shouldStop).toBe(true);
    });

    it('handles usage exceeding limit', () => {
      const result = checkContextBudget(1200, 1000);
      expect(result.percent).toBe(120);
      expect(result.level).toBe('error');
      expect(result.shouldStop).toBe(true);
    });

    it('handles zero model limits gracefully', () => {
      const result = checkContextBudget(500, 0);
      expect(result.percent).toBe(0);
      expect(result.level).toBe('none');
      expect(result.shouldStop).toBe(false);
    });

    it('includes progressive warnings at 70%', () => {
      const result = checkContextBudget(750, 1000);
      expect(result.warnings.length).toBeGreaterThanOrEqual(1);
      expect(result.warnings.some(w => w.level === 'warning')).toBe(true);
    });

    it('includes all progressive warnings at 80%+', () => {
      const result = checkContextBudget(900, 1000);
      expect(result.warnings.length).toBeGreaterThanOrEqual(1);
      expect(result.warnings.some(w => w.level === 'error')).toBe(true);
    });
  });

  describe('shouldStop', () => {
    it('returns true at 80% usage', () => {
      expect(shouldStop(800, 1000)).toBe(true);
    });

    it('returns true above 80% usage', () => {
      expect(shouldStop(900, 1000)).toBe(true);
      expect(shouldStop(1000, 1000)).toBe(true);
    });

    it('returns false below 80% usage', () => {
      expect(shouldStop(700, 1000)).toBe(false);
      expect(shouldStop(500, 1000)).toBe(false);
      expect(shouldStop(0, 1000)).toBe(false);
    });

    it('returns false when modelLimits is zero', () => {
      expect(shouldStop(500, 0)).toBe(false);
    });

    it('returns false when modelLimits is undefined', () => {
      expect(shouldStop(500, undefined)).toBe(false);
    });
  });

  describe('getWarningLevel', () => {
    it('returns none for 0%', () => {
      expect(getWarningLevel(0)).toBe('none');
    });

    it('returns info for 50%', () => {
      expect(getWarningLevel(50)).toBe('info');
    });

    it('returns info for 60%', () => {
      expect(getWarningLevel(60)).toBe('info');
    });

    it('returns warning for 70%', () => {
      expect(getWarningLevel(70)).toBe('warning');
    });

    it('returns warning for 75%', () => {
      expect(getWarningLevel(75)).toBe('warning');
    });

    it('returns error for 80%', () => {
      expect(getWarningLevel(80)).toBe('error');
    });

    it('returns error for 100%', () => {
      expect(getWarningLevel(100)).toBe('error');
    });
  });

  describe('getWarningMessage', () => {
    it('returns message with percentage for INFO threshold', () => {
      const message = getWarningMessage(50, THRESHOLDS.INFO);
      expect(message).toContain('50%');
      expect(message).toContain('quality degradation');
    });

    it('returns message with percentage for WARNING threshold', () => {
      const message = getWarningMessage(70, THRESHOLDS.WARNING);
      expect(message).toContain('70%');
      expect(message).toContain('efficiency mode');
    });

    it('returns message with percentage for ERROR threshold', () => {
      const message = getWarningMessage(80, THRESHOLDS.ERROR);
      expect(message).toContain('80%');
      expect(message).toContain('hard stop');
    });
  });

  describe('THRESHOLDS', () => {
    it('has correct threshold values', () => {
      expect(THRESHOLDS.INFO).toBe(50);
      expect(THRESHOLDS.WARNING).toBe(70);
      expect(THRESHOLDS.ERROR).toBe(80);
    });
  });

  describe('WARNING_MESSAGES', () => {
    it('has messages for all thresholds', () => {
      expect(WARNING_MESSAGES[50]).toBeDefined();
      expect(WARNING_MESSAGES[70]).toBeDefined();
      expect(WARNING_MESSAGES[80]).toBeDefined();
    });

    it('messages contain placeholder', () => {
      expect(WARNING_MESSAGES[50]).toContain('{percent}');
      expect(WARNING_MESSAGES[70]).toContain('{percent}');
      expect(WARNING_MESSAGES[80]).toContain('{percent}');
    });
  });

  describe('Edge Cases', () => {
    it('handles very large token numbers', () => {
      const result = checkContextBudget(1000000, 2000000);
      expect(result.percent).toBe(50);
      expect(result.level).toBe('info');
    });

    it('handles fractional percentages', () => {
      const result = checkContextBudget(333, 1000);
      expect(result.percent).toBe(33);
      expect(result.level).toBe('none');
    });

    it('rounds percentages correctly', () => {
      const result = checkContextBudget(505, 1000);
      expect(result.percent).toBe(51);
    });
  });

  describe('Integration', () => {
    it('progressive warning system works end-to-end', () => {
      const scenarios = [
        { usage: 0, expectedLevel: 'none', expectedStop: false },
        { usage: 400, expectedLevel: 'none', expectedStop: false },
        { usage: 500, expectedLevel: 'info', expectedStop: false },
        { usage: 600, expectedLevel: 'info', expectedStop: false },
        { usage: 700, expectedLevel: 'warning', expectedStop: false },
        { usage: 750, expectedLevel: 'warning', expectedStop: false },
        { usage: 800, expectedLevel: 'error', expectedStop: true },
        { usage: 900, expectedLevel: 'error', expectedStop: true },
        { usage: 1000, expectedLevel: 'error', expectedStop: true }
      ];

      for (const scenario of scenarios) {
        const result = checkContextBudget(scenario.usage, 1000);
        expect(result.level).toBe(scenario.expectedLevel);
        expect(result.shouldStop).toBe(scenario.expectedStop);
      }
    });
  });
});
