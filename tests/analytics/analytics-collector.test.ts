/**
 * EZ Tools Tests - AnalyticsCollector Unit Tests
 *
 * Unit tests for analytics-collector.cjs covering event tracking,
 * session management, and data persistence behavior.
 *
 * These tests are RED (failing) until implementation ships.
 * Requirement: ANALYTICS-01
 */



import * as path from 'path';
import * as fs from 'fs';

import { AnalyticsCollector } from '../../bin/lib/analytics/analytics-collector.js';

describe('AnalyticsCollector', () => {
  let tmpDir, collector;

  beforeEach(() => {
    tmpDir = createTempProject();
    collector = new AnalyticsCollector(tmpDir);
  });

  afterEach(() => cleanup(tmpDir));

  test('constructor does not throw', () => {
    expect(collector).toBeTruthy()
  });

  test('track() records event with timestamp and metadata', async () => {
    const event = {
      name: 'page_view',
      userId: 'user-123',
      properties: { page: '/home', referrer: 'google' }
    };

    await collector.track(event);

    const dataPath = path.join(tmpDir, '.planning', 'analytics.json');
    expect(fs.existsSync(dataPath)).toBeTruthy()

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    expect(Array.isArray(data.events)).toBeTruthy()
    expect(data.events.length > 0).toBeTruthy()

    const recorded = data.events[0];
    expect(recorded.name).toBe('page_view');
    expect(recorded.userId).toBe('user-123');
    expect(recorded.timestamp).toBeTruthy()
    assert.deepStrictEqual(recorded.properties, event.properties, 'properties must match');
  });

  test('startSession() creates session with unique ID', async () => {
    const sessionId = await collector.startSession({ userId: 'user-456' });

    expect(sessionId).toBeTruthy()
    expect(typeof sessionId === 'string').toBeTruthy()

    const dataPath = path.join(tmpDir, '.planning', 'analytics.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    expect(Array.isArray(data.sessions)).toBeTruthy()

    const session = data.sessions.find(s => s.id === sessionId);
    expect(session).toBeTruthy()
    expect(session.userId).toBe('user-456');
    expect(session.startTime).toBeTruthy()
  });

  test('endSession() closes session with duration', async () => {
    const sessionId = await collector.startSession({ userId: 'user-789' });

    // Simulate some time passing
    await new Promise(resolve => setTimeout(resolve, 10));

    await collector.endSession(sessionId);

    const dataPath = path.join(tmpDir, '.planning', 'analytics.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    const session = data.sessions.find(s => s.id === sessionId);
    expect(session).toBeTruthy();
    expect(session.endTime).toBeTruthy();
    expect(session.duration).toBeGreaterThanOrEqual(0);
  });

  test('getEvents() returns filtered events by name', async () => {
    await collector.track({ name: 'page_view', userId: 'user-1' });
    await collector.track({ name: 'click', userId: 'user-1' });
    await collector.track({ name: 'page_view', userId: 'user-2' });

    const pageViews = collector.getEvents({ name: 'page_view' });

    expect(Array.isArray(pageViews)).toBeTruthy()
    expect(pageViews.length).toBe(2);
    pageViews.forEach(ev => {
      expect(ev.name).toBe('page_view');
    });
  });
});
