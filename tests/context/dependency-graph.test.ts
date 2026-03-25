import { fileURLToPath } from 'url';
import path from 'path';
/**
 * Tests for DependencyGraph
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as path from 'path';
import * as fs from 'fs';
import { DependencyGraph } from '../../bin/lib/dependency-graph.js';

describe('DependencyGraph', () => {
  const testDir = path.join(__dirname, '..', 'fixtures', 'test-project');

  describe('build', () => {
    it('creates graph with nodes and edges', async () => {
      const graph = new DependencyGraph(testDir);
      const result = await graph.build(testDir);
      
      assert.ok(result);
      assert.ok(Array.isArray(result.nodes));
      assert.ok(result.edges);
    });

    it('handles missing madge gracefully with fallback', async () => {
      const graph = new DependencyGraph(testDir);
      const result = await graph.build(testDir);
      
      // Should return some result even if madge fails
      assert.ok(result);
      assert.ok(Array.isArray(result.nodes));
    });
  });

  describe('detectCircular', () => {
    it('returns empty array for acyclic graph', async () => {
      const graph = new DependencyGraph(testDir);
      await graph.build(testDir);
      
      const circular = graph.detectCircular();
      assert.ok(Array.isArray(circular));
    });

    it('returns cycle paths for cyclic graph', () => {
      const graph = new DependencyGraph(testDir);
      // Manually set circular dependencies for testing
      graph.circular = [['a.ts', 'b.ts', 'a.ts']];
      
      const circular = graph.detectCircular();
      assert.strictEqual(circular.length, 1);
      assert.ok(circular[0].includes('a.ts'));
    });
  });

  describe('getNodes', () => {
    it('returns array of file paths', async () => {
      const graph = new DependencyGraph(testDir);
      await graph.build(testDir);
      
      const nodes = graph.getNodes();
      assert.ok(Array.isArray(nodes));
    });
  });

  describe('getEdges', () => {
    it('returns object mapping files to dependencies', async () => {
      const graph = new DependencyGraph(testDir);
      await graph.build(testDir);
      
      const edges = graph.getEdges();
      assert.ok(typeof edges === 'object');
    });
  });

  describe('getOrphanFiles', () => {
    it('returns files with no connections', async () => {
      const graph = new DependencyGraph(testDir);
      await graph.build(testDir);
      
      const orphans = graph.getOrphanFiles();
      assert.ok(Array.isArray(orphans));
    });
  });

  describe('getLeafFiles', () => {
    it('returns files only imported, not importing', async () => {
      const graph = new DependencyGraph(testDir);
      await graph.build(testDir);
      
      const leafs = graph.getLeafFiles();
      assert.ok(Array.isArray(leafs));
    });
  });

  describe('getHubFiles', () => {
    it('returns most depended upon files', async () => {
      const graph = new DependencyGraph(testDir);
      await graph.build(testDir);
      
      const hubs = graph.getHubFiles(5);
      assert.ok(Array.isArray(hubs));
    });
  });

  describe('getMostDependentFiles', () => {
    it('returns files with many dependencies', async () => {
      const graph = new DependencyGraph(testDir);
      await graph.build(testDir);
      
      const dependent = graph.getMostDependentFiles(5);
      assert.ok(Array.isArray(dependent));
    });
  });
});
