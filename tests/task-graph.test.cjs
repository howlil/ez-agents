/**
 * Task Graph Engine Tests
 * 
 * Tests for the TaskGraph class including DAG building, cycle detection,
 * wave computation, and topological sorting.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');
const { TaskGraph } = require('../bin/lib/task-graph.cjs');

describe('TaskGraph.buildDAG', () => {
  test('buildDAG creates graph with correct node count', () => {
    const taskGraph = new TaskGraph();
    const tasks = [
      { id: 'A', dependencies: [] },
      { id: 'B', dependencies: ['A'] },
      { id: 'C', dependencies: ['A'] },
      { id: 'D', dependencies: ['B', 'C'] }
    ];

    taskGraph.buildDAG(tasks);

    assert.strictEqual(taskGraph.getNodeCount(), 4, 'Should have 4 nodes');
    assert.ok(taskGraph.hasTask('A'), 'Should have task A');
    assert.ok(taskGraph.hasTask('B'), 'Should have task B');
    assert.ok(taskGraph.hasTask('C'), 'Should have task C');
    assert.ok(taskGraph.hasTask('D'), 'Should have task D');
  });

  test('buildDAG links dependencies correctly', () => {
    const taskGraph = new TaskGraph();
    const tasks = [
      { id: 'A', dependencies: [] },
      { id: 'B', dependencies: ['A'] },
      { id: 'C', dependencies: ['B'] }
    ];

    taskGraph.buildDAG(tasks);

    // Verify edges: A -> B -> C
    const graph = taskGraph.getGraph();
    
    // A should have B as successor (out neighbor)
    const aSuccessors = graph.outNeighbors('A');
    assert.ok(aSuccessors.includes('B'), 'A should have B as successor');
    assert.strictEqual(aSuccessors.length, 1, 'A should have exactly 1 successor');

    // B should have C as successor (out neighbor)
    const bSuccessors = graph.outNeighbors('B');
    assert.ok(bSuccessors.includes('C'), 'B should have C as successor');
    assert.strictEqual(bSuccessors.length, 1, 'B should have exactly 1 successor');

    // C should have no successors
    const cSuccessors = graph.outNeighbors('C');
    assert.strictEqual(cSuccessors.length, 0, 'C should have no successors');

    // B should have A as predecessor (in neighbor)
    const bPredecessors = graph.inNeighbors('B');
    assert.ok(bPredecessors.includes('A'), 'B should have A as predecessor');

    // C should have B as predecessor (in neighbor)
    const cPredecessors = graph.inNeighbors('C');
    assert.ok(cPredecessors.includes('B'), 'C should have B as predecessor');
  });
});

describe('TaskGraph.detectCycles', () => {
  test('detectCycles throws on circular dependency A → B → A', () => {
    const taskGraph = new TaskGraph();
    const tasks = [
      { id: 'A', dependencies: ['B'] },
      { id: 'B', dependencies: ['A'] }
    ];

    taskGraph.buildDAG(tasks);

    assert.throws(
      () => taskGraph.detectCycles(),
      (error) => {
        assert.ok(
          error.message.includes('Cycle detected'),
          `Error message should mention cycle: ${error.message}`
        );
        assert.ok(
          error.message.includes('A') && error.message.includes('B'),
          `Error message should include cycle path with A and B: ${error.message}`
        );
        return true;
      },
      'Should throw error for circular dependency A → B → A'
    );
  });

  test('detectCycles throws on longer cycle A → B → C → A', () => {
    const taskGraph = new TaskGraph();
    const tasks = [
      { id: 'A', dependencies: ['C'] },
      { id: 'B', dependencies: ['A'] },
      { id: 'C', dependencies: ['B'] }
    ];

    taskGraph.buildDAG(tasks);

    assert.throws(
      () => taskGraph.detectCycles(),
      (error) => {
        assert.ok(
          error.message.includes('Cycle detected'),
          `Error message should mention cycle: ${error.message}`
        );
        assert.ok(
          error.message.includes('A') && 
          error.message.includes('B') && 
          error.message.includes('C'),
          `Error message should include cycle path with A, B, and C: ${error.message}`
        );
        return true;
      },
      'Should throw error for longer cycle A → B → C → A'
    );
  });

  test('detectCycles passes on valid DAG', () => {
    const taskGraph = new TaskGraph();
    const tasks = [
      { id: 'A', dependencies: [] },
      { id: 'B', dependencies: ['A'] },
      { id: 'C', dependencies: ['A'] },
      { id: 'D', dependencies: ['B', 'C'] }
    ];

    taskGraph.buildDAG(tasks);

    const result = taskGraph.detectCycles();
    assert.strictEqual(result, true, 'Should return true for valid DAG');
  });
});

describe('TaskGraph.computeWaves', () => {
  test('computeWaves returns independent tasks in same wave', () => {
    const taskGraph = new TaskGraph();
    const tasks = [
      { id: 'A', dependencies: [] },
      { id: 'B', dependencies: [] },
      { id: 'C', dependencies: [] }
    ];

    taskGraph.buildDAG(tasks);
    const waves = taskGraph.computeWaves();

    assert.strictEqual(waves.length, 1, 'Should have 1 wave');
    assert.strictEqual(waves[0].length, 3, 'First wave should have 3 tasks');
    assert.ok(waves[0].includes('A'), 'Wave should include A');
    assert.ok(waves[0].includes('B'), 'Wave should include B');
    assert.ok(waves[0].includes('C'), 'Wave should include C');
  });

  test('computeWaves respects dependencies (dependent in later wave)', () => {
    const taskGraph = new TaskGraph();
    const tasks = [
      { id: 'A', dependencies: [] },
      { id: 'B', dependencies: ['A'] },
      { id: 'C', dependencies: ['A'] },
      { id: 'D', dependencies: ['B', 'C'] }
    ];

    taskGraph.buildDAG(tasks);
    const waves = taskGraph.computeWaves();

    assert.strictEqual(waves.length, 3, 'Should have 3 waves');
    
    // Wave 0: A (no dependencies)
    assert.strictEqual(waves[0].length, 1, 'Wave 0 should have 1 task');
    assert.ok(waves[0].includes('A'), 'Wave 0 should include A');

    // Wave 1: B, C (depend on A)
    assert.strictEqual(waves[1].length, 2, 'Wave 1 should have 2 tasks');
    assert.ok(waves[1].includes('B'), 'Wave 1 should include B');
    assert.ok(waves[1].includes('C'), 'Wave 1 should include C');

    // Wave 2: D (depends on B and C)
    assert.strictEqual(waves[2].length, 1, 'Wave 2 should have 1 task');
    assert.ok(waves[2].includes('D'), 'Wave 2 should include D');
  });

  test('computeWaves handles empty task array', () => {
    const taskGraph = new TaskGraph();
    const tasks = [];

    taskGraph.buildDAG(tasks);
    const waves = taskGraph.computeWaves();

    assert.deepStrictEqual(waves, [], 'Should return empty array for empty tasks');
  });

  test('computeWaves handles single task', () => {
    const taskGraph = new TaskGraph();
    const tasks = [
      { id: 'Solo', dependencies: [] }
    ];

    taskGraph.buildDAG(tasks);
    const waves = taskGraph.computeWaves();

    assert.strictEqual(waves.length, 1, 'Should have 1 wave');
    assert.strictEqual(waves[0].length, 1, 'Wave should have 1 task');
    assert.ok(waves[0].includes('Solo'), 'Wave should include Solo task');
  });
});

describe('TaskGraph.getExecutionOrder', () => {
  test('getExecutionOrder returns topologically sorted list', () => {
    const taskGraph = new TaskGraph();
    const tasks = [
      { id: 'A', dependencies: [] },
      { id: 'B', dependencies: ['A'] },
      { id: 'C', dependencies: ['B'] },
      { id: 'D', dependencies: ['C'] }
    ];

    taskGraph.buildDAG(tasks);
    const order = taskGraph.getExecutionOrder();

    assert.strictEqual(order.length, 4, 'Should have 4 tasks in order');
    
    // Verify topological order: A must come before B, B before C, C before D
    const aIndex = order.indexOf('A');
    const bIndex = order.indexOf('B');
    const cIndex = order.indexOf('C');
    const dIndex = order.indexOf('D');

    assert.ok(aIndex < bIndex, 'A should come before B');
    assert.ok(bIndex < cIndex, 'B should come before C');
    assert.ok(cIndex < dIndex, 'C should come before D');
  });
});
