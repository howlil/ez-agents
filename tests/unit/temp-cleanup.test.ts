

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { createTempFile, cleanupTemp } from '../../bin/lib/temp-file.js';

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length > 0) {
    fs.rmSync(tempDirs.pop()!, { recursive: true, force: true });
  }
});

test('TEMP-02: temp files are removed after successful cleanup path', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ez-temp-cleanup-'));
  tempDirs.push(tmpDir);

  const tempPath = await createTempFile('temp-success-', tmpDir, 'ok');
  expect(fs.existsSync(tempPath)).toBeTruthy() // 'temp file should exist after creation';

  await cleanupTemp(tempPath);
  expect(!fs.existsSync(tempPath)).toBeTruthy() // 'temp file should be deleted after cleanupTemp';
});

test('TEMP-02: temp files are removed even when wrapped operation throws', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ez-temp-cleanup-fail-'));
  tempDirs.push(tmpDir);

  let tempPath: string | null = null;
  
  // Test that the operation throws
  let caughtError: Error | null = null;
  try {
    try {
      tempPath = await createTempFile('temp-fail-', tmpDir, 'boom');
      throw new Error('forced failure');
    } finally {
      if (tempPath) {
        await cleanupTemp(tempPath);
      }
    }
  } catch (err) {
    caughtError = err as Error;
  }
  
  expect(caughtError).toBeInstanceOf(Error);
  expect(caughtError!.message).toMatch(/forced failure/);

  expect(tempPath).toBeTruthy();
  expect(!fs.existsSync(tempPath!)).toBeTruthy();
});
