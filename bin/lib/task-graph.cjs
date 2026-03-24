/**
 * Task Graph Engine
 * 
 * DAG-based task dependency management with wave computation for parallel execution.
 * Uses graphology for graph operations, supports cycle detection, and computes
 * optimal execution waves for independent task groups.
 * 
 * @module task-graph
 */

const Graph = require('graphology');
const { hasCycle, topologicalSort, topologicalGenerations } = require('graphology-dag');

/**
 * TaskGraph class for managing task dependencies and execution order.
 * 
 * @example
 * const taskGraph = new TaskGraph();
 * const tasks = [
 *   { id: 'A', dependencies: [] },
 *   { id: 'B', dependencies: ['A'] },
 *   { id: 'C', dependencies: ['A'] },
 *   { id: 'D', dependencies: ['B', 'C'] }
 * ];
 * taskGraph.buildDAG(tasks);
 * taskGraph.detectCycles(); // throws if cycle found
 * const waves = taskGraph.computeWaves(); // [['A'], ['B', 'C'], ['D']]
 * const order = taskGraph.getExecutionOrder(); // ['A', 'B', 'C', 'D'] or ['A', 'C', 'B', 'D']
 */
class TaskGraph {
  /**
   * Creates a new TaskGraph instance.
   * @param {Graph} [graph] - Optional existing graphology graph to use.
   */
  constructor(graph = null) {
    /** @private */
    this._graph = graph || new Graph();
    /** @private */
    this._tasks = new Map();
  }

  /**
   * Creates a directed acyclic graph from a task array with dependencies.
   * 
   * Each task should have an `id` property and optionally a `dependencies` array
   * containing the IDs of tasks that must complete before this task can start.
   * 
   * @param {Array<{id: string, dependencies?: string[]}>} tasks - Array of task objects.
   * @returns {TaskGraph} Returns this instance for method chaining.
   * 
   * @example
   * const tasks = [
   *   { id: 'task-1', dependencies: [] },
   *   { id: 'task-2', dependencies: ['task-1'] },
   *   { id: 'task-3', dependencies: ['task-1', 'task-2'] }
   * ];
   * taskGraph.buildDAG(tasks);
   */
  buildDAG(tasks) {
    this._graph = new Graph();
    this._tasks = new Map();

    // First pass: add all nodes
    for (const task of tasks) {
      const taskId = String(task.id);
      if (!this._graph.hasNode(taskId)) {
        this._graph.addNode(taskId, { ...task });
        this._tasks.set(taskId, task);
      }
    }

    // Second pass: add edges for dependencies
    for (const task of tasks) {
      const taskId = String(task.id);
      const deps = task.dependencies || [];
      
      for (const depId of deps) {
        const depIdStr = String(depId);
        // Ensure dependency node exists (even if not in original task list)
        if (!this._graph.hasNode(depIdStr)) {
          this._graph.addNode(depIdStr, { id: depIdStr });
          this._tasks.set(depIdStr, { id: depIdStr });
        }
        // Edge goes from dependency to dependent (depId -> taskId)
        // Meaning: depId must complete before taskId can start
        if (!this._graph.hasDirectedEdge(depIdStr, taskId)) {
          this._graph.addDirectedEdge(depIdStr, taskId);
        }
      }
    }

    return this;
  }

  /**
   * Detects cycles in the task dependency graph.
   * 
   * @returns {boolean} True if no cycles found (valid DAG), false if cycles exist.
   * @throws {Error} If a cycle is detected, throws with message including cycle path.
   * 
   * @example
   * try {
   *   taskGraph.detectCycles();
   *   console.log('No cycles found - valid DAG');
   * } catch (error) {
   *   console.error(error.message); // "Cycle detected: A → B → A"
   * }
   */
  detectCycles() {
    if (hasCycle(this._graph)) {
      // Find the cycle path using DFS
      const cyclePath = this._findCyclePath();
      const cycleStr = cyclePath.join(' → ');
      throw new Error(`Cycle detected: ${cycleStr}`);
    }
    return true;
  }

  /**
   * Finds and returns the path of a cycle in the graph.
   * 
   * @private
   * @returns {string[]} Array of node IDs forming the cycle.
   */
  _findCyclePath() {
    const visited = new Set();
    const recursionStack = new Set();
    const parent = new Map();
    
    const nodes = this._graph.nodes();
    
    for (const node of nodes) {
      if (!visited.has(node)) {
        const cyclePath = this._dfsFindCycle(node, visited, recursionStack, parent);
        if (cyclePath) {
          return cyclePath;
        }
      }
    }
    
    // Fallback: return generic cycle indication
    return ['(cycle detected)'];
  }

