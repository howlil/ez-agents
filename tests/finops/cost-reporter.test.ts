/**
 * EZ Tools Tests - CostReporter Unit Tests
 *
 * Unit tests for cost-reporter.cjs covering cost reporting,
 * data aggregation, and export functionality.
 *
 * These tests are RED (failing) until implementation ships.
 * Requirement: COST-04
 */



import * as path from 'path';
import * as fs from 'fs';

import { CostReporter } from '../../bin/lib/finops/cost-reporter.js';

describe('CostReporter', () => {
  let tmpDir, reporter;

  beforeEach(() => {
    tmpDir = createTempProject();
    reporter = new CostReporter(tmpDir);
  });

  afterEach(() => cleanup(tmpDir));

  test('constructor does not throw', () => {
    expect(reporter).toBeTruthy() // 'CostReporter instance must be created without throwing';
  });

  test('generateReport() creates cost summary with breakdowns', async () => {
    const report = await reporter.generateReport({
      startDate: '2026-03-01',
      endDate: '2026-03-31',
      granularity: 'daily'
    });

    expect(report).toBeTruthy() // 'generateReport must return report';
    expect(report.period).toBeTruthy() // 'report must have period data';
    expect(report.period.startDate).toBe('2026-03-01', 'startDate must match');
    expect(report.period.endDate).toBe('2026-03-31', 'endDate must match');
    expect(report.summary).toBeTruthy() // 'report must have summary section';
    expect(report.summary.total).toBeTruthy() // 'summary must have total cost';
    expect(report.breakdown).toBeTruthy() // 'report must have breakdown section';
  });

  test('getCostByService() returns costs grouped by service', async () => {
    await reporter.recordCost({ service: 'compute', amount: 100, date: '2026-03-15' });
    await reporter.recordCost({ service: 'storage', amount: 50, date: '2026-03-15' });
    await reporter.recordCost({ service: 'compute', amount: 75, date: '2026-03-16' });

    const breakdown = reporter.getCostByService({
      startDate: '2026-03-01',
      endDate: '2026-03-31'
    });

    expect(breakdown).toBeTruthy() // 'getCostByService must return data';
    expect(breakdown.compute).toBe(175, 'compute cost must be 175');
    expect(breakdown.storage).toBe(50, 'storage cost must be 50');
    expect(breakdown.total).toBe(225, 'total must be 225');
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

    expect(byPeriod).toBeTruthy() // 'getCostByPeriod must return data';
    expect(Array.isArray(byPeriod.periods)).toBeTruthy() // 'must have periods array';
    const march = byPeriod.periods.find(p => p.period === '2026-03');
    const april = byPeriod.periods.find(p => p.period === '2026-04');
    expect(march.total).toBe(30, 'March total must be 30');
    expect(april.total).toBe(30, 'April total must be 30');
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

    expect(outputPath).toBeTruthy() // 'exportReport must return file path';
    expect(fs.existsSync(outputPath)).toBeTruthy() // 'report file must exist';

    const content = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    expect(content.summary).toBeTruthy() // 'exported report must have summary';
    expect(content.summary.total).toBeTruthy() // 'summary must have total';
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

    expect(comparison).toBeTruthy() // 'comparePeriods must return data';
    expect(comparison.period1.total).toBe(100, 'period1 total must be 100');
    expect(comparison.period2.total).toBe(150, 'period2 total must be 150');
    expect(comparison.change.amount).toBe(50, 'change amount must be 50');
    expect(comparison.change.percent).toBe(50, 'change percent must be 50');
  });
});
