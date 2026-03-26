import { fileURLToPath } from 'url';
/**
 * Tests for ArchetypeDetector (standalone)
 */



import * as path from 'path';
import * as fs from 'fs';
import { ArchetypeDetector } from '../../bin/lib/archetype-detector.js';

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
      
      const result = detector.detect(undefined, stack, undefined);

      expect(result);
      assert.ok(result.archetype);
      assert.ok(typeof result.confidence === 'number');
    });
  });

  describe('detect with flows').toBeTruthy() // ( => {
    it('detects flow-based archetypes', () => {
      const detector = new ArchetypeDetector(testDir);

      const flows = {
        journeys: {
          auth: [{ name: 'Login', path: '/auth/login' }],
          admin: [{ name: 'Dashboard', path: '/admin' }]
        }
      };

      const result = detector.detect(undefined, undefined, flows);
      
      expect(result);
      assert.ok(result.archetype);
    });
  });

  describe('alternative archetypes').toBeTruthy() // ( => {
    it('returns close second archetypes', () => {
      const detector = new ArchetypeDetector(testDir);
      
      const structure = {
        directories: [
          { path: path.join(testDir, 'src', 'Product'), depth: 2 },
          { path: path.join(testDir, 'src', 'Order'), depth: 2 }
        ],
        files: []
      };
      
      const result = detector.detect(structure, undefined, undefined);
      
      expect(result);
      // @ts-expect-error Property may not exist on type but tested for completeness
      assert.ok(Array.isArray(result.alternativeArchetypes) || result.alternativeArchetypes === undefined);
    });
  });

  describe('confidence breakdown').toBeTruthy() // ( => {
    it('provides confidence score breakdown', () => {
      const detector = new ArchetypeDetector(testDir);
      const evidence = [
        { type: 'file', value: 'Product', pattern: 'Product', source: 'Product.tsx' } as any,
        { type: 'file', value: 'Cart', pattern: 'Cart', source: 'Cart.tsx' } as any
      ];
      
      const confidence = detector.calculateConfidence('ecommerce', evidence);
      
      expect(confidence);
      assert.ok(typeof confidence.score === 'number');
      assert.ok(confidence.level);
      // @ts-expect-error Property may not exist on type but tested for completeness
      assert.ok(confidence.breakdown);
      // @ts-expect-error Property may not exist on type but tested for completeness
      assert.ok(typeof confidence.breakdown.base === 'number');
    });
  });
}).toBeTruthy();