  /**
   * DFS helper to find cycle path.
   * 
   * @private
   * @param {string} node - Current node being visited.
   * @param {Set<string>} visited - Set of all visited nodes.
   * @param {Set<string>} recursionStack - Set of nodes in current recursion stack.
   * @param {Map<string, string>} parent - Map of node to parent node.
   * @returns {string[]|null} Cycle path if found, null otherwise.
   */
  _dfsFindCycle(node, visited, recursionStack, parent) {
    visited.add(node);
    recursionStack.add(node);
    
    // Use outNeighbors for successors (nodes this node points to)
    const successors = this._graph.outNeighbors(node);
    
    for (const successor of successors) {
      if (!visited.has(successor)) {
        parent.set(successor, node);
        const cyclePath = this._dfsFindCycle(successor, visited, recursionStack, parent);
        if (cyclePath) {
          return cyclePath;
        }
      } else if (recursionStack.has(successor)) {
        // Found a cycle - reconstruct the path
        const cycle = [successor];
        let current = node;
        while (current !== successor) {
          cycle.unshift(current);
          current = parent.get(current);
        }
        cycle.unshift(successor);
        return cycle;
      }
    }
    
    recursionStack.delete(node);
    return null;
  }

  /**
   * Computes execution waves using Kahn's algorithm.
   * 
   * Each wave contains tasks that can be executed in parallel because all their
   * dependencies have been satisfied in previous waves.
   * 
   * @returns {string[][]} Array of waves, where each wave is an array of task IDs.
   * 
   * @example
   * const tasks = [
   *   { id: 'A', dependencies: [] },
   *   { id: 'B', dependencies: [] },
   *   { id: 'C', dependencies: ['A'] },
   *   { id: 'D', dependencies: ['A', 'B'] }
   * ];
   * taskGraph.buildDAG(tasks);
   * const waves = taskGraph.computeWaves();
   * // Wave 0: ['A', 'B'] - can run in parallel
   * // Wave 1: ['C', 'D'] - can run in parallel after wave 0
   */
  computeWaves() {
    const nodes = this._graph.nodes();
    
    // Handle empty graph
    if (nodes.length === 0) {
      return [];
    }

    // Handle single node
    if (nodes.length === 1) {
      return [[nodes[0]]];
    }

    // Use topologicalGenerations from graphology-dag for wave computation
    try {
      return topologicalGenerations(this._graph);
    } catch (error) {
      // If topologicalGenerations throws, it means there's a cycle
      throw new Error('Unable to compute waves - graph may contain cycles');
    }
  }

  /**
   * Returns a topologically sorted list of task IDs.
   * 
   * The returned order ensures that for every dependency edge (A → B),
   * A appears before B in the result.
   * 
   * @returns {string[]} Array of task IDs in topological order.
   * @throws {Error} If the graph contains cycles.
   * 
   * @example
   * const tasks = [
   *   { id: 'A', dependencies: [] },
   *   { id: 'B', dependencies: ['A'] },
   *   { id: 'C', dependencies: ['B'] }
   * ];
   * taskGraph.buildDAG(tasks);
   * const order = taskGraph.getExecutionOrder(); // ['A', 'B', 'C']
   */
  getExecutionOrder() {
    const nodes = this._graph.nodes();
    
    // Handle empty graph
    if (nodes.length === 0) {
      return [];
    }

    try {
      // graphology-dag's topologicalSort returns nodes in topological order
      return topologicalSort(this._graph);
    } catch (error) {
      // topologicalSort throws if graph has cycles
      throw new Error('Cannot compute execution order - graph contains cycles');
    }
  }

  /**
   * Gets the underlying graphology graph.
   * 
   * @returns {Graph} The internal graph instance.
   */
  getGraph() {
    return this._graph;
  }

  /**
   * Gets the number of nodes in the graph.
   * 
   * @returns {number} Number of nodes.
   */
  getNodeCount() {
    return this._graph.order;
  }

  /**
   * Gets the number of edges in the graph.
   * 
   * @returns {number} Number of edges.
   */
  getEdgeCount() {
    return this._graph.size;
  }

  /**
   * Checks if a task exists in the graph.
   * 
   * @param {string} taskId - The task ID to check.
   * @returns {boolean} True if the task exists.
   */
  hasTask(taskId) {
    return this._graph.hasNode(String(taskId));
  }

  /**
   * Gets a task by ID.
   * 
   * @param {string} taskId - The task ID.
   * @returns {{id: string, dependencies?: string[]}|undefined} The task object or undefined.
   */
  getTask(taskId) {
    const id = String(taskId);
    if (this._graph.hasNode(id)) {
      return this._graph.getNodeAttributes(id);
    }
    return undefined;
  }
}

module.exports = { TaskGraph };
