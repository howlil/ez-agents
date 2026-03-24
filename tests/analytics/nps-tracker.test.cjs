/**
 * EZ Tools Tests - NPSTracker Unit Tests
 *
 * Unit tests for nps-tracker.cjs covering NPS score calculation,
 * response categorization, and trend analysis.
 *
 * These tests are RED (failing) until implementation ships.
 * Requirement: ANALYTICS-02
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const { createTempProject, cleanup } = require('../helpers.cjs');
const NPSTracker = require('../../ez-agents/bin/lib/nps-tracker.cjs');

describe('NPSTracker', () => {
  let tmpDir, tracker;

  beforeEach(() => {
    tmpDir = createTempProject();
    tracker = new NPSTracker(tmpDir);
  });

  afterEach(() => cleanup(tmpDir));

  test('constructor does not throw', () => {
    assert.ok(tracker, 'NPSTracker instance must be created without throwing');
  });

  test('recordResponse() categorizes promoters (9-10), passives (7-8), detractors (0-6)', async () => {
    await tracker.recordResponse({ userId: 'u1', score: 10, feedback: 'Love it!' });
    await tracker.recordResponse({ userId: 'u2', score: 9, feedback: 'Great!' });
    await tracker.recordResponse({ userId: 'u3', score: 7, feedback: 'Good' });
    await tracker.recordResponse({ userId: 'u4', score: 5, feedback: 'Okay' });
    await tracker.recordResponse({ userId: 'u5', score: 3, feedback: 'Not great' });

    const dataPath = path.join(tmpDir, '.planning', 'nps.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    assert.ok(Array.isArray(data.responses), 'nps.json must have responses array');
    assert.strictEqual(data.responses.length, 5, 'must have 5 responses');

    const promoters = data.responses.filter(r => r.category === 'promoter');
    const passives = data.responses.filter(r => r.category === 'passive');
    const detractors = data.responses.filter(r => r.category === 'detractor');

    assert.strictEqual(promoters.length, 2, 'must have 2 promoters (scores 9-10)');
    assert.strictEqual(passives.length, 1, 'must have 1 passive (score 7-8)');
    assert.strictEqual(detractors.length, 2, 'must have 2 detractors (scores 0-6)');
  });

  test('calculateScore() returns NPS = %promoters - %detractors', async () => {
    // 4 responses: 2 promoters, 1 passive, 1 detractor
    // NPS = (2/4)*100 - (1/4)*100 = 50 - 25 = 25
    await tracker.recordResponse({ userId: 'u1', score: 10 });
    await tracker.recordResponse({ userId: 'u2', score: 9 });
    await tracker.recordResponse({ userId: 'u3', score: 8 });
    await tracker.recordResponse({ userId: 'u4', score: 4 });

    const result = tracker.calculateScore();

    assert.ok(result, 'calculateScore must return result');
    assert.strictEqual(result.nps, 25, 'NPS must be 25 (50% promoters - 25% detractors)');
    assert.strictEqual(result.totalResponses, 4, 'totalResponses must be 4');
    assert.strictEqual(result.promoters, 2, 'promoters count must be 2');
    assert.strictEqual(result.passives, 1, 'passives count must be 1');
    assert.strictEqual(result.detractors, 1, 'detractors count must be 1');
  });

  test('getTrend() returns NPS change over time periods', async () => {
    // Record responses with different timestamps
    const now = Date.now();
    await tracker.recordResponse({ userId: 'u1', score: 10, timestamp: now - 86400000 * 7 }); // 7 days ago
    await tracker.recordResponse({ userId: 'u2', score: 9, timestamp: now - 86400000 * 6 });
    await tracker.recordResponse({ userId: 'u3', score: 5, timestamp: now - 86400000 * 1 }); // 1 day ago
    await tracker.recordResponse({ userId: 'u4', score: 4, timestamp: now });

    const trend = tracker.getTrend({ periodDays: 7 });

    assert.ok(trend, 'getTrend must return trend data');
    assert.ok(Array.isArray(trend.periods), 'trend must have periods array');
    assert.ok(trend.direction, 'trend must have direction (improving/declining/stable)');
  });
});
