/**
 * EZ Tools Tests - CohortAnalyzer Unit Tests
 *
 * Unit tests for cohort-analyzer.cjs covering cohort definition,
 * retention calculation, and comparative analysis.
 *
 * These tests are RED (failing) until implementation ships.
 * Requirement: ANALYTICS-04
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
import assert from 'node:assert';
import * as path from 'path';
import * as fs from 'fs';

import CohortAnalyzer from '../../bin/lib/cohort-analyzer.js';

describe('CohortAnalyzer', () => {
  let tmpDir, analyzer;

  beforeEach(() => {
    tmpDir = createTempProject();
    analyzer = new CohortAnalyzer(tmpDir);
  });

  afterEach(() => cleanup(tmpDir));

  test('constructor does not throw', () => {
    assert.ok(analyzer, 'CohortAnalyzer instance must be created without throwing');
  });

  test('defineCohort() creates cohort by signup period', async () => {
    const cohort = {
      name: 'january_2026',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      criteria: { event: 'user_signed_up' }
    };

    await analyzer.defineCohort(cohort);

    const dataPath = path.join(tmpDir, '.planning', 'cohorts.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    assert.ok(Array.isArray(data.cohorts), 'cohorts.json must have cohorts array');
    assert.strictEqual(data.cohorts.length, 1, 'must have 1 cohort');

    const saved = data.cohorts[0];
    assert.strictEqual(saved.name, 'january_2026', 'cohort name must match');
    assert.strictEqual(saved.startDate, '2026-01-01', 'startDate must match');
    assert.strictEqual(saved.endDate, '2026-01-31', 'endDate must match');
  });

  test('addUserToCohort() assigns user based on signup date', async () => {
    await analyzer.defineCohort({
      name: 'week1_march',
      startDate: '2026-03-01',
      endDate: '2026-03-07',
      criteria: { event: 'user_signed_up' }
    });

    await analyzer.addUserToCohort('user-1', '2026-03-02');
    await analyzer.addUserToCohort('user-2', '2026-03-05');

    const dataPath = path.join(tmpDir, '.planning', 'cohorts.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    assert.ok(data.memberships, 'must have memberships data');
    const week1Members = data.memberships['week1_march'];
    assert.ok(week1Members, 'must have week1_march members');
    assert.strictEqual(week1Members.length, 2, 'must have 2 members');
    assert.ok(week1Members.includes('user-1'), 'must include user-1');
    assert.ok(week1Members.includes('user-2'), 'must include user-2');
  });

  test('calculateRetention() returns retention rate per period', async () => {
    await analyzer.defineCohort({
      name: 'test_cohort',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      criteria: { event: 'user_signed_up' }
    });

    // 10 users in cohort
    for (let i = 0; i < 10; i++) {
      await analyzer.addUserToCohort(`user-${i}`, '2026-01-15');
    }

    // Record activity: 10 in week 0, 7 in week 1, 5 in week 2, 3 in week 3
    for (let i = 0; i < 10; i++) {
      await analyzer.recordActivity(`user-${i}`, '2026-01-15'); // week 0
    }
    for (let i = 0; i < 7; i++) {
      await analyzer.recordActivity(`user-${i}`, '2026-01-22'); // week 1
    }
    for (let i = 0; i < 5; i++) {
      await analyzer.recordActivity(`user-${i}`, '2026-01-29'); // week 2
    }
    for (let i = 0; i < 3; i++) {
      await analyzer.recordActivity(`user-${i}`, '2026-02-05'); // week 3
    }

    const retention = analyzer.calculateRetention('test_cohort', { period: 'week' });

    assert.ok(retention, 'calculateRetention must return data');
    assert.ok(Array.isArray(retention.periods), 'must have periods array');
    assert.strictEqual(retention.periods[0].rate, 100, 'week 0 must be 100%');
    assert.strictEqual(retention.periods[1].rate, 70, 'week 1 must be 70%');
    assert.strictEqual(retention.periods[2].rate, 50, 'week 2 must be 50%');
    assert.strictEqual(retention.periods[3].rate, 30, 'week 3 must be 30%');
  });

  test('compareCohorts() returns comparative retention metrics', async () => {
    // Cohort A: 10 users, 50% retention at week 1
    await analyzer.defineCohort({
      name: 'cohort_a',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      criteria: { event: 'user_signed_up' }
    });
    for (let i = 0; i < 10; i++) {
      await analyzer.addUserToCohort(`a-${i}`, '2026-01-15');
      await analyzer.recordActivity(`a-${i}`, '2026-01-15');
    }
    for (let i = 0; i < 5; i++) {
      await analyzer.recordActivity(`a-${i}`, '2026-01-22');
    }

    // Cohort B: 10 users, 80% retention at week 1
    await analyzer.defineCohort({
      name: 'cohort_b',
      startDate: '2026-02-01',
      endDate: '2026-02-28',
      criteria: { event: 'user_signed_up' }
    });
    for (let i = 0; i < 10; i++) {
      await analyzer.addUserToCohort(`b-${i}`, '2026-02-15');
      await analyzer.recordActivity(`b-${i}`, '2026-02-15');
    }
    for (let i = 0; i < 8; i++) {
      await analyzer.recordActivity(`b-${i}`, '2026-02-22');
    }

    const comparison = analyzer.compareCohorts(['cohort_a', 'cohort_b'], { period: 'week' });

    assert.ok(comparison, 'compareCohorts must return data');
    assert.ok(Array.isArray(comparison.cohorts), 'must have cohorts array');
    assert.strictEqual(comparison.cohorts.length, 2, 'must compare 2 cohorts');
    assert.ok(comparison.summary, 'must have summary data');
  });

  test('getCohortMetrics() returns size, activity, and lifetime value', async () => {
    await analyzer.defineCohort({
      name: 'premium_cohort',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      criteria: { event: 'user_signed_up' }
    });

    for (let i = 0; i < 5; i++) {
      await analyzer.addUserToCohort(`user-${i}`, '2026-01-15');
      await analyzer.recordActivity(`user-${i}`, '2026-01-15');
      await analyzer.recordValue(`user-${i}`, 100); // $100 LTV each
    }

    const metrics = analyzer.getCohortMetrics('premium_cohort');

    assert.ok(metrics, 'getCohortMetrics must return data');
    assert.strictEqual(metrics.size, 5, 'cohort size must be 5');
    assert.strictEqual(metrics.totalValue, 500, 'total value must be 500');
    assert.strictEqual(metrics.avgValuePerUser, 100, 'avg value per user must be 100');
  });
});
