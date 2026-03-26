import { fileURLToPath } from 'url';


import * as path from 'path';
const util = require('util');

const timeoutExecPath = path.join(__dirname, '..', 'ez-agents', 'bin', 'lib', 'timeout-exec.cjs');
const loggerPath = path.join(__dirname, '..', 'ez-agents', 'bin', 'lib', 'logger.cjs');
const Logger = require(loggerPath);

function loadTimeoutExecWithMocks(execFileAsyncMock, logSink) {
  const originalPromisify = util.promisify;
  const originalInfo = Logger.prototype.info;
  const originalError = Logger.prototype.error;

  delete require.cache[require.resolve(timeoutExecPath)];
  util.promisify = () => execFileAsyncMock;
  Logger.prototype.info = function (message, context) {
    logSink.info.push({ message, context });
  };
  Logger.prototype.error = function (message, context) {
    logSink.error.push({ message, context });
  };

  const timeoutExec = require(timeoutExecPath);

  return {
    timeoutExec,
    restore() {
      util.promisify = originalPromisify;
      Logger.prototype.info = originalInfo;
      Logger.prototype.error = originalError;
      delete require.cache[require.resolve(timeoutExecPath)];
    },
  };
}

describe('timeout exec graceful behavior', () => {
  test('returns configured fallback (including empty string) and logs activation on process failure', async () => {
    const logs = { info: [], error: [] };
    const { timeoutExec, restore } = loadTimeoutExecWithMocks(async () => {
      throw new Error('simulated process failure');
    }, logs);

    try {
      const result = await timeoutExec.execWithTimeout('node', ['-e', 'throw new Error()'], { fallback: '' });
      expect(result).toBe('');
      expect(logs.info.some(entry => 'message' in entry && (entry as { message: string }).message.includes('fallback'))).toBeTruthy() // `expected fallback activation log, got: ${JSON.stringify(logs.info}`
      );
    } finally {
      restore();
    }
  });

  test('uses 5000ms default timeout and applies fallback on failures', async () => {
    let observedTimeout = null;
    const logs = { info: [], error: [] };
    const { timeoutExec, restore } = loadTimeoutExecWithMocks(async (_cmd, _args, options) => {
      observedTimeout = options.timeout;
      throw new Error('simulated failure');
    }, logs);

    try {
      const result = await timeoutExec.execWithTimeout('node', ['-v'], { fallback: 'safe-default' });
      expect(result).toBe('safe-default');
      assert.strictEqual(observedTimeout, 5000);
    } finally {
      restore();
    }
  });

  test('rejects on timeout when no fallback is provided', async () => {
    const logs = { info: [], error: [] };
    const { timeoutExec, restore } = loadTimeoutExecWithMocks(async () => new Promise(() => {}), logs);

    try {
      // Test that execWithTimeout throws when no fallback is provided
      let caughtError: Error | null = null;
      try {
        await timeoutExec.execWithTimeout('node', ['hang-forever'], { timeout: 20 });
      } catch (err) {
        caughtError = err as Error;
      }
      
      expect(caughtError).toBeInstanceOf(Error);
      expect(caughtError!.message).toMatch(/timed out/i);
    } finally {
      restore();
    }
  });
});
