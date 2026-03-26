

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { withLock } from '../../bin/lib/file-lock.js';

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length > 0) {
    fs.rmSync(tempDirs.pop()!, { recursive: true, force: true });
  }
});

test('LOCK-02: second lock attempt times out with deterministic File locked error shape', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ez-lock-timeout-'));
  tempDirs.push(tmpDir);
  const lockTarget = path.join(tmpDir, 'target.md');
  fs.writeFileSync(lockTarget, 'seed', 'utf-8');

  const holdLock = withLock(lockTarget, async () => {
    await new Promise((resolve) => setTimeout(resolve, 150));
  }, { timeout: 5000 });

  await new Promise((resolve) => setTimeout(resolve, 20));

  // Test that second lock attempt times out
  let caughtError: Error | null = null;
  try {
    await withLock(lockTarget, async () => 'unreachable', { timeout: 30, retries: { retries: 0, factor: 1, minTimeout: 0, maxTimeout: 0, randomize: false } });
  } catch (err) {
    caughtError = err as Error;
  }
  
  expect(caughtError).toBeInstanceOf(Error);
  expect(caughtError!.message).toMatch(/^File locked:/);
  expect(caughtError!.message).toMatch(/\(waited \d+ms\)/);

  await holdLock;
});
