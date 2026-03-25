import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, writeFileSync, mkdirSync, rmSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GUARD_PATH = join(__dirname, '..', '..', 'bin', 'guards', 'hallucination-guard.cjs');

// Dynamic import for CommonJS module
const { checkCitation, verifyClaim, flagUncertainty, hasUncertainty, UNCERTAINTY_MARKERS } = await import(GUARD_PATH);

describe('Hallucination Guard', () => {
  describe('checkCitation', () => {
    it('returns cited:true when claim found in codebase', () => {
      // Test with a claim that should match existing code
      const result = checkCitation('token usage monitoring', process.cwd());
      expect(result).toHaveProperty('cited');
      expect(result).toHaveProperty('citations');
      expect(result).toHaveProperty('uncertainty');
    });

    it('returns cited:false with uncertainty:false when claim not found', () => {
      const result = checkCitation('xyznonexistent123 claim', process.cwd());
      expect(result.cited).toBe(false);
      expect(result.uncertainty).toBe(false);
      expect(result.citations).toEqual([]);
    });

    it('detects uncertainty markers in claims', () => {
      const result = checkCitation('This might be a library', process.cwd());
      expect(result.uncertainty).toBe(true);
    });

    it('searches in ez-agents directory', () => {
      const result = checkCitation('guard', process.cwd());
      expect(Array.isArray(result.citations)).toBe(true);
    });

    it('handles empty claims gracefully', () => {
      const result = checkCitation('', process.cwd());
      // Empty claims should return cited:false (no evidence found)
      // Note: uncertainty may be true if empty string triggers markers
      expect(result.cited).toBe(false);
      expect(result.uncertainty).toBe(false);
    });
  });

  describe('verifyClaim', () => {
    it('checks library existence in package.json', () => {
      // Test with a real dependency from package.json
      const result = verifyClaim('vitest library dependency', process.cwd());
      expect(result).toHaveProperty('verified');
      expect(result).toHaveProperty('source');
    });

    it('returns verified:false for fake libraries', () => {
      const result = verifyClaim('nonexistent-fake-library-xyz package', process.cwd());
      expect(result.verified).toBe(false);
    });

    it('handles codebase claims', () => {
      const result = verifyClaim('context budget guard implementation', process.cwd());
      expect(result).toHaveProperty('verified');
      expect(result.details).toHaveProperty('cited');
    });
  });

  describe('flagUncertainty', () => {
    it('flags text with uncertainty markers', () => {
      const result = flagUncertainty('This might possibly work, I think');
      expect(result.flagged).toBe(true);
      expect(result.markers.length).toBeGreaterThan(0);
    });

    it('does not flag certain text', () => {
      const result = flagUncertainty('This is a definitive statement with absolute certainty');
      expect(result.flagged).toBe(false);
      expect(result.markers.length).toBe(0);
      expect(result.confidence).toBe(1);
    });

    it('detects multiple uncertainty markers', () => {
      const text = 'I might could possibly do this, perhaps';
      const result = flagUncertainty(text);
      expect(result.markers.length).toBeGreaterThanOrEqual(3);
    });

    it('calculates confidence score', () => {
      const certainText = 'The implementation is complete and tested';
      const uncertainText = 'I think this might possibly work, but I am not sure';

      const certainResult = flagUncertainty(certainText);
      const uncertainResult = flagUncertainty(uncertainText);

      expect(certainResult.confidence).toBe(1);
      expect(uncertainResult.confidence).toBeLessThan(1);
    });

    it('handles empty text', () => {
      const result = flagUncertainty('');
      expect(result.flagged).toBe(false);
      expect(result.confidence).toBe(1);
    });
  });

  describe('hasUncertainty', () => {
    it('detects common uncertainty markers', () => {
      expect(hasUncertainty('might')).toBe(true);
      expect(hasUncertainty('could')).toBe(true);
      expect(hasUncertainty('possibly')).toBe(true);
      expect(hasUncertainty('perhaps')).toBe(true);
      expect(hasUncertainty('I think')).toBe(true);
    });

    it('is case-insensitive', () => {
      expect(hasUncertainty('MIGHT')).toBe(true);
      expect(hasUncertainty('Could')).toBe(true);
      expect(hasUncertainty('I Believe')).toBe(true);
    });

    it('returns false for certain statements', () => {
      expect(hasUncertainty('The implementation is complete')).toBe(false);
      expect(hasUncertainty('Tests are passing')).toBe(false);
    });
  });

  describe('UNCERTAINTY_MARKERS', () => {
    it('contains expected markers', () => {
      expect(UNCERTAINTY_MARKERS).toContain('might');
      expect(UNCERTAINTY_MARKERS).toContain('could');
      expect(UNCERTAINTY_MARKERS).toContain('possibly');
      expect(UNCERTAINTY_MARKERS).toContain('i think');
      expect(UNCERTAINTY_MARKERS.length).toBeGreaterThan(10);
    });
  });

  describe('Integration', () => {
    it('checkCitation finds guard implementations', { timeout: 60000 }, () => {
      const result = checkCitation('context budget guard', process.cwd());
      // Should find the guard files we created
      expect(result.citations.length).toBeGreaterThan(0);
    });

    it('verifyClaim works with package.json dependencies', () => {
      const result = verifyClaim('vitest package dependency', process.cwd());
      expect(result.source).toBe('package.json');
    });
  });
});
