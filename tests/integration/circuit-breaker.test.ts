/**
 * EZ Tools Tests - Circuit Breaker Integration Tests
 *
 * Integration tests for CIRCUIT-01, CIRCUIT-02:
 * End-to-end circuit breaker flow with agent spawns and state persistence
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
import assert from 'node:assert';
import * as path from 'path';
import * as fs from 'fs';

import CircuitBreaker from '../../bin/lib/circuit-breaker.js';
import {
  CircuitBreakerAdapter,
  createAdapter,
  ClaudeCodeAdapter,
  QwenAdapter
} from '../../bin/lib/assistant-adapter.js';

describe('Circuit Breaker Integration (CIRCUIT-01, CIRCUIT-02)', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => cleanup(tmpDir));

  describe('end-to-end circuit breaker flow', () => {
    test('trips to OPEN state after 5 consecutive failures', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 5,
        resetTimeout: 60000,
        cwd: tmpDir,
        agentType: 'test-agent'
      });

      const failingOp = async () => {
        throw new Error('Simulated failure');
      };

      // Execute 5 failing operations
      for (let i = 0; i < 5; i++) {
        try {
          await breaker.execute(failingOp);
        } catch (err) {
          // Expected
        }
      }

      // Verify circuit is OPEN
      assert.strictEqual(breaker.getState(), 'OPEN', 'circuit should be OPEN after 5 failures');

      // Verify state persisted
      const stateFile = path.join(tmpDir, '.planning', 'circuit-breaker.json');
      assert.ok(fs.existsSync(stateFile), 'circuit-breaker.json must exist');

      const data = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
      assert.ok(data['test-agent'], 'must have test-agent entry');
      assert.strictEqual(data['test-agent'].state, 'OPEN', 'persisted state should be OPEN');
      assert.strictEqual(data['test-agent'].failures, 5, 'persisted failures should be 5');
    });

    test('rejects requests when OPEN with clear error message', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        resetTimeout: 10000,
        cwd: tmpDir,
        agentType: 'test-reject'
      });

      // Open the circuit
      try {
        await breaker.execute(async () => { throw new Error('fail'); });
      } catch (err) {
        // Expected
      }

      assert.strictEqual(breaker.getState(), 'OPEN', 'circuit should be OPEN');

      // Verify rejection with clear message
      await assert.rejects(
        () => breaker.execute(async () => 'success'),
        /Circuit breaker is OPEN/
      );
    });

    test('recovers through HALF_OPEN state after resetTimeout', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 100,
        cwd: tmpDir,
        agentType: 'test-recovery'
      });

      // Open the circuit
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(async () => { throw new Error('fail'); });
        } catch (err) {
          // Expected
        }
      }

      assert.strictEqual(breaker.getState(), 'OPEN', 'should be OPEN');

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Successful operation should close circuit
      const result = await breaker.execute(async () => 'recovered');
      assert.strictEqual(result, 'recovered', 'should return successful result');
      assert.strictEqual(breaker.getState(), 'CLOSED', 'should be CLOSED after recovery');
    });

    test('persists state transitions to metrics.json', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        cwd: tmpDir,
        agentType: 'test-metrics'
      });

      // Trigger state change to OPEN
      try {
        await breaker.execute(async () => { throw new Error('fail'); });
      } catch (err) {
        // Expected
      }

      const metricsPath = path.join(tmpDir, '.planning', 'metrics.json');
      assert.ok(fs.existsSync(metricsPath), 'metrics.json must exist');

      const metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
      assert.ok(Array.isArray(metrics.events), 'must have events array');

      const stateChangeEvent = metrics.events.find(e => e.event === 'circuit_breaker_state_change');
      assert.ok(stateChangeEvent, 'must have circuit_breaker_state_change event');
      assert.strictEqual(stateChangeEvent.agentType, 'test-metrics', 'agentType must match');
      assert.strictEqual(stateChangeEvent.toState, 'OPEN', 'toState must be OPEN');
    });
  });

  describe('CircuitBreakerAdapter with mock delegate', () => {
    test('wraps delegate spawnAgent and counts failures', async () => {
      let callCount = 0;
      const mockDelegate = {
        name: 'mock',
        spawnAgent: async (type, options) => {
          callCount++;
          if (callCount < 3) {
            throw new Error('Simulated failure');
          }
          return { type, status: 'success' };
        },
        callTool: async () => ({}),
        selectModel: () => 'model',
        getInfo: () => ({ name: 'mock' })
      };

      const breaker = new CircuitBreaker({
        failureThreshold: 3,
        cwd: tmpDir,
        agentType: 'mock-adapter'
      });

      const wrapped = new CircuitBreakerAdapter(mockDelegate, breaker);

      // First two calls fail
      for (let i = 0; i < 2; i++) {
        try {
          await wrapped.spawnAgent('test', {});
        } catch (err) {
          // Expected
        }
      }

      // Third call succeeds
      const result = await wrapped.spawnAgent('test', {});
      assert.strictEqual(result.status, 'success', 'third call should succeed');

      // Circuit should be CLOSED after success
      assert.strictEqual(breaker.getState(), 'CLOSED', 'circuit should be CLOSED');
    });

    test('getInfo reflects circuit breaker state', async () => {
      const mockDelegate = {
        name: 'mock',
        spawnAgent: async () => ({}),
        callTool: async () => ({}),
        selectModel: () => 'model',
        getInfo: () => ({ name: 'mock' })
      };

      const breaker = new CircuitBreaker({ cwd: tmpDir, agentType: 'info-test' });
      const wrapped = new CircuitBreakerAdapter(mockDelegate, breaker);

      const info = await wrapped.getInfo();
      assert.ok('circuitBreaker' in info, 'must have circuitBreaker info');
      assert.strictEqual(info.circuitBreaker.state, 'CLOSED', 'initial state should be CLOSED');
      assert.strictEqual(info.circuitBreaker.enabled, true, 'circuit breaker should be enabled');
    });
  });

  describe('createAdapter factory with circuit breaker', () => {
    test('wraps adapter with CircuitBreakerAdapter by default', () => {
      const adapter = createAdapter('claude-code', { cwd: tmpDir });
      assert.ok(adapter instanceof CircuitBreakerAdapter, 'should return CircuitBreakerAdapter');
    });

    test('returns plain adapter when circuitBreaker: false', () => {
      const adapter = createAdapter('claude-code', { circuitBreaker: false });
      assert.ok(!(adapter instanceof CircuitBreakerAdapter), 'should return plain adapter');
      assert.ok(adapter instanceof ClaudeCodeAdapter, 'should return ClaudeCodeAdapter');
    });

    test('creates per-agent-type circuit breakers', () => {
      const claudeAdapter = createAdapter('claude-code', { cwd: tmpDir });
      const qwenAdapter = createAdapter('qwen', { cwd: tmpDir });

      assert.ok(claudeAdapter instanceof CircuitBreakerAdapter, 'claude should be wrapped');
      assert.ok(qwenAdapter instanceof CircuitBreakerAdapter, 'qwen should be wrapped');

      // Each adapter should have its own breaker
      const claudeInfo = claudeAdapter.getInfo();
      const qwenInfo = qwenAdapter.getInfo();

      assert.ok(claudeInfo.circuitBreaker, 'claude should have circuit breaker info');
      assert.ok(qwenInfo.circuitBreaker, 'qwen should have circuit breaker info');
    });
  });

  describe('state persistence across instances', () => {
    test('new instance loads persisted state', async () => {
      const stateFile = path.join(tmpDir, '.planning', 'circuit-breaker.json');
      fs.mkdirSync(path.join(tmpDir, '.planning'), { recursive: true });

      // Write initial state
      fs.writeFileSync(stateFile, JSON.stringify({
        'persist-test': {
          state: 'OPEN',
          failures: 5,
          successes: 2,
          lastFailureTime: new Date().toISOString(),
          lastStateChange: new Date().toISOString()
        }
      }, null, 2));

      // Create new instance - should load state
      const breaker = new CircuitBreaker({
        cwd: tmpDir,
        agentType: 'persist-test'
      });

      const stats = breaker.getStats();
      assert.strictEqual(stats.state, 'OPEN', 'should load OPEN state');
      assert.strictEqual(stats.failures, 5, 'should load 5 failures');
      assert.strictEqual(stats.successes, 2, 'should load 2 successes');
    });

    test('state survives reset and reload', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        cwd: tmpDir,
        agentType: 'reset-test'
      });

      // Open the circuit
      try {
        await breaker.execute(async () => { throw new Error('fail'); });
      } catch (err) {
        // Expected
      }

      // Reset
      await breaker.reset();

      // Create new instance
      const breaker2 = new CircuitBreaker({
        cwd: tmpDir,
        agentType: 'reset-test'
      });

      const stats = breaker2.getStats();
      assert.strictEqual(stats.state, 'CLOSED', 'should be CLOSED after reset');
      assert.strictEqual(stats.failures, 0, 'failures should be 0 after reset');
    });
  });

  describe('per-agent-type isolation', () => {
    test('different agent types have independent circuit breakers', async () => {
      const breaker1 = new CircuitBreaker({
        failureThreshold: 2,
        cwd: tmpDir,
        agentType: 'agent-type-1'
      });

      const breaker2 = new CircuitBreaker({
        failureThreshold: 2,
        cwd: tmpDir,
        agentType: 'agent-type-2'
      });

      // Fail breaker1 twice
      for (let i = 0; i < 2; i++) {
        try {
          await breaker1.execute(async () => { throw new Error('fail'); });
        } catch (err) {
          // Expected
        }
      }

      // breaker1 should be OPEN, breaker2 should be CLOSED
      assert.strictEqual(breaker1.getState(), 'OPEN', 'breaker1 should be OPEN');
      assert.strictEqual(breaker2.getState(), 'CLOSED', 'breaker2 should be CLOSED');

      // breaker2 should still work
      const result = await breaker2.execute(async () => 'success');
      assert.strictEqual(result, 'success', 'breaker2 should still execute successfully');
    });

    test('state file contains all agent types', async () => {
      const breaker1 = new CircuitBreaker({
        failureThreshold: 1,
        cwd: tmpDir,
        agentType: 'multi-agent-1'
      });

      const breaker2 = new CircuitBreaker({
        failureThreshold: 1,
        cwd: tmpDir,
        agentType: 'multi-agent-2'
      });

      // Fail both breakers
      try { await breaker1.execute(async () => { throw new Error('fail'); }); } catch (err) {}
      try { await breaker2.execute(async () => { throw new Error('fail'); }); } catch (err) {}

      const stateFile = path.join(tmpDir, '.planning', 'circuit-breaker.json');
      const data = JSON.parse(fs.readFileSync(stateFile, 'utf8'));

      assert.ok('multi-agent-1' in data, 'must have multi-agent-1 entry');
      assert.ok('multi-agent-2' in data, 'must have multi-agent-2 entry');
      assert.strictEqual(data['multi-agent-1'].state, 'OPEN', 'multi-agent-1 should be OPEN');
      assert.strictEqual(data['multi-agent-2'].state, 'OPEN', 'multi-agent-2 should be OPEN');
    });
  });

  describe('getStats completeness', () => {
    test('returns all required statistics', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 5,
        resetTimeout: 60000,
        cwd: tmpDir,
        agentType: 'stats-test'
      });

      // Execute some operations
      await breaker.execute(async () => 'success');
      try {
        await breaker.execute(async () => { throw new Error('fail'); });
      } catch (err) {
        // Expected
      }

      const stats = breaker.getStats();

      // Verify all required fields
      assert.ok('state' in stats, 'must have state');
      assert.ok('failures' in stats, 'must have failures');
      assert.ok('successes' in stats, 'must have successes');
      assert.ok('failureThreshold' in stats, 'must have failureThreshold');
      assert.ok('resetTimeout' in stats, 'must have resetTimeout');
      assert.ok('lastFailureTime' in stats, 'must have lastFailureTime');
      assert.ok('lastStateChange' in stats, 'must have lastStateChange');
      assert.ok('agentType' in stats, 'must have agentType');

      // Verify values
      assert.strictEqual(stats.state, 'CLOSED', 'state should be CLOSED');
      assert.strictEqual(stats.failures, 1, 'failures should be 1');
      assert.strictEqual(stats.successes, 1, 'successes should be 1');
      assert.strictEqual(stats.failureThreshold, 5, 'failureThreshold should be 5');
      assert.strictEqual(stats.agentType, 'stats-test', 'agentType should match');
    });
  });
});
