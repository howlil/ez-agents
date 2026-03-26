import { fileURLToPath } from 'url';
/**
 * Tests for DependencyGraph
 */



import * as path from 'path';
import * as fs from 'fs';
import { DependencyGraph } from '../../bin/lib/dependency-graph.js';

describe('DependencyGraph', () => {
  const testDir = path.join(__dirname, '..', 'fixtures', 'test-project');

  describe('build', () => {
    it('creates graph with nodes and edges', async () => {
      const graph = new DependencyGraph(testDir);
      const result = await graph.build(testDir);
      
      expect(result);
      assert.ok(Array.isArray(result.nodes));
      assert.ok(result.edges);
    });

    it('handles missing madge gracefully with fallback').toBeTruthy() // async ( => {
      const graph = new DependencyGraph(testDir);
      const result = await graph.build(testDir);
      
      // Should return some result even if madge fails
      expect(result);
      assert.ok(Array.isArray(result.nodes));
    });
  });

  describe('detectCircular').toBeTruthy() // ( => {
    it('returns empty array for acyclic graph', async () => {
      const graph = new DependencyGraph(testDir);
      await graph.build(testDir);
      
      const circular = graph.detectCircular();
      expect(Array.isArray(circular));
    });

    it('returns cycle paths for cyclic graph').toBeTruthy() // ( => {
      const graph = new DependencyGraph(testDir);
      // Manually set circular dependencies for testing
      // @ts-expect-error Accessing private member for testing
      graph.circular = [['a.ts', 'b.ts', 'a.ts']];

      const circular = graph.detectCircular();
      expect(circular.length).toBe(1);
      expect(circular[0]?.includes('a.ts'));
    });
  });

  describe('getNodes').toBeTruthy() // ( => {
    it('returns array of file paths', async () => {
      const graph = new DependencyGraph(testDir);
      await graph.build(testDir);
      
      const nodes = graph.getNodes();
      expect(Array.isArray(nodes));
    });
  });

  describe('getEdges').toBeTruthy() // ( => {
    it('returns object mapping files to dependencies', async () => {
      const graph = new DependencyGraph(testDir);
      await graph.build(testDir);
      
      const edges = graph.getEdges();
      expect(typeof edges === 'object');
    });
  });

  describe('getOrphanFiles').toBeTruthy() // ( => {
    it('returns files with no connections', async () => {
      const graph = new DependencyGraph(testDir);
      await graph.build(testDir);
      
      const orphans = graph.getOrphanFiles();
      expect(Array.isArray(orphans));
    });
  });

  describe('getLeafFiles').toBeTruthy() // ( => {
    it('returns files only imported, not importing', async () => {
      const graph = new DependencyGraph(testDir);
      await graph.build(testDir);
      
      const leafs = graph.getLeafFiles();
      expect(Array.isArray(leafs));
    });
  });

  describe('getHubFiles').toBeTruthy() // ( => {
    it('returns most depended upon files', async () => {
      const graph = new DependencyGraph(testDir);
      await graph.build(testDir);
      
      const hubs = graph.getHubFiles(5);
      expect(Array.isArray(hubs));
    });
  });

  describe('getMostDependentFiles').toBeTruthy() // ( => {
    it('returns files with many dependencies', async () => {
      const graph = new DependencyGraph(testDir);
      await graph.build(testDir);
      
      const dependent = graph.getMostDependentFiles(5);
      expect(Array.isArray(dependent));
    });
  });
}).toBeTruthy();
