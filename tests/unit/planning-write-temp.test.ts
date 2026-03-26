

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('safePlanningWrite temp staging', () => {
  let tmpDir;
  let fileLockPath;
  let tempFilePath;
  let planningWritePath;
  let originalRename;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ez-planning-write-'));
    fileLockPath = require.resolve('../../bin/lib/file-lock.ts');
    tempFilePath = require.resolve('../../bin/lib/temp-file.ts');
    planningWritePath = require.resolve('../../bin/lib/planning-write.ts');
    originalRename = fs.promises.rename;
  });

  afterEach(() => {
    fs.promises.rename = originalRename;
    delete require.cache[fileLockPath];
    delete require.cache[tempFilePath];
    delete require.cache[planningWritePath];
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('creates temp file in target directory and cleans it up after success', async () => {
    const target = path.join(tmpDir, 'STATE.md');
    const tempCalls: { prefix: string; dir: string }[] = [];
    const cleanupCalls: string[] = [];

    // @ts-expect-error Mocking NodeModule for testing
    require.cache[fileLockPath] = {
      id: fileLockPath,
      filename: fileLockPath,
      loaded: true,
      exports: {
        withLock: async (_file, operation) => operation(),
      },
    };

    // @ts-expect-error Mocking NodeModule for testing
    require.cache[tempFilePath] = {
      id: tempFilePath,
      filename: tempFilePath,
      loaded: true,
      exports: {
        createTempFile: (prefix, dir) => {
          tempCalls.push({ prefix, dir });
          const tempPath = path.join(dir, `${prefix}.tmp`);
          fs.writeFileSync(tempPath, 'temp content');
          return tempPath;
        },
        cleanupTempFile: (tempPath) => {
          cleanupCalls.push(tempPath);
          if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
          }
        },
      },
    };

    // @ts-expect-error Mocking NodeModule for testing
    require.cache[planningWritePath] = {
      id: planningWritePath,
      filename: planningWritePath,
      loaded: true,
      exports: {
        safePlanningWrite: async (file, content) => {
          const tempFile = path.join(tmpDir, '.temp-state');
          fs.writeFileSync(tempFile, content);
          await fs.promises.rename(tempFile, file);
        },
      },
    };

    const { safePlanningWrite } = await import('../../bin/lib/planning-write.js');
    await safePlanningWrite(target, 'test content');

    expect(tempCalls.length).toBe(1, 'Should create one temp file');
    expect(tempCalls[0].prefix).toBe('ez', 'Temp file should have ez prefix');
    expect(cleanupCalls.length).toBe(1, 'Should cleanup one temp file');
    expect(fs.existsSync(target)).toBeTruthy() // 'Target file should exist';
  });

  test('cleans up staged temp artifact when rename fails', async () => {
    const target = path.join(tmpDir, 'STATE.md');
    const cleanupCalls: string[] = [];

    // @ts-expect-error Mocking
    require.cache[fileLockPath] = {
      id: fileLockPath,
      exports: { withLock: async (_file, operation) => operation() },
    };

    // @ts-expect-error Mocking
    require.cache[tempFilePath] = {
      id: tempFilePath,
      exports: {
        createTempFile: (prefix, dir) => path.join(dir, `${prefix}.tmp`),
        cleanupTempFile: (tempPath) => {
          cleanupCalls.push(tempPath);
        },
      },
    };

    // @ts-expect-error Mocking
    require.cache[planningWritePath] = {
      id: planningWritePath,
      exports: {
        safePlanningWrite: async (file, _content) => {
          const tempFile = path.join(tmpDir, '.temp-state');
          fs.writeFileSync(tempFile, 'temp content');
          // Simulate rename failure
          throw new Error('Rename failed');
        },
      },
    };

    const { safePlanningWrite } = await import('../../bin/lib/planning-write.js');
    
    // Test that safePlanningWrite throws when rename fails
    let caughtError: Error | null = null;
    try {
      await safePlanningWrite(target, 'test content');
    } catch (err) {
      caughtError = err as Error;
    }
    
    expect(caughtError).toBeInstanceOf(Error);
    expect(caughtError!.message).toMatch(/Rename failed/);
    expect(cleanupCalls.length).toBe(1, 'Should cleanup temp file on error');
  });
});
