/**
 * EZ Tools Tests - FinOpsAnalyzer Unit Tests
 *
 * Unit tests for finops-analyzer.cjs covering cost analysis,
 * optimization recommendations, and trend detection.
 *
 * These tests are RED (failing) until implementation ships.
 * Requirement: COST-02
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const { createTempProject, cleanup } = require('../helpers.cjs');
const FinOpsAnalyzer = require('../../ez-agents/bin/lib/finops-analyzer.cjs');

describe('FinOpsAnalyzer', () => {
  let tmpDir, analyzer;

  beforeEach(() => {
    tmpDir = createTempProject();
    analyzer = new FinOpsAnalyzer(tmpDir);
  });

  afterEach(() => cleanup(tmpDir));

  test('constructor does not throw', () => {
    assert.ok(analyzer, 'FinOpsAnalyzer instance must be created without throwing');
  });

  test('analyzeCosts() returns breakdown by service and trend', async () => {
    const analysis = await analyzer.analyzeCosts({
      startDate: '2026-03-01',
      endDate: '2026-03-31'
    });

    assert.ok(analysis, 'analyzeCosts must return analysis');
    assert.ok(analysis.total, 'must have total cost');
    assert.ok(analysis.byService, 'must have byService breakdown');
    assert.ok(analysis.trend, 'must have trend data');
  });

  test('getOptimizationRecommendations() returns actionable cost savings', async () => {
    // Record some spending patterns
    await analyzer.recordCost({
      service: 'compute',
      amount: 500,
      date: '2026-03-15',
      metadata: { instanceType: 'on_demand' }
    });
    await analyzer.recordCost({
      service: 'storage',
      amount: 200,
      date: '2026-03-15',
      metadata: { tier: 'premium' }
    });

    const recommendations = analyzer.getOptimizationRecommendations();

    assert.ok(recommendations, 'getOptimizationRecommendations must return data');
    assert.ok(Array.isArray(recommendations.items), 'must have recommendations array');
    recommendations.items.forEach(rec => {
      assert.ok(rec.category, 'recommendation must have category');
      assert.ok(rec.description, 'recommendation must have description');
      assert.ok(rec.estimatedSavings, 'recommendation must have estimatedSavings');
    });
  });

  test('detectAnomalies() identifies unusual spending patterns', async () => {
    // Record normal spending
    for (let i = 1; i <= 14; i++) {
      const date = `2026-03-${String(i).padStart(2, '0')}`;
      await analyzer.recordCost({
        service: 'api',
        amount: 10 + Math.random() * 5, // Normal: 10-15
        date
      });
    }
    // Record anomaly
    await analyzer.recordCost({
      service: 'api',
      amount: 100, // Anomaly: 100
      date: '2026-03-15'
    });

    const anomalies = analyzer.detectAnomalies({ threshold: 2 }); // 2 standard deviations

    assert.ok(anomalies, 'detectAnomalies must return data');
    assert.ok(Array.isArray(anomalies.items), 'must have anomalies array');
    assert.ok(anomalies.items.length > 0, 'must detect at least one anomaly');
    const anomaly = anomalies.items[0];
    assert.ok(anomaly.date, 'anomaly must have date');
    assert.ok(anomaly.expected, 'anomaly must have expected value');
    assert.ok(anomaly.actual, 'anomaly must have actual value');
  });

  test('forecastSpending() predicts future costs based on historical data', async () => {
    // Record historical spending
    for (let i = 1; i <= 30; i++) {
      const date = `2026-03-${String(i).padStart(2, '0')}`;
      await analyzer.recordCost({
        service: 'compute',
        amount: 50 + i, // Increasing trend
        date
      });
    }

    const forecast = analyzer.forecastSpending({ days: 7 });

    assert.ok(forecast, 'forecastSpending must return forecast');
    assert.ok(Array.isArray(forecast.predictions), 'must have predictions array');
    assert.strictEqual(forecast.predictions.length, 7, 'must forecast 7 days');
    assert.ok(forecast.confidence, 'must have confidence level');
    forecast.predictions.forEach(pred => {
      assert.ok(pred.date, 'prediction must have date');
      assert.ok(pred.estimatedCost, 'prediction must have estimatedCost');
    });
  });

  test('getCostPerUnit() calculates efficiency metrics', async () => {
    await analyzer.recordCost({
      service: 'api',
      amount: 100,
      date: '2026-03-15',
      units: 1000 // 1000 API calls
    });
    await analyzer.recordCost({
      service: 'api',
      amount: 150,
      date: '2026-03-16',
      units: 1500 // 1500 API calls
    });

    const metrics = analyzer.getCostPerUnit({ service: 'api' });

    assert.ok(metrics, 'getCostPerUnit must return metrics');
    assert.ok(metrics.averageCostPerUnit, 'must have averageCostPerUnit');
    assert.strictEqual(metrics.totalCost, 250, 'totalCost must be 250');
    assert.strictEqual(metrics.totalUnits, 2500, 'totalUnits must be 2500');
    assert.strictEqual(metrics.averageCostPerUnit, 0.1, 'average cost per unit must be 0.1');
  });
});
