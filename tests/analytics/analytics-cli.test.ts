/**
 * EZ Tools Tests - AnalyticsCLI Integration Tests
 *
 * Integration tests for the analytics CLI commands covering
 * event tracking, report generation, and data export.
 *
 * These tests are RED (failing) until implementation ships.
 * Requirement: ANALYTICS-06
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
import assert from 'node:assert';
import * as path from 'path';
import * as fs from 'fs';


describe('ez-agents analytics', () => {
  let tmpDir;

  beforeEach(() => { tmpDir = createTempProject(); });
  afterEach(() => cleanup(tmpDir));

  test('analytics track --event records event with properties', () => {
    const result = runEzTools(
      ['analytics', 'track', '--event', 'page_view', '--user', 'user-123', '--props', '{"page":"/home"}'],
      tmpDir
    );
    assert.ok(result.success, 'analytics track must exit 0: ' + result.error);
    assert.ok(result.output.includes('Event recorded'), 'output must confirm event recorded');

    const dataPath = path.join(tmpDir, '.planning', 'analytics.json');
    assert.ok(fs.existsSync(dataPath), 'analytics.json must exist after track');
  });

  test('analytics session --start creates new session', () => {
    const result = runEzTools(
      ['analytics', 'session', '--start', '--user', 'user-456'],
      tmpDir
    );
    assert.ok(result.success, 'analytics session --start must exit 0: ' + result.error);

    const sessionId = result.output.match(/Session ID: (\S+)/);
    assert.ok(sessionId, 'output must contain session ID');

    const dataPath = path.join(tmpDir, '.planning', 'analytics.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    assert.ok(Array.isArray(data.sessions), 'must have sessions array');
  });

  test('analytics session --end closes session with duration', () => {
    // Start session
    const startResult = runEzTools(
      ['analytics', 'session', '--start', '--user', 'user-789'],
      tmpDir
    );
    assert.ok(startResult.success, 'session start must succeed');
    const sessionId = startResult.output.match(/Session ID: (\S+)/)[1];

    // End session
    const endResult = runEzTools(
      ['analytics', 'session', '--end', '--id', sessionId],
      tmpDir
    );
    assert.ok(endResult.success, 'analytics session --end must exit 0: ' + endResult.error);
    assert.ok(endResult.output.includes('Session ended'), 'output must confirm session ended');
  });

  test('analytics report --type generates report in specified format', () => {
    const result = runEzTools(
      ['analytics', 'report', '--type', 'weekly', '--format', 'json'],
      tmpDir
    );
    assert.ok(result.success, 'analytics report must exit 0: ' + result.error);

    // Output should be valid JSON or contain report path
    try {
      JSON.parse(result.output);
    } catch {
      // If not JSON directly, should contain file path
      assert.ok(result.output.includes('Report generated') || result.output.includes('.json'),
        'output must contain report data or file path');
    }
  });

  test('analytics export --format csv exports data to file', () => {
    const result = runEzTools(
      ['analytics', 'export', '--format', 'csv', '--output', 'analytics-export'],
      tmpDir
    );
    assert.ok(result.success, 'analytics export must exit 0: ' + result.error);

    // Should create CSV file
    const csvPath = path.join(tmpDir, 'analytics-export.csv');
    assert.ok(fs.existsSync(csvPath) || result.output.includes('.csv'),
      'must create CSV export file or return path');
  });
});
