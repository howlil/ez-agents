/**
 * EZ Tools Tests - Circuit Breaker Unit Tests
 *
 * Tests for CIRCUIT-01: Circuit breaker integration with agent spawns
 * Tests state transitions, persistence, and CircuitBreakerAdapter wrapper
 */



import * as path from 'path';
import * as fs from 'fs';
import { createTempProject, cleanup } from '../helpers.ts';
import { CircuitBreaker } from '../../bin/lib/circuit-breaker.ts';
// @ts-expect-error Adapters may not be exported but tested for completeness
import { CircuitBreakerAdapter, createAdapter } from '../../bin/lib/assistant-adapter.ts';

describe('CircuitBreaker (CIRCUIT-01)', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => cleanup(tmpDir));

  describe('state transitions', () => {
    test('starts in CLOSED state', () => {
      const breaker = new CircuitBreaker({ cwd: tmpDir });
      expect(breaker.getState()).toBe('CLOSED', 'should start CLOSED');
    });

    test('transitions to OPEN after failureThreshold failures', async () => {
      const breaker = new CircuitBreaker({ failureThreshold: 3, cwd: tmpDir, agentType: 'test1' });
      const failingOp = async () => { throw new Error('fail'); };

      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(failingOp);
        } catch {
          // Expected
        }
      }

      expect(breaker.getState()).toBe('OPEN', 'should be OPEN after 3 failures');
    });

    test('transitions to HALF_OPEN after resetTimeout', async () => {
      const breaker = new CircuitBreaker({ failureThreshold: 2, resetTimeout: 100, cwd: tmpDir, agentType: 'test2' });
      const failingOp = async () => { throw new Error('fail'); };

      // Trigger OPEN state
      try { await breaker.execute(failingOp); } catch { /* Expected - 1 failure */ }
      try { await breaker.execute(failingOp); } catch { /* Expected - 2 failures, should open */ }

      expect(breaker.getState()).toBe('OPEN', 'should be OPEN after 2 failures');

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Next execute should transition to HALF_OPEN then CLOSED on success
      await breaker.execute(async () => 'success');

      expect(breaker.getState()).toBe('CLOSED', 'should be CLOSED after successful recovery');
    });

    test('rejects requests when OPEN', async () => {
      const breaker = new CircuitBreaker({ failureThreshold: 1, resetTimeout: 10000, cwd: tmpDir, agentType: 'test3' });
      const failingOp = async () => { throw new Error('fail'); };

      try { await breaker.execute(failingOp); } catch { /* Expected */ }

      // Should be OPEN now
      expect(breaker.getState()).toBe('OPEN', 'should be OPEN after 1 failure');

      // Next request should be rejected
      await assert.rejects(
        async () => breaker.execute(async () => 'success'),
        /Circuit breaker is OPEN/
      );
    });
  });

  describe('CircuitBreakerAdapter', () => {
    test('creates adapter with correct configuration', () => {
      const adapter = createAdapter('ez-planner', { cwd: tmpDir });
      expect(adapter instanceof CircuitBreakerAdapter).toBeTruthy() // 'should create adapter';
    });

    test('wraps function calls with circuit breaker', async () => {
      const adapter = createAdapter('ez-planner', { cwd: tmpDir });
      const result = await adapter.execute(async () => 'success');
      expect(result).toBe('success', 'should return result');
    });
  });
});
