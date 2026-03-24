/**
 * Hallucination Guard Tests
 */

const { describe, it } = require('vitest');
const { strict: assert } = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Import the guard
const { 
  checkCitation, 
  verifyClaim, 
  flagUncertainty,
  checkHallucination 
} = require('../../ez-agents/bin/guards/hallucination-guard.cjs');

describe('Hallucination Guard', () => {
  describe('checkCitation', () => {
    it('should return no citation for non-existent claims', () => {
      const result = checkCitation('nonexistent_claim_xyz123', os.tmpdir());
      assert.strictEqual(result.cited, false);
      assert.strictEqual(result.uncertainty, true);
      assert.strictEqual(result.citations.length, 0);
    });
    
    it('should find citation for existing content', () => {
      // Create a temp file with known content
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'citation-test-'));
      const testFile = path.join(tempDir, 'test.txt');
      fs.writeFileSync(testFile, 'This is a test claim that should be found');
      
      try {
        const result = checkCitation('test claim', tempDir);
        assert.strictEqual(result.cited, true);
        assert.strictEqual(result.uncertainty, false);
        assert.ok(result.citations.length > 0);
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });
  
  describe('verifyClaim', () => {
    it('should verify library in package.json', () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-test-'));
      const pkgPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(pkgPath, JSON.stringify({
        dependencies: {
          'express': '^4.18.0',
          'vitest': '^1.0.0'
        }
      }));
      
      try {
        const result = verifyClaim('library: express', tempDir);
        assert.strictEqual(result.verified, true);
        assert.strictEqual(result.source, 'package.json');
        assert.strictEqual(result.details.name, 'express');
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });
    
    it('should verify known libraries', () => {
      const result = verifyClaim('using vitest for testing');
      assert.strictEqual(result.verified, true);
      assert.strictEqual(result.source, 'known-library');
    });
    
    it('should not verify unknown libraries', () => {
      const result = verifyClaim('using unknown-library-xyz123');
      assert.strictEqual(result.verified, false);
      assert.strictEqual(result.source, 'none');
    });
  });
  
  describe('flagUncertainty', () => {
    it('should flag uncertain language', () => {
      const result = flagUncertainty('This might work, but I am not sure');
      assert.strictEqual(result.flagged, true);
      assert.ok(result.uncertainPhrases.includes('might'));
      assert.ok(result.uncertainPhrases.includes('not sure'));
      assert.strictEqual(result.confidence, 'low');
    });
    
    it('should not flag confident language', () => {
      const result = flagUncertainty('This is the correct approach');
      assert.strictEqual(result.flagged, false);
      assert.strictEqual(result.uncertainPhrases.length, 0);
      assert.strictEqual(result.confidence, 'high');
    });
    
    it('should detect citation claims', () => {
      const result = flagUncertainty('According to the documentation, this works');
      assert.strictEqual(result.flagged, true);
      assert.ok(result.uncertainPhrases.some(p => p.includes('citation claim')));
    });
  });
  
  describe('checkHallucination', () => {
    it('should detect unverified library claims', () => {
      const output = 'You should use the library unknown-lib-xyz for this';
      const result = checkHallucination(output);
      assert.strictEqual(result.hallucinationRisk, true);
      assert.ok(result.unverifiedClaims.length > 0);
    });
    
    it('should verify known library claims', () => {
      const output = 'You should use express for the server';
      const result = checkHallucination(output);
      assert.strictEqual(result.hallucinationRisk, false);
      assert.ok(result.verifiedClaims.length > 0);
    });
    
    it('should flag uncertainty in output', () => {
      const output = 'This might work, I think it should be correct';
      const result = checkHallucination(output);
      assert.strictEqual(result.uncertainty.flagged, true);
      assert.strictEqual(result.confidence, 'medium');
    });
  });
});
