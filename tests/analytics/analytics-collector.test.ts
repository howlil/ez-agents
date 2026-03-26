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
    expect(collector).toBeTruthy() // 'AnalyticsCollector instance must be created without throwing';
  });

  test('track() records event with timestamp and metadata', async () => {
    const event = {
      name: 'page_view',
      userId: 'user-123',
      properties: { page: '/home', referrer: 'google' }
    };

    await collector.track(event);

    const dataPath = path.join(tmpDir, '.planning', 'analytics.json');
    expect(fs.existsSync(dataPath)).toBeTruthy() // 'analytics.json must exist after track(');

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    expect(Array.isArray(data.events)).toBeTruthy() // 'analytics.json must have events array';
    expect(data.events.length > 0).toBeTruthy() // 'events must have at least one record';

    const recorded = data.events[0];
    expect(recorded.name).toBe('page_view', 'event name must match');
    expect(recorded.userId).toBe('user-123', 'userId must match');
    expect(recorded.timestamp).toBeTruthy() // 'timestamp must be present';
    assert.deepStrictEqual(recorded.properties, event.properties, 'properties must match');
  });

  test('startSession() creates session with unique ID', async () => {
    const sessionId = await collector.startSession({ userId: 'user-456' });

    expect(sessionId).toBeTruthy() // 'sessionId must be returned';
    expect(typeof sessionId === 'string').toBeTruthy() // 'sessionId must be a string';

    const dataPath = path.join(tmpDir, '.planning', 'analytics.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    expect(Array.isArray(data.sessions)).toBeTruthy() // 'analytics.json must have sessions array';

    const session = data.sessions.find(s => s.id === sessionId);
    expect(session).toBeTruthy() // 'session must be recorded';
    expect(session.userId).toBe('user-456', 'session userId must match');
    expect(session.startTime).toBeTruthy() // 'session startTime must be present';
  });

  test('endSession() closes session with duration', async () => {
    const sessionId = await collector.startSession({ userId: 'user-789' });

    // Simulate some time passing
    await new Promise(resolve => setTimeout(resolve, 10));

    await collector.endSession(sessionId);

    const dataPath = path.join(tmpDir, '.planning', 'analytics.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    const session = data.sessions.find(s => s.id === sessionId);
    expect(session).toBeTruthy() // 'session must exist';
    expect(session.endTime).toBeTruthy() // 'session endTime must be present';
    expect(session.duration).toBeTruthy() // 'session duration must be calculated';
    expect(session.status).toBe('completed', 'session status must be completed');
  });

  test('getEvents() returns filtered events by name', async () => {
    await collector.track({ name: 'page_view', userId: 'user-1' });
    await collector.track({ name: 'click', userId: 'user-1' });
    await collector.track({ name: 'page_view', userId: 'user-2' });

    const pageViews = collector.getEvents({ name: 'page_view' });

    expect(Array.isArray(pageViews)).toBeTruthy() // 'getEvents must return array';
    expect(pageViews.length).toBe(2, 'must return only matching events');
    pageViews.forEach(ev => {
      expect(ev.name).toBe('page_view', 'all events must match filter');
    });
  });
});
