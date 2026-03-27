/**
 * FileLockManager Tests
 *
 * Tests for file locking with concurrent writes and deadlock prevention.
 */

import { describe, it, beforeEach, afterEach } from 'vitest';
import {
  FileLockManager,
  LockState,
  getFileLockManager,
  resetFileLockManager,
  acquireLock,
  releaseLock,
  withLock
} from '../../bin/lib/file/file-lock-manager.js';
import { expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('FileLockManager', () => {
  let lockManager: FileLockManager;
  const testFile = path.join(process.cwd(), 'test-file.txt');
  const testOwnerId = 'test-agent-1';

  beforeEach(() => {
    // Create fresh lock manager for each test
    resetFileLockManager();
    lockManager = new FileLockManager({
      defaultTimeout: 5000,
      defaultStaleTime: 10000,
      defaultHeartbeatInterval: 2000,
      deadlockDetection: true,
      enableStats: true,
      lockDirectory: '.planning/test-locks'
    });

    // Create test file if it doesn't exist
    if (!fs.existsSync(testFile)) {
      fs.writeFileSync(testFile, 'test content', 'utf-8');
    }
  });

  afterEach(() => {
    // Clean up locks
    lockManager.clearAllLocks();

    // Remove test file
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
  });

  describe('Basic Lock Operations', () => {
    it('should acquire and release a lock', async () => {
      // Acquire lock
      const acquired = await lockManager.acquire(testFile, testOwnerId);
      expect(acquired).toBe(true);
      expect(lockManager.isLocked(testFile)).toBe(true);

      // Release lock
      const released = await lockManager.release(testFile, testOwnerId);
      expect(released).toBe(true);
      expect(lockManager.isLocked(testFile)).toBe(false);
    });

    it('should allow same owner to re-acquire lock', async () => {
      // First acquire
      expect(await lockManager.acquire(testFile, testOwnerId)).toBe(true);

      // Re-acquire (should succeed and update heartbeat)
      expect(await lockManager.acquire(testFile, testOwnerId)).toBe(true);

      // Release
      await lockManager.release(testFile, testOwnerId);
      expect(lockManager.isLocked(testFile)).toBe(false);
    });

    it('should prevent different owner from acquiring locked file', async () => {
      // Owner 1 acquires lock
      expect(await lockManager.acquire(testFile, testOwnerId)).toBe(true);

      // Owner 2 tries to acquire (should fail without waiting)
      const owner2Acquired = await lockManager.acquire(testFile, 'test-agent-2', {
        waitForLock: false
      });
      expect(owner2Acquired).toBe(false);

      // Owner 1 still holds lock
      expect(lockManager.isLocked(testFile)).toBe(true);

      // Release
      await lockManager.release(testFile, testOwnerId);
    });

    it('should queue lock requests when waitForLock is true', async () => {
      const results: string[] = [];

      // Owner 1 acquires lock
      expect(await lockManager.acquire(testFile, testOwnerId)).toBe(true);

      // Owner 2 waits for lock
      const owner2Promise = lockManager
        .acquire(testFile, 'test-agent-2', { waitForLock: true, timeout: 3000 })
        .then(() => {
          results.push('owner-2-acquired');
          return lockManager.release(testFile, 'test-agent-2');
        });

      // Give some time for queue processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Owner 1 releases
      await lockManager.release(testFile, testOwnerId);
      results.push('owner-1-released');

      // Wait for owner 2 to acquire
      await owner2Promise;

      expect(results).toContain('owner-1-released');
      expect(results).toContain('owner-2-acquired');
    });
  });

  describe('withLock Helper', () => {
    it('should acquire lock, execute function, and release', async () => {
      let executed = false;

      await lockManager.withLock(testFile, testOwnerId, async () => {
        expect(lockManager.isLocked(testFile)).toBe(true);
        executed = true;
      });

      expect(executed).toBe(true);
      expect(lockManager.isLocked(testFile)).toBe(false);
    });

    it('should release lock even if function throws', async () => {
      try {
        await lockManager.withLock(testFile, testOwnerId, async () => {
          throw new Error('Test error');
        });
      } catch (err) {
        // Expected
      }

      expect(lockManager.isLocked(testFile)).toBe(false);
    });

    it('should return function result', async () => {
      const result = await lockManager.withLock(
        testFile,
        testOwnerId,
        async () => {
          return 'test-result';
        }
      );

      expect(result).toBe('test-result');
    });
  });

  describe('Lock Statistics', () => {
    it('should track lock acquisition and release stats', async () => {
      // Acquire and release multiple times
      for (let i = 0; i < 3; i++) {
        await lockManager.acquire(testFile, `${testOwnerId}-${i}`);
        await new Promise(resolve => setTimeout(resolve, 10));
        await lockManager.release(testFile, `${testOwnerId}-${i}`);
      }

      const stats = lockManager.getStats();

      expect(stats.totalAcquired).toBe(3);
      expect(stats.totalReleased).toBe(3);
      expect(stats.activeLocks).toBe(0);
      expect(stats.avgHoldTime).toBeGreaterThan(0);
    });

    it('should track wait time stats', async () => {
      // Owner 1 holds lock
      await lockManager.acquire(testFile, testOwnerId);

      // Owner 2 waits
      const owner2Promise = lockManager.acquire(testFile, 'test-agent-2', {
        waitForLock: true,
        timeout: 3000
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      // Owner 1 releases
      await lockManager.release(testFile, testOwnerId);
      await owner2Promise;

      const stats = lockManager.getStats();

      expect(stats.waitingRequests).toBe(0);
      expect(stats.totalAcquired).toBe(2);
    });
  });

  describe('Lock Timeout', () => {
    it('should timeout when waiting for lock', async () => {
      // Owner 1 holds lock
      await lockManager.acquire(testFile, testOwnerId);

      // Owner 2 waits with short timeout
      const timeoutPromise = lockManager.acquire(testFile, 'test-agent-2', {
        waitForLock: true,
        timeout: 500
      });

      // Don't release - let it timeout
      await expect(timeoutPromise).rejects.toThrow('Lock timeout after 500ms');

      const stats = lockManager.getStats();
      expect(stats.totalTimeouts).toBe(1);
    });
  });

  describe('Stale Lock Detection', () => {
    it.skip('should detect and reclaim stale lock', async () => {
      // Owner 1 acquires with very short stale time
      const shortStaleManager = new FileLockManager({
        defaultTimeout: 5000,
        defaultStaleTime: 100, // 100ms stale time
        defaultHeartbeatInterval: 50,
        deadlockDetection: true,
        enableStats: true,
        lockDirectory: '.planning/test-locks'
      });

      await shortStaleManager.acquire(testFile, testOwnerId);

      // Wait for lock to become stale (no heartbeat)
      await new Promise(resolve => setTimeout(resolve, 200));

      // Owner 2 should be able to reclaim stale lock
      const reclaimed = await shortStaleManager.acquire(testFile, 'test-agent-2');
      expect(reclaimed).toBe(true);

      // Original lock should be released
      const lockInfo = shortStaleManager.getLockInfo(testFile);
      expect(lockInfo?.ownerId).toBe('test-agent-2');

      shortStaleManager.clearAllLocks();
    });
  });

  describe('Deadlock Detection', () => {
    it.skip('should detect circular wait deadlock', async () => {
      const file1 = path.join(process.cwd(), 'test-file-1.txt');
      const file2 = path.join(process.cwd(), 'test-file-2.txt');

      // Create test files
      fs.writeFileSync(file1, 'test 1', 'utf-8');
      fs.writeFileSync(file2, 'test 2', 'utf-8');

      try {
        // Owner 1 holds file1
        await lockManager.acquire(file1, 'owner-1');

        // Owner 2 holds file2
        await lockManager.acquire(file2, 'owner-2');

        // Owner 1 tries to acquire file2 (will wait)
        const owner1WaitForFile2 = lockManager.acquire(file2, 'owner-1', {
          waitForLock: true,
          timeout: 2000
        });

        await new Promise(resolve => setTimeout(resolve, 100));

        // Owner 2 tries to acquire file1 (deadlock!)
        const owner2WaitForFile1 = lockManager.acquire(file1, 'owner-2', {
          waitForLock: true,
          timeout: 2000
        });

        // One of them should timeout or be rejected due to deadlock
        const results = await Promise.allSettled([
          owner1WaitForFile2,
          owner2WaitForFile1
        ]);

        // At least one should be rejected
        const rejected = results.filter(r => r.status === 'rejected');
        expect(rejected.length).toBeGreaterThan(0);

        const stats = lockManager.getStats();
        expect(stats.totalDeadlocks).toBeGreaterThan(0);
      } finally {
        // Cleanup
        if (fs.existsSync(file1)) fs.unlinkSync(file1);
        if (fs.existsSync(file2)) fs.unlinkSync(file2);
      }
    });
  });

  describe('Lock Queue Priority', () => {
    it('should process queue by priority then request time', async () => {
      const results: string[] = [];

      // Owner 1 holds lock
      await lockManager.acquire(testFile, testOwnerId);

      // Low priority request first
      const lowPriorityPromise = lockManager
        .acquire(testFile, 'low-priority', {
          waitForLock: true,
          priority: 1,
          timeout: 3000
        })
        .then(() => {
          results.push('low-priority');
          return lockManager.release(testFile, 'low-priority');
        });

      await new Promise(resolve => setTimeout(resolve, 50));

      // High priority request second
      const highPriorityPromise = lockManager
        .acquire(testFile, 'high-priority', {
          waitForLock: true,
          priority: 10,
          timeout: 3000
        })
        .then(() => {
          results.push('high-priority');
          return lockManager.release(testFile, 'high-priority');
        });

      await new Promise(resolve => setTimeout(resolve, 50));

      // Release lock - high priority should go first
      await lockManager.release(testFile, testOwnerId);

      // Wait for both to complete
      await Promise.all([highPriorityPromise, lowPriorityPromise]);

      // High priority should acquire first despite requesting later
      expect(results[0]).toBe('high-priority');
      expect(results[1]).toBe('low-priority');
    });
  });

  describe('Global Lock Manager', () => {
    it('should provide singleton instance', () => {
      const manager1 = getFileLockManager();
      const manager2 = getFileLockManager();

      expect(manager1).toBe(manager2);
    });

    it('should allow custom config on first call', () => {
      resetFileLockManager();

      const customManager = getFileLockManager({
        defaultTimeout: 10000,
        lockDirectory: '.planning/custom-locks'
      });

      expect(customManager).toBe(getFileLockManager());
    });
  });

  describe('Convenience Functions', () => {
    beforeEach(() => {
      resetFileLockManager();
    });

    it('should provide acquireLock function', async () => {
      const acquired = await acquireLock(testFile, testOwnerId);
      expect(acquired).toBe(true);
      expect(getFileLockManager().isLocked(testFile)).toBe(true);
    });

    it('should provide releaseLock function', async () => {
      await acquireLock(testFile, testOwnerId);
      const released = await releaseLock(testFile, testOwnerId);
      expect(released).toBe(true);
    });

    it('should provide withLock function', async () => {
      let executed = false;
      await withLock(testFile, testOwnerId, async () => {
        executed = true;
      });
      expect(executed).toBe(true);
    });
  });

  describe('Lock Metadata', () => {
    it('should provide lock information', async () => {
      await lockManager.acquire(testFile, testOwnerId);

      const lockInfo = lockManager.getLockInfo(testFile);

      expect(lockInfo).not.toBeNull();
      expect(lockInfo?.ownerId).toBe(testOwnerId);
      expect(lockInfo?.state).toBe(LockState.LOCKED);
      expect(lockInfo?.filePath).toBe(path.resolve(testFile));
      expect(lockInfo?.acquiredAt).toBeLessThanOrEqual(Date.now());
    });

    it('should return null for unlocked file', () => {
      const lockInfo = lockManager.getLockInfo(testFile);
      expect(lockInfo).toBeNull();
    });
  });

  describe('Force Release', () => {
    it('should force release a lock', async () => {
      await lockManager.acquire(testFile, testOwnerId);
      expect(lockManager.isLocked(testFile)).toBe(true);

      const released = await lockManager.forceRelease(testFile);
      expect(released).toBe(true);
      expect(lockManager.isLocked(testFile)).toBe(false);
    });

    it('should return false for non-existent lock', async () => {
      const released = await lockManager.forceRelease(testFile);
      expect(released).toBe(false);
    });
  });

  describe('Queue Length', () => {
    it('should report queue length', async () => {
      // Owner 1 holds lock
      await lockManager.acquire(testFile, testOwnerId);

      // Add 3 waiters
      const promises = [];
      for (let i = 0; i < 3; i++) {
        promises.push(
          lockManager.acquire(testFile, `waiter-${i}`, {
            waitForLock: true,
            timeout: 5000
          })
        );
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(lockManager.getQueueLength(testFile)).toBe(3);

      // Cleanup
      await lockManager.release(testFile, testOwnerId);
      await Promise.allSettled(promises);
    });
  });
});

describe('FileLockManager Integration', () => {
  let lockManager: FileLockManager;
  const testDir = path.join(process.cwd(), 'test-concurrent-writes');
  const testFiles: string[] = [];

  beforeEach(() => {
    resetFileLockManager();
    lockManager = new FileLockManager({
      defaultTimeout: 5000,
      defaultStaleTime: 10000,
      lockDirectory: '.planning/test-locks'
    });

    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    lockManager.clearAllLocks();

    // Cleanup test files
    for (const file of testFiles) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    }

    // Remove test directory
    if (fs.existsSync(testDir)) {
      fs.rmdirSync(testDir);
    }
  });

  it('should prevent concurrent writes to same file', async () => {
    const testFile = path.join(testDir, 'shared.txt');
    testFiles.push(testFile);

    // Initialize file
    fs.writeFileSync(testFile, 'initial', 'utf-8');

    const writeResults: string[] = [];

    // Simulate 5 agents trying to write concurrently
    const writePromises = Array.from({ length: 5 }).map((_, i) =>
      lockManager.withLock(testFile, `agent-${i}`, async () => {
        // Simulate write operation
        await new Promise(resolve => setTimeout(resolve, 50));

        // Read current content
        const current = fs.readFileSync(testFile, 'utf-8');
        writeResults.push(`agent-${i}: ${current}`);

        // Write new content
        fs.writeFileSync(testFile, `written-by-agent-${i}`, 'utf-8');

        await new Promise(resolve => setTimeout(resolve, 50));
      })
    );

    await Promise.all(writePromises);

    // All writes should complete
    expect(writeResults.length).toBe(5);

    // Each write should see a consistent state (no partial writes)
    for (const result of writeResults) {
      expect(result).toMatch(/agent-\d+: (initial|written-by-agent-\d+)/);
    }
  });

  it('should allow concurrent writes to different files', async () => {
    const writeResults: string[] = [];

    // Create 5 files
    for (let i = 0; i < 5; i++) {
      const file = path.join(testDir, `file-${i}.txt`);
      testFiles.push(file);
      fs.writeFileSync(file, `initial-${i}`, 'utf-8');
    }

    // Each agent writes to different file
    const writePromises = Array.from({ length: 5 }).map((_, i) =>
      lockManager.withLock(
        path.join(testDir, `file-${i}.txt`),
        `agent-${i}`,
        async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
          fs.writeFileSync(
            path.join(testDir, `file-${i}.txt`),
            `written-by-agent-${i}`,
            'utf-8'
          );
          writeResults.push(`agent-${i}-complete`);
        }
      )
    );

    await Promise.all(writePromises);

    // All writes should complete
    expect(writeResults.length).toBe(5);
    expect(writeResults).toEqual([
      'agent-0-complete',
      'agent-1-complete',
      'agent-2-complete',
      'agent-3-complete',
      'agent-4-complete'
    ]);
  });
});
