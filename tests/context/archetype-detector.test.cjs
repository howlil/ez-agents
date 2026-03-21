/**
 * Tests for ArchetypeDetector (standalone)
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const { ArchetypeDetector } = require('../../bin/lib/archetype-detector.cjs');

describe('ArchetypeDetector - Standalone', () => {
  const testDir = path.join(__dirname, '..', 'fixtures', 'test-project');

  describe('detect with stack', () => {
    it('detects framework-based archetypes', () => {
      const detector = new ArchetypeDetector(testDir);
      
      const stack = {
        frameworks: ['Next.js', 'React'],
        databases: ['PostgreSQL', 'Prisma'],
        infrastructure: ['Sentry']
      };
      
      const result = detector.detect(null, stack, null);
      
      assert.ok(result);
      assert.ok(result.archetype);
      assert.ok(typeof result.confidence === 'number');
    });
  });

  describe('detect with flows', () => {
    it('detects flow-based archetypes', () => {
      const detector = new ArchetypeDetector(testDir);
      
      const flows = {
        journeys: {
          auth: [{ name: 'Login', path: '/auth/login' }],
          admin: [{ name: 'Dashboard', path: '/admin' }]
        }
      };
      
      const result = detector.detect(null, null, flows);
      
      assert.ok(result);
      assert.ok(result.archetype);
    });
  });

  describe('alternative archetypes', () => {
    it('returns close second archetypes', () => {
      const detector = new ArchetypeDetector(testDir);
      
      const structure = {
        directories: [
          { path: path.join(testDir, 'src', 'Product'), depth: 2 },
          { path: path.join(testDir, 'src', 'Order'), depth: 2 }
        ],
        files: []
      };
      
      const result = detector.detect(structure, null, null);
      
      assert.ok(result);
      assert.ok(Array.isArray(result.alternativeArchetypes) || result.alternativeArchetypes === undefined);
    });
  });

  describe('confidence breakdown', () => {
    it('provides confidence score breakdown', () => {
      const detector = new ArchetypeDetector(testDir);
      const evidence = [
        { type: 'file', value: 'Product', source: 'Product.tsx' },
        { type: 'file', value: 'Cart', source: 'Cart.tsx' }
      ];
      
      const confidence = detector.calculateConfidence('ecommerce', evidence, { ecommerce: 5, POS: 2 });
      
      assert.ok(confidence);
      assert.ok(typeof confidence.score === 'number');
      assert.ok(confidence.level);
      assert.ok(confidence.breakdown);
      assert.ok(typeof confidence.breakdown.base === 'number');
    });
  });
});
