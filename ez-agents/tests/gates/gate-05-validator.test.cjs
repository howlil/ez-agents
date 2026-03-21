/**
 * Gate 5 Validator Tests
 * Tests for the testing coverage gate validator
 */

import { describe, it, beforeEach, afterEach } from 'vitest';
import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the validator
const { validateCoverage, getArchetypeThresholds } = await import(path.join(__dirname, '../../../.planning/gates/gate-05-testing/validator.cjs'));

describe('Gate 5 Validator', () => {
  describe('getArchetypeThresholds', () => {
    it('should return MVP thresholds', () => {
      const thresholds = getArchetypeThresholds('mvp');
      assert.strictEqual(thresholds.lines, 60);
      assert.strictEqual(thresholds.branches, 40);
      assert.strictEqual(thresholds.functions, 50);
    });
    
    it('should return Medium thresholds', () => {
      const thresholds = getArchetypeThresholds('medium');
      assert.strictEqual(thresholds.lines, 80);
      assert.strictEqual(thresholds.branches, 60);
      assert.strictEqual(thresholds.functions, 70);
    });
    
    it('should return Enterprise thresholds', () => {
      const thresholds = getArchetypeThresholds('enterprise');
      assert.strictEqual(thresholds.lines, 95);
      assert.strictEqual(thresholds.branches, 80);
      assert.strictEqual(thresholds.functions, 90);
    });
    
    it('should throw for unknown archetype', () => {
      assert.throws(
        () => getArchetypeThresholds('invalid'),
        /Unknown archetype/
      );
    });
  });
  
  describe('validateCoverage', () => {
    let tempDir;
    
    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gate5-test-'));
    });
    
    afterEach(() => {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {
        // Ignore cleanup errors
      }
    });
    
    it('should return failure when coverage report missing', () => {
      const result = validateCoverage(tempDir, 'mvp');
      assert.strictEqual(result.pass, false);
      assert.ok(result.failures.some(f => f.includes('Coverage execution failed')));
    });
    
    it('should return failure when coverage below threshold', () => {
      // Create a mock coverage report with low coverage
      const coverageDir = path.join(tempDir, 'coverage');
      fs.mkdirSync(coverageDir);
      
      const mockCoverage = {
        totals: {
          lines: { pct: 30 },
          branches: { pct: 20 },
          functions: { pct: 25 }
        }
      };
      
      fs.writeFileSync(
        path.join(coverageDir, 'coverage-summary.json'),
        JSON.stringify(mockCoverage)
      );
      
      const result = validateCoverage(tempDir, 'mvp');
      assert.strictEqual(result.pass, false);
      assert.ok(result.failures.length > 0);
      assert.ok(result.failures.some(f => f.includes('Lines coverage')));
    });
    
    it('should return success when coverage meets threshold', () => {
      // Create a mock coverage report with good coverage
      const coverageDir = path.join(tempDir, 'coverage');
      fs.mkdirSync(coverageDir);
      
      const mockCoverage = {
        totals: {
          lines: { pct: 70 },
          branches: { pct: 50 },
          functions: { pct: 60 }
        }
      };
      
      fs.writeFileSync(
        path.join(coverageDir, 'coverage-summary.json'),
        JSON.stringify(mockCoverage)
      );
      
      const result = validateCoverage(tempDir, 'mvp');
      assert.strictEqual(result.pass, true);
      assert.strictEqual(result.failures.length, 0);
      assert.strictEqual(result.report.lines, 70);
    });
    
    it('should use correct thresholds for medium archetype', () => {
      const coverageDir = path.join(tempDir, 'coverage');
      fs.mkdirSync(coverageDir);
      
      const mockCoverage = {
        totals: {
          lines: { pct: 75 }, // Below medium (80%) but above mvp (60%)
          branches: { pct: 55 },
          functions: { pct: 65 }
        }
      };
      
      fs.writeFileSync(
        path.join(coverageDir, 'coverage-summary.json'),
        JSON.stringify(mockCoverage)
      );
      
      // Should fail for medium
      const mediumResult = validateCoverage(tempDir, 'medium');
      assert.strictEqual(mediumResult.pass, false);
      
      // Should pass for mvp
      const mvpResult = validateCoverage(tempDir, 'mvp');
      assert.strictEqual(mvpResult.pass, true);
    });
  });
});
