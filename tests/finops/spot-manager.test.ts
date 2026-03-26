/**
 * EZ Tools Tests - SpotManager Unit Tests
 *
 * Unit tests for spot-manager.cjs covering spot instance management,
 * interruption handling, and cost optimization.
 *
 * These tests are RED (failing) until implementation ships.
 * Requirement: COST-05
 */



import * as path from 'path';
import * as fs from 'fs';

import { SpotManager } from '../../bin/lib/finops/spot-manager.js';

describe('SpotManager', () => {
  let tmpDir, manager;

  beforeEach(() => {
    tmpDir = createTempProject();
    manager = new SpotManager(tmpDir);
  });

  afterEach(() => cleanup(tmpDir));

  test('constructor does not throw', () => {
    expect(manager).toBeTruthy() // 'SpotManager instance must be created without throwing';
  });

  test('requestSpotInstance() provisions spot instance with max price', async () => {
    const instance = await manager.requestSpotInstance({
      instanceType: 'm5.large',
      maxPrice: 0.05,
      availabilityZone: 'us-east-1a'
    });

    expect(instance).toBeTruthy() // 'requestSpotInstance must return instance';
    expect(instance.id).toBeTruthy() // 'instance must have id';
    expect(instance.instanceType).toBe('m5.large', 'instanceType must match');
    expect(instance.maxPrice).toBe(0.05, 'maxPrice must match');
    expect(instance.status).toBe('pending', 'initial status must be pending');
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

    expect(result).toBeTruthy() // 'handleInterruption must return result';
    expect(result?.action).toBe('checkpoint_and_terminate', 'must checkpoint and terminate');
    expect(result.checkpointCreated).toBeTruthy() // 'must create checkpoint';
  });

  test('getSpotSavings() calculates savings vs on-demand pricing', async () => {
    await manager.recordSpotUsage({
      instanceType: 'm5.large',
      hours: 10,
      spotPrice: 0.03,
      onDemandPrice: 0.10
    });

    const savings = manager.getSpotSavings();

    expect(savings).toBeTruthy() // 'getSpotSavings must return data';
    expect(savings.totalHours).toBe(10, 'totalHours must be 10');
    expect(savings.spotCost).toBe(0.30, 'spotCost must be 0.30 (10 * 0.03)');
    expect(savings.onDemandCost).toBe(1.00, 'onDemandCost must be 1.00 (10 * 0.10)');
    expect(savings.amountSaved).toBe(0.70, 'amountSaved must be 0.70');
    expect(savings.percentSaved).toBe(70, 'percentSaved must be 70%');
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

    expect(config).toBeTruthy() // 'getOptimalSpotConfig must return config';
    expect(config.recommendedMaxPrice).toBeTruthy() // 'must have recommendedMaxPrice';
    expect(config.expectedSavings).toBeTruthy() // 'must have expectedSavings';
    expect(config.interruptionRisk).toBeTruthy() // 'must have interruptionRisk';
  });
});
