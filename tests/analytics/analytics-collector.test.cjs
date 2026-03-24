/**
 * EZ Tools Tests - AnalyticsCollector Unit Tests
 *
 * Unit tests for analytics-collector.cjs covering event tracking,
 * session management, and data persistence behavior.
 *
 * These tests are RED (failing) until implementation ships.
 * Requirement: ANALYTICS-01
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const { createTempProject, cleanup } = require('../helpers.cjs');
const AnalyticsCollector = require('../../ez-agents/bin/lib/analytics-collector.cjs');

describe('AnalyticsCollector', () => {
  let tmpDir, collector;

  beforeEach(() => {
    tmpDir = createTempProject();
    collector = new AnalyticsCollector(tmpDir);
  });

  afterEach(() => cleanup(tmpDir));

  test('constructor does not throw', () => {
    assert.ok(collector, 'AnalyticsCollector instance must be created without throwing');
  });

  test('track() records event with timestamp and metadata', async () => {
    const event = {
      name: 'page_view',
      userId: 'user-123',
      properties: { page: '/home', referrer: 'google' }
    };

    await collector.track(event);

    const dataPath = path.join(tmpDir, '.planning', 'analytics.json');
    assert.ok(fs.existsSync(dataPath), 'analytics.json must exist after track()');

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    assert.ok(Array.isArray(data.events), 'analytics.json must have events array');
    assert.ok(data.events.length > 0, 'events must have at least one record');

    const recorded = data.events[0];
    assert.strictEqual(recorded.name, 'page_view', 'event name must match');
    assert.strictEqual(recorded.userId, 'user-123', 'userId must match');
    assert.ok(recorded.timestamp, 'timestamp must be present');
    assert.deepStrictEqual(recorded.properties, event.properties, 'properties must match');
  });

  test('startSession() creates session with unique ID', async () => {
    const sessionId = await collector.startSession({ userId: 'user-456' });

    assert.ok(sessionId, 'sessionId must be returned');
    assert.ok(typeof sessionId === 'string', 'sessionId must be a string');

    const dataPath = path.join(tmpDir, '.planning', 'analytics.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    assert.ok(Array.isArray(data.sessions), 'analytics.json must have sessions array');

    const session = data.sessions.find(s => s.id === sessionId);
    assert.ok(session, 'session must be recorded');
    assert.strictEqual(session.userId, 'user-456', 'session userId must match');
    assert.ok(session.startTime, 'session startTime must be present');
  });

  test('endSession() closes session with duration', async () => {
    const sessionId = await collector.startSession({ userId: 'user-789' });

    // Simulate some time passing
    await new Promise(resolve => setTimeout(resolve, 10));

    await collector.endSession(sessionId);

    const dataPath = path.join(tmpDir, '.planning', 'analytics.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    const session = data.sessions.find(s => s.id === sessionId);
    assert.ok(session, 'session must exist');
    assert.ok(session.endTime, 'session endTime must be present');
    assert.ok(session.duration, 'session duration must be calculated');
    assert.strictEqual(session.status, 'completed', 'session status must be completed');
  });

  test('getEvents() returns filtered events by name', async () => {
    await collector.track({ name: 'page_view', userId: 'user-1' });
    await collector.track({ name: 'click', userId: 'user-1' });
    await collector.track({ name: 'page_view', userId: 'user-2' });

    const pageViews = collector.getEvents({ name: 'page_view' });

    assert.ok(Array.isArray(pageViews), 'getEvents must return array');
    assert.strictEqual(pageViews.length, 2, 'must return only matching events');
    pageViews.forEach(ev => {
      assert.strictEqual(ev.name, 'page_view', 'all events must match filter');
    });
  });
});
