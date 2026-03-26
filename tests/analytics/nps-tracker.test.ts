/**
 * EZ Tools Tests - NPSTracker Unit Tests
 *
 * Unit tests for nps-tracker.cjs covering NPS score calculation,
 * response categorization, and trend analysis.
 *
 * These tests are RED (failing) until implementation ships.
 * Requirement: ANALYTICS-02
 */



import * as path from 'path';
import * as fs from 'fs';

import { NpsTracker } from '../../bin/lib/analytics/nps-tracker.js';

describe('NPSTracker', () => {
  let tmpDir, tracker;

  beforeEach(() => {
    tmpDir = createTempProject();
    tracker = new NpsTracker(tmpDir);
  });

  afterEach(() => cleanup(tmpDir));

  test('constructor does not throw', () => {
    expect(tracker).toBeTruthy() // 'NPSTracker instance must be created without throwing';
  });

  test('recordResponse() categorizes promoters (9-10), passives (7-8), detractors (0-6)', async () => {
    await tracker.recordResponse({ userId: 'u1', score: 10, feedback: 'Love it!' });
    await tracker.recordResponse({ userId: 'u2', score: 9, feedback: 'Great!' });
    await tracker.recordResponse({ userId: 'u3', score: 7, feedback: 'Good' });
    await tracker.recordResponse({ userId: 'u4', score: 5, feedback: 'Okay' });
    await tracker.recordResponse({ userId: 'u5', score: 3, feedback: 'Not great' });

    const dataPath = path.join(tmpDir, '.planning', 'nps.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    expect(Array.isArray(data.responses)).toBeTruthy() // 'nps.json must have responses array';
    expect(data.responses.length).toBe(5, 'must have 5 responses');

    const promoters = data.responses.filter(r => r.category === 'promoter');
    const passives = data.responses.filter(r => r.category === 'passive');
    const detractors = data.responses.filter(r => r.category === 'detractor');

    expect(promoters.length).toBe(2, 'must have 2 promoters (scores 9-10)');
    expect(passives.length).toBe(1, 'must have 1 passive (score 7-8)');
    expect(detractors.length).toBe(2, 'must have 2 detractors (scores 0-6)');
  });

  test('calculateScore() returns NPS = %promoters - %detractors', async () => {
    // 4 responses: 2 promoters, 1 passive, 1 detractor
    // NPS = (2/4)*100 - (1/4)*100 = 50 - 25 = 25
    await tracker.recordResponse({ userId: 'u1', score: 10 });
    await tracker.recordResponse({ userId: 'u2', score: 9 });
    await tracker.recordResponse({ userId: 'u3', score: 8 });
    await tracker.recordResponse({ userId: 'u4', score: 4 });

    const result = tracker.calculateScore();

    expect(result).toBeTruthy() // 'calculateScore must return result';
    expect(result?.nps).toBe(25, 'NPS must be 25 (50% promoters - 25% detractors)');
    expect(result?.totalResponses).toBe(4, 'totalResponses must be 4');
    expect(result?.promoters).toBe(2, 'promoters count must be 2');
    expect(result?.passives).toBe(1, 'passives count must be 1');
    expect(result?.detractors).toBe(1, 'detractors count must be 1');
  });

  test('getTrend() returns NPS change over time periods', async () => {
    // Record responses with different timestamps
    const now = Date.now();
    await tracker.recordResponse({ userId: 'u1', score: 10, timestamp: now - 86400000 * 7 }); // 7 days ago
    await tracker.recordResponse({ userId: 'u2', score: 9, timestamp: now - 86400000 * 6 });
    await tracker.recordResponse({ userId: 'u3', score: 5, timestamp: now - 86400000 * 1 }); // 1 day ago
    await tracker.recordResponse({ userId: 'u4', score: 4, timestamp: now });

    const trend = tracker.getTrend({ periodDays: 7 });

    expect(trend).toBeTruthy() // 'getTrend must return trend data';
    expect(Array.isArray(trend.periods)).toBeTruthy() // 'trend must have periods array';
    expect(trend.direction).toBeTruthy() // 'trend must have direction (improving/declining/stable');
  });
});
