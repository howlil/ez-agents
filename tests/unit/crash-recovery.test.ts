/**
 * EZ Tools Tests - CrashRecovery Unit Tests
 *
 * Unit tests for crash-recovery.cjs covering lock file creation,
 * orphan detection, and lock release.
 *
 * These tests are RED (failing) until Plan 02 ships crash-recovery.cjs.
 */



import * as path from 'path';
import * as fs from 'fs';
import { createTempProject, cleanup } from '../helpers.ts';
import CrashRecovery from '../../bin/lib/crash-recovery.js';

describe('CrashRecovery', () => {
  let tmpDir, cr;

  beforeEach(() => {
    tmpDir = createTempProject();
    cr = new CrashRecovery(tmpDir);
  });

  afterEach(() => cleanup(tmpDir));

  test('constructor does not throw', () => {
    // If we got here, the constructor succeeded
    expect(cr).toBeTruthy() // 'CrashRecovery instance must be created without throwing';
  });

  test('acquire creates lock file with pid', () => {
    cr.acquire('test-op');
    const lockPath = path.join(tmpDir, '.planning', 'locks', 'test-op.lock.json');
    expect(fs.existsSync(lockPath)).toBeTruthy() // 'lock file must exist after acquire';
    const data = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    expect(data.pid).toBe(process.pid, 'lock file pid must equal process.pid');
    expect(data.operation).toBe('test-op', 'lock file operation must equal the operation name');
    expect(data.started).toBeTruthy() // 'started timestamp must be set';
  });

  test('isOrphan returns false for live process', () => {
    cr.acquire('test-op2');
    expect(cr.isOrphan('test-op2')).toBe(false, 'isOrphan must return false when process is alive');
  });

  test('release removes lock file', () => {
    cr.acquire('test-op3');
    cr.release('test-op3');
    const lockPath = path.join(tmpDir, '.planning', 'locks', 'test-op3.lock.json');
    expect(!fs.existsSync(lockPath)).toBeTruthy() // 'lock file must be removed after release';
  });

  test('lock file does not exist after release', () => {
    cr.acquire('test-op4');
    const lockPath = path.join(tmpDir, '.planning', 'locks', 'test-op4.lock.json');
    expect(fs.existsSync(lockPath)).toBeTruthy() // 'lock file must exist before release';
    cr.release('test-op4');
    expect(!fs.existsSync(lockPath)).toBeTruthy() // 'lock file must not exist after release';
  });
});
