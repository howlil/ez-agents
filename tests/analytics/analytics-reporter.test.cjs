/**
 * EZ Tools Tests - AnalyticsReporter Unit Tests
 *
 * Unit tests for analytics-reporter.cjs covering report generation,
 * data aggregation, and export functionality.
 *
 * These tests are RED (failing) until implementation ships.
 * Requirement: ANALYTICS-05
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const { createTempProject, cleanup } = require('../helpers.cjs');
const AnalyticsReporter = require('../../ez-agents/bin/lib/analytics-reporter.cjs');

describe('AnalyticsReporter', () => {
  let tmpDir, reporter;

  beforeEach(() => {
    tmpDir = createTempProject();
    reporter = new AnalyticsReporter(tmpDir);
  });

  afterEach(() => cleanup(tmpDir));

  test('constructor does not throw', () => {
    assert.ok(reporter, 'AnalyticsReporter instance must be created without throwing');
  });

  test('generateReport() creates summary with key metrics', async () => {
    const report = await reporter.generateReport({
      type: 'weekly',
      startDate: '2026-03-01',
      endDate: '2026-03-07'
    });

    assert.ok(report, 'generateReport must return report');
    assert.ok(report.generatedAt, 'report must have generatedAt timestamp');
    assert.ok(report.period, 'report must have period data');
    assert.strictEqual(report.period.startDate, '2026-03-01', 'startDate must match');
    assert.strictEqual(report.period.endDate, '2026-03-07', 'endDate must match');
    assert.ok(report.metrics, 'report must have metrics section');
  });

  test('aggregateMetrics() combines data from multiple sources', async () => {
    const aggregated = await reporter.aggregateMetrics({
      sources: ['events', 'sessions', 'conversions'],
      startDate: '2026-03-01',
      endDate: '2026-03-31'
    });

    assert.ok(aggregated, 'aggregateMetrics must return data');
    assert.ok(aggregated.summary, 'must have summary section');
    assert.ok(Array.isArray(aggregated.bySource), 'must have bySource array');
    assert.strictEqual(aggregated.bySource.length, 3, 'must aggregate 3 sources');
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

    assert.ok(outputPath, 'exportReport must return file path');
    assert.ok(fs.existsSync(outputPath), 'report file must exist');

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

    assert.ok(schedule, 'scheduleReport must return schedule config');
    assert.strictEqual(schedule.name, 'monthly_summary', 'name must match');
    assert.strictEqual(schedule.type, 'monthly', 'type must match');
    assert.ok(schedule.id, 'must have schedule ID');
    assert.ok(schedule.enabled, 'schedule must be enabled by default');

    const dataPath = path.join(tmpDir, '.planning', 'report-schedules.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    assert.ok(Array.isArray(data.schedules), 'must have schedules array');
    assert.strictEqual(data.schedules.length, 1, 'must have 1 scheduled report');
  });
});
