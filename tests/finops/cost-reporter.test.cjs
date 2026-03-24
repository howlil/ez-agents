/**
 * EZ Tools Tests - CostReporter Unit Tests
 *
 * Unit tests for cost-reporter.cjs covering cost reporting,
 * data aggregation, and export functionality.
 *
 * These tests are RED (failing) until implementation ships.
 * Requirement: COST-04
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const { createTempProject, cleanup } = require('../helpers.cjs');
const CostReporter = require('../../ez-agents/bin/lib/cost-reporter.cjs');

describe('CostReporter', () => {
  let tmpDir, reporter;

  beforeEach(() => {
    tmpDir = createTempProject();
    reporter = new CostReporter(tmpDir);
  });

  afterEach(() => cleanup(tmpDir));

  test('constructor does not throw', () => {
    assert.ok(reporter, 'CostReporter instance must be created without throwing');
  });

  test('generateReport() creates cost summary with breakdowns', async () => {
    const report = await reporter.generateReport({
      startDate: '2026-03-01',
      endDate: '2026-03-31',
      granularity: 'daily'
    });

    assert.ok(report, 'generateReport must return report');
    assert.ok(report.period, 'report must have period data');
    assert.strictEqual(report.period.startDate, '2026-03-01', 'startDate must match');
    assert.strictEqual(report.period.endDate, '2026-03-31', 'endDate must match');
    assert.ok(report.summary, 'report must have summary section');
    assert.ok(report.summary.total, 'summary must have total cost');
    assert.ok(report.breakdown, 'report must have breakdown section');
  });

  test('getCostByService() returns costs grouped by service', async () => {
    await reporter.recordCost({ service: 'compute', amount: 100, date: '2026-03-15' });
    await reporter.recordCost({ service: 'storage', amount: 50, date: '2026-03-15' });
    await reporter.recordCost({ service: 'compute', amount: 75, date: '2026-03-16' });

    const breakdown = reporter.getCostByService({
      startDate: '2026-03-01',
      endDate: '2026-03-31'
    });

    assert.ok(breakdown, 'getCostByService must return data');
    assert.strictEqual(breakdown.compute, 175, 'compute cost must be 175');
    assert.strictEqual(breakdown.storage, 50, 'storage cost must be 50');
    assert.strictEqual(breakdown.total, 225, 'total must be 225');
  });

  test('getCostByPeriod() returns costs grouped by time period', async () => {
    await reporter.recordCost({ service: 'api', amount: 10, date: '2026-03-01' });
    await reporter.recordCost({ service: 'api', amount: 20, date: '2026-03-15' });
    await reporter.recordCost({ service: 'api', amount: 30, date: '2026-04-01' });

    const byPeriod = reporter.getCostByPeriod({
      startDate: '2026-03-01',
      endDate: '2026-04-30',
      period: 'month'
    });

    assert.ok(byPeriod, 'getCostByPeriod must return data');
    assert.ok(Array.isArray(byPeriod.periods), 'must have periods array');
    const march = byPeriod.periods.find(p => p.period === '2026-03');
    const april = byPeriod.periods.find(p => p.period === '2026-04');
    assert.strictEqual(march.total, 30, 'March total must be 30');
    assert.strictEqual(april.total, 30, 'April total must be 30');
  });

  test('exportReport() writes report to file in specified format', async () => {
    await reporter.recordCost({ service: 'compute', amount: 100, date: '2026-03-15' });

    const outputPath = await reporter.exportReport({
      startDate: '2026-03-01',
      endDate: '2026-03-31'
    }, {
      format: 'json',
      filename: 'cost-report-march'
    });

    assert.ok(outputPath, 'exportReport must return file path');
    assert.ok(fs.existsSync(outputPath), 'report file must exist');

    const content = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    assert.ok(content.summary, 'exported report must have summary');
    assert.ok(content.summary.total, 'summary must have total');
  });

  test('comparePeriods() returns cost comparison between two periods', async () => {
    // Period 1: March
    await reporter.recordCost({ service: 'api', amount: 100, date: '2026-03-15' });
    // Period 2: April
    await reporter.recordCost({ service: 'api', amount: 150, date: '2026-04-15' });

    const comparison = reporter.comparePeriods({
      period1: { startDate: '2026-03-01', endDate: '2026-03-31' },
      period2: { startDate: '2026-04-01', endDate: '2026-04-30' }
    });

    assert.ok(comparison, 'comparePeriods must return data');
    assert.strictEqual(comparison.period1.total, 100, 'period1 total must be 100');
    assert.strictEqual(comparison.period2.total, 150, 'period2 total must be 150');
    assert.strictEqual(comparison.change.amount, 50, 'change amount must be 50');
    assert.strictEqual(comparison.change.percent, 50, 'change percent must be 50');
  });
});
