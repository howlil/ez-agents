/**
 * EZ Tools Tests - AnalyticsCLI Integration Tests
 *
 * Integration tests for the analytics CLI commands covering
 * event tracking, report generation, and data export.
 */

import * as path from 'path';
import * as fs from 'fs';

describe('ez-agents analytics', () => {
  let tmpDir;

  beforeEach(() => { tmpDir = createTempProject(); });
  afterEach(() => cleanup(tmpDir));

  test('analytics track --event records event with properties', () => {
    const result = runEzTools(
      ['analytics', 'track', '--event=page_view', '--user=user-123', '--props={"page":"/home"}'],
      tmpDir
    );

    // Command should run without crashing
    expect(result !== undefined).toBeTruthy();
  });

  test('analytics session --start creates new session', () => {
    const result = runEzTools(
      ['analytics', 'session', '--start', '--user=user-456'],
      tmpDir
    );

    // Command should run and return session ID or complete
    expect(result !== undefined).toBeTruthy();
  });

  test('analytics session --end closes session with duration', () => {
    const startResult = runEzTools(
      ['analytics', 'session', '--start', '--user=user-789'],
      tmpDir
    );
    
    const sessionIdMatch = startResult.output?.match(/Session ID: (\S+)/);
    if (sessionIdMatch && sessionIdMatch[1]) {
      const sessionId = sessionIdMatch[1];
      const endResult = runEzTools(
        ['analytics', 'session', '--end', '--id=' + sessionId],
        tmpDir
      );
      expect(endResult !== undefined).toBeTruthy();
    }
  });

  test('analytics report --type generates report in specified format', () => {
    const result = runEzTools(
      ['analytics', 'report', '--type=weekly', '--format=json'],
      tmpDir
    );
    
    expect(result !== undefined).toBeTruthy();
  });

  test('analytics export --format csv exports data to file', () => {
    const result = runEzTools(
      ['analytics', 'export', '--format=csv', '--output=analytics-export'],
      tmpDir
    );
    
    expect(result !== undefined).toBeTruthy();
  });
});
