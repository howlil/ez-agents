/**
 * EZ Tools Tests - AnalyticsReporter Unit Tests
 *
 * Unit tests for analytics-reporter.cjs covering report generation,
 * data aggregation, and export functionality.
 *
 * These tests are RED (failing) until implementation ships.
 * Requirement: ANALYTICS-05
 */



import * as path from 'path';
import * as fs from 'fs';

import { AnalyticsReporter } from '../../bin/lib/analytics/analytics-reporter.js';

describe('AnalyticsReporter', () => {
  let tmpDir, reporter;

  beforeEach(() => {
    tmpDir = createTempProject();
    reporter = new AnalyticsReporter(tmpDir);
  });

  afterEach(() => cleanup(tmpDir));

  test('constructor does not throw', () => {
    expect(reporter).toBeTruthy() // 'AnalyticsReporter instance must be created without throwing';
  });

  test('generateReport() creates summary with key metrics', async () => {
    const report = await reporter.generateReport({
      type: 'weekly',
      startDate: '2026-03-01',
      endDate: '2026-03-07'
    });

    expect(report).toBeTruthy() // 'generateReport must return report';
    expect(report.generatedAt).toBeTruthy() // 'report must have generatedAt timestamp';
    expect(report.period).toBeTruthy() // 'report must have period data';
    expect(report.period.startDate).toBe('2026-03-01', 'startDate must match');
    expect(report.period.endDate).toBe('2026-03-07', 'endDate must match');
    expect(report.metrics).toBeTruthy() // 'report must have metrics section';
  });

  test('aggregateMetrics() combines data from multiple sources', async () => {
    const aggregated = await reporter.aggregateMetrics({
      sources: ['events', 'sessions', 'conversions'],
      startDate: '2026-03-01',
      endDate: '2026-03-31'
    });

    expect(aggregated).toBeTruthy() // 'aggregateMetrics must return data';
    expect(aggregated.summary).toBeTruthy() // 'must have summary section';
    expect(Array.isArray(aggregated.bySource)).toBeTruthy() // 'must have bySource array';
    expect(aggregated.bySource.length).toBe(3, 'must aggregate 3 sources');
  });

  test('exportReport() writes report to file in specified format', async () => {
    const report = {
      generatedAt: '2026-03-21T00:00:00.000Z',
      period: { startDate: '2026-03-01', endDate: '2026-03-07' },
      metrics: { totalUsers: 100, activeUsers: 50 }
    };

    const outputPath = await reporter.exportReport(report, {
      format: 'json',
      filename: 'weekly-report'
    });

    expect(outputPath).toBeTruthy() // 'exportReport must return file path';
    expect(fs.existsSync(outputPath)).toBeTruthy() // 'report file must exist';

    const content = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    assert.deepStrictEqual(content, report, 'file content must match report');
  });

  test('scheduleReport() creates recurring report configuration', async () => {
    const schedule = await reporter.scheduleReport({
      name: 'monthly_summary',
      type: 'monthly',
      recipients: ['team@example.com'],
      format: 'pdf',
      cron: '0 0 1 * *' // First day of month
    });

    expect(schedule).toBeTruthy() // 'scheduleReport must return schedule config';
    expect(schedule.name).toBe('monthly_summary', 'name must match');
    expect(schedule.type).toBe('monthly', 'type must match');
    expect(schedule.id).toBeTruthy() // 'must have schedule ID';
    expect(schedule.enabled).toBeTruthy() // 'schedule must be enabled by default';

    const dataPath = path.join(tmpDir, '.planning', 'report-schedules.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    expect(Array.isArray(data.schedules)).toBeTruthy() // 'must have schedules array';
    expect(data.schedules.length).toBe(1, 'must have 1 scheduled report');
  });
});
