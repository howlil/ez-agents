/**
 * EZ Tools Tests - FinOpsAnalyzer Unit Tests
 *
 * Unit tests for finops-analyzer.cjs covering cost analysis,
 * optimization recommendations, and trend detection.
 *
 * These tests are RED (failing) until implementation ships.
 * Requirement: COST-02
 */



import * as path from 'path';
import * as fs from 'fs';

import { FinopsAnalyzer } from '../../bin/lib/finops/finops-analyzer.js';

describe('FinOpsAnalyzer', () => {
  let tmpDir, analyzer;

  beforeEach(() => {
    tmpDir = createTempProject();
    analyzer = new FinopsAnalyzer(tmpDir);
  });

  afterEach(() => cleanup(tmpDir));

  test('constructor does not throw', () => {
    expect(analyzer).toBeTruthy() // 'FinOpsAnalyzer instance must be created without throwing';
  });

  test('analyzeCosts() returns breakdown by service and trend', async () => {
    const analysis = await analyzer.analyzeCosts({
      startDate: '2026-03-01',
      endDate: '2026-03-31'
    });

    expect(analysis).toBeTruthy() // 'analyzeCosts must return analysis';
    expect(analysis.total).toBeTruthy() // 'must have total cost';
    expect(analysis.byService).toBeTruthy() // 'must have byService breakdown';
    expect(analysis.trend).toBeTruthy() // 'must have trend data';
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

    expect(recommendations).toBeTruthy() // 'getOptimizationRecommendations must return data';
    expect(Array.isArray(recommendations.items)).toBeTruthy() // 'must have recommendations array';
    recommendations.items.forEach(rec => {
      expect(rec.category).toBeTruthy() // 'recommendation must have category';
      expect(rec.description).toBeTruthy() // 'recommendation must have description';
      expect(rec.estimatedSavings).toBeTruthy() // 'recommendation must have estimatedSavings';
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

    expect(anomalies).toBeTruthy() // 'detectAnomalies must return data';
    expect(Array.isArray(anomalies.items)).toBeTruthy() // 'must have anomalies array';
    expect(anomalies.items.length > 0).toBeTruthy() // 'must detect at least one anomaly';
    const anomaly = anomalies.items[0];
    expect(anomaly.date).toBeTruthy() // 'anomaly must have date';
    expect(anomaly.expected).toBeTruthy() // 'anomaly must have expected value';
    expect(anomaly.actual).toBeTruthy() // 'anomaly must have actual value';
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

    expect(forecast).toBeTruthy() // 'forecastSpending must return forecast';
    expect(Array.isArray(forecast.predictions)).toBeTruthy() // 'must have predictions array';
    expect(forecast.predictions.length).toBe(7, 'must forecast 7 days');
    expect(forecast.confidence).toBeTruthy() // 'must have confidence level';
    forecast.predictions.forEach(pred => {
      expect(pred.date).toBeTruthy() // 'prediction must have date';
      expect(pred.estimatedCost).toBeTruthy() // 'prediction must have estimatedCost';
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

    expect(metrics).toBeTruthy() // 'getCostPerUnit must return metrics';
    expect(metrics.averageCostPerUnit).toBeTruthy() // 'must have averageCostPerUnit';
    expect(metrics.totalCost).toBe(250, 'totalCost must be 250');
    expect(metrics.totalUnits).toBe(2500, 'totalUnits must be 2500');
    expect(metrics.averageCostPerUnit).toBe(0.1, 'average cost per unit must be 0.1');
  });
});
