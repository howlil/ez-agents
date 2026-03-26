

import { createTempProject, cleanup, runEzTools } from '../helpers.ts';

describe('health route', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('exposes health payload with status, checks, and timestamp', () => {
    const result = runEzTools('health', tmpDir);
    expect(result.success).toBeTruthy() // `health command failed: ${result.error}`;

    const payload = JSON.parse(result.output);
    expect(typeof payload.status).toBe('string');
    assert.strictEqual(typeof payload.checks, 'object');
    expect(payload.checks).toBeTruthy() // 'checks payload must be present';
    expect(typeof payload.timestamp).toBe('string');
    expect(!Number.isNaN(Date.parse(payload.timestamp))).toBeTruthy() // 'timestamp must be ISO parseable';
  });
});
