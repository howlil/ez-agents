/**
 * EZ Tools Tests - SpotManager Unit Tests
 *
 * Unit tests for spot-manager.cjs covering spot instance management,
 * interruption handling, and cost optimization.
 *
 * These tests are RED (failing) until implementation ships.
 * Requirement: COST-05
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
import assert from 'node:assert';
import * as path from 'path';
import * as fs from 'fs';

import SpotManager from '../../bin/lib/spot-manager.js';

describe('SpotManager', () => {
  let tmpDir, manager;

  beforeEach(() => {
    tmpDir = createTempProject();
    manager = new SpotManager(tmpDir);
  });

  afterEach(() => cleanup(tmpDir));

  test('constructor does not throw', () => {
    assert.ok(manager, 'SpotManager instance must be created without throwing');
  });

  test('requestSpotInstance() provisions spot instance with max price', async () => {
    const instance = await manager.requestSpotInstance({
      instanceType: 'm5.large',
      maxPrice: 0.05,
      availabilityZone: 'us-east-1a'
    });

    assert.ok(instance, 'requestSpotInstance must return instance');
    assert.ok(instance.id, 'instance must have id');
    assert.strictEqual(instance.instanceType, 'm5.large', 'instanceType must match');
    assert.strictEqual(instance.maxPrice, 0.05, 'maxPrice must match');
    assert.strictEqual(instance.status, 'pending', 'initial status must be pending');
  });

  test('handleInterruption() gracefully handles spot instance termination', async () => {
    // Create a spot instance
    const instance = await manager.requestSpotInstance({
      instanceType: 'm5.large',
      maxPrice: 0.05
    });

    // Simulate interruption notice
    const result = await manager.handleInterruption({
      instanceId: instance.id,
      noticeTime: '2026-03-21T10:00:00.000Z',
      terminationTime: '2026-03-21T10:02:00.000Z'
    });

    assert.ok(result, 'handleInterruption must return result');
    assert.strictEqual(result.action, 'checkpoint_and_terminate', 'must checkpoint and terminate');
    assert.ok(result.checkpointCreated, 'must create checkpoint');
  });

  test('getSpotSavings() calculates savings vs on-demand pricing', async () => {
    await manager.recordSpotUsage({
      instanceType: 'm5.large',
      hours: 10,
      spotPrice: 0.03,
      onDemandPrice: 0.10
    });

    const savings = manager.getSpotSavings();

    assert.ok(savings, 'getSpotSavings must return data');
    assert.strictEqual(savings.totalHours, 10, 'totalHours must be 10');
    assert.strictEqual(savings.spotCost, 0.30, 'spotCost must be 0.30 (10 * 0.03)');
    assert.strictEqual(savings.onDemandCost, 1.00, 'onDemandCost must be 1.00 (10 * 0.10)');
    assert.strictEqual(savings.amountSaved, 0.70, 'amountSaved must be 0.70');
    assert.strictEqual(savings.percentSaved, 70, 'percentSaved must be 70%');
  });

  test('getOptimalSpotConfig() recommends best spot instance configuration', async () => {
    // Record historical pricing data
    await manager.recordPriceHistory({
      instanceType: 'm5.large',
      prices: [
        { timestamp: '2026-03-01T00:00:00.000Z', price: 0.03 },
        { timestamp: '2026-03-02T00:00:00.000Z', price: 0.04 },
        { timestamp: '2026-03-03T00:00:00.000Z', price: 0.02 },
        { timestamp: '2026-03-04T00:00:00.000Z', price: 0.05 },
        { timestamp: '2026-03-05T00:00:00.000Z', price: 0.03 }
      ],
      onDemandPrice: 0.10
    });

    const config = manager.getOptimalSpotConfig({
      instanceType: 'm5.large',
      reliabilityTarget: 0.95 // 95% uptime target
    });

    assert.ok(config, 'getOptimalSpotConfig must return config');
    assert.ok(config.recommendedMaxPrice, 'must have recommendedMaxPrice');
    assert.ok(config.expectedSavings, 'must have expectedSavings');
    assert.ok(config.interruptionRisk, 'must have interruptionRisk');
  });
});
