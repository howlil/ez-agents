/**
 * File Lock Manager — Advanced File Locking for Parallel Agent Coordination
 *
 * Provides mutex-based write coordination for parallel agent execution.
 * Prevents race conditions, file corruption, and lost changes during
 * concurrent agent operations.
 *
 * Features:
 * - File-level locks with owner tracking
 * - Write queue for contested files
 * - Deadlock prevention with timeout
 * - Lock statistics and monitoring
 * - Integration with agent execution workflows
 *
 * @example
 * ```typescript
 * const lockManager = new FileLockManager();
 *
 * // Acquire lock before writing
 * await lockManager.acquire('src/auth.ts', 'agent-1');
 * try {
 *   await writeFile('src/auth.ts', content);
 * } finally {
 *   await lockManager.release('src/auth.ts', 'agent-1');
 * }
 *
 * // Or use withLock helper
 * await lockManager.withLock('src/auth.ts', 'agent-1', async () => {
 *   await writeFile('src/auth.ts', content);
 * });
 * ```
 */

import * as fs from 'fs';
import * as path from 'path';
import { defaultLogger as logger } from '../logger/index.js';

// ─── Type Definitions ────────────────────────────────────────────────────────

/**
 * Lock state enumeration
 */
export enum LockState {
  UNLOCKED = 'unlocked',
  LOCKED = 'locked',
  WAITING = 'waiting',
  STALE = 'stale'
}

/**
 * Lock metadata
 */
export interface LockMetadata {
  /** Unique identifier for the lock owner (e.g., agent ID) */
  ownerId: string;
  /** Timestamp when lock was acquired */
  acquiredAt: number;
  /** Timestamp when lock was last updated */
  lastUpdate: number;
  /** File path being locked */
  filePath: string;
  /** Lock state */
  state: LockState;
  /** Number of times this lock has been waited on */
  waitCount: number;
}

/**
 * Lock request options
 */
export interface LockOptions {
  /** Maximum time to wait for lock acquisition (ms) */
  timeout?: number;
  /** Time after which lock is considered stale (ms) */
  staleTime?: number;
  /** Interval to update lock heartbeat (ms) */
  heartbeatInterval?: number;
  /** Whether to wait in queue or fail immediately */
  waitForLock?: boolean;
  /** Priority level (higher = more priority) */
  priority?: number;
}

/**
 * Lock queue entry
 */
export interface LockQueueEntry {
  /** Owner ID waiting for lock */
  ownerId: string;
  /** Timestamp when request was made */
  requestedAt: number;
  /** Priority level */
  priority: number;
  /** Resolve function for promise */
  resolve: () => void;
  /** Reject function for promise */
  reject: (error: Error) => void;
  /** Timeout timer ID */
  timeoutId?: NodeJS.Timeout;
}

/**
 * Lock statistics
 */
export interface LockStats {
  /** Total locks acquired */
  totalAcquired: number;
  /** Total locks released */
  totalReleased: number;
  /** Total lock timeouts */
  totalTimeouts: number;
  /** Total deadlocks detected */
  totalDeadlocks: number;
  /** Current active locks */
  activeLocks: number;
  /** Current waiting requests */
  waitingRequests: number;
  /** Average lock hold time (ms) */
  avgHoldTime: number;
  /** Average wait time (ms) */
  avgWaitTime: number;
}

/**
 * File Lock Manager configuration
 */
export interface FileLockManagerConfig {
  /** Default timeout for lock acquisition (ms) */
  defaultTimeout: number;
  /** Default stale time (ms) */
  defaultStaleTime: number;
  /** Default heartbeat interval (ms) */
  defaultHeartbeatInterval: number;
  /** Enable deadlock detection */
  deadlockDetection: boolean;
  /** Enable lock statistics tracking */
  enableStats: boolean;
  /** Lock file directory (default: .planning/locks) */
  lockDirectory: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: FileLockManagerConfig = {
  defaultTimeout: 30000,        // 30 seconds
  defaultStaleTime: 60000,      // 60 seconds
  defaultHeartbeatInterval: 10000, // 10 seconds
  deadlockDetection: true,
  enableStats: true,
  lockDirectory: '.planning/locks'
};

const LOCK_FILE_SUFFIX = '.lock';

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Normalize file path for consistent locking
 */
function normalizePath(filePath: string): string {
  return path.resolve(filePath);
}

/**
 * Get lock file path
 */
function getLockFilePath(filePath: string, lockDirectory: string): string {
  const normalized = normalizePath(filePath);
  const relativePath = path.relative(process.cwd(), normalized);
  return path.join(lockDirectory, relativePath + LOCK_FILE_SUFFIX);
}

/**
 * Ensure lock directory exists
 */
async function ensureLockDirectory(lockDirectory: string): Promise<void> {
  if (!fs.existsSync(lockDirectory)) {
    fs.mkdirSync(lockDirectory, { recursive: true });
  }
}

// ─── FileLockManager Class ───────────────────────────────────────────────────

/**
 * File Lock Manager for parallel agent coordination
 */
export class FileLockManager {
  private config: FileLockManagerConfig;
  private activeLocks: Map<string, LockMetadata>;
  private lockQueues: Map<string, LockQueueEntry[]>;
  private heartbeatTimers: Map<string, NodeJS.Timeout>;
  private stats: LockStats;
  private lockDirectory: string;

  constructor(config?: Partial<FileLockManagerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.lockDirectory = this.config.lockDirectory;
    this.activeLocks = new Map();
    this.lockQueues = new Map();
    this.heartbeatTimers = new Map();
    this.stats = {
      totalAcquired: 0,
      totalReleased: 0,
      totalTimeouts: 0,
      totalDeadlocks: 0,
      activeLocks: 0,
      waitingRequests: 0,
      avgHoldTime: 0,
      avgWaitTime: 0
    };

    // Initialize lock directory
    this.ensureLockDirectorySync();

    logger.info('FileLockManager initialized', {
      lockDirectory: this.lockDirectory,
      deadlockDetection: this.config.deadlockDetection
    });
  }

  /**
   * Ensure lock directory exists (sync)
   */
  private ensureLockDirectorySync(): void {
    if (!fs.existsSync(this.lockDirectory)) {
      fs.mkdirSync(this.lockDirectory, { recursive: true });
    }
  }

  /**
   * Acquire a file lock
   * @param filePath - File to lock
   * @param ownerId - Owner identifier (e.g., agent ID)
   * @param options - Lock options
   */
  async acquire(
    filePath: string,
    ownerId: string,
    options: LockOptions = {}
  ): Promise<boolean> {
    const normalizedPath = normalizePath(filePath);
    const lockOptions = {
      timeout: this.config.defaultTimeout,
      staleTime: this.config.defaultStaleTime,
      heartbeatInterval: this.config.defaultHeartbeatInterval,
      waitForLock: true,
      priority: 0,
      ...options
    };

    logger.debug('Attempting to acquire lock', {
      filePath: normalizedPath,
      ownerId,
      timeout: lockOptions.timeout
    });

    // Check if we already hold this lock
    const existingLock = this.activeLocks.get(normalizedPath);
    if (existingLock && existingLock.ownerId === ownerId) {
      logger.debug('Lock already held by this owner', {
        filePath: normalizedPath,
        ownerId
      });
      // Update heartbeat
      this.updateHeartbeat(normalizedPath, ownerId);
      return true;
    }

    // Check if lock is available
    if (!existingLock) {
      return this.grantLock(normalizedPath, ownerId, lockOptions);
    }

    // Check if existing lock is stale
    if (this.isLockStale(existingLock, lockOptions.staleTime)) {
      logger.warn('Lock is stale, reclaiming', {
        filePath: normalizedPath,
        previousOwner: existingLock.ownerId,
        newOwner: ownerId
      });
      await this.releaseStaleLock(normalizedPath);
      return this.grantLock(normalizedPath, ownerId, lockOptions);
    }

    // Lock is held by another owner - queue the request
    if (!lockOptions.waitForLock) {
      logger.debug('Lock held by another owner, not waiting', {
        filePath: normalizedPath,
        ownerId,
        currentOwner: existingLock.ownerId
      });
      return false;
    }

    return this.enqueueLockRequest(normalizedPath, ownerId, lockOptions);
  }

  /**
   * Release a file lock
   * @param filePath - File to unlock
   * @param ownerId - Owner identifier
   */
  async release(filePath: string, ownerId: string): Promise<boolean> {
    const normalizedPath = normalizePath(filePath);
    const lock = this.activeLocks.get(normalizedPath);

    if (!lock) {
      logger.debug('Attempted to release non-existent lock', {
        filePath: normalizedPath,
        ownerId
      });
      return false;
    }

    if (lock.ownerId !== ownerId) {
      logger.warn('Attempted to release lock held by another owner', {
        filePath: normalizedPath,
        ownerId,
        actualOwner: lock.ownerId
      });
      return false;
    }

    return this.revokeLock(normalizedPath, ownerId);
  }

  /**
   * Execute a function while holding a lock
   * @param filePath - File to lock
   * @param ownerId - Owner identifier
   * @param fn - Function to execute
   * @param options - Lock options
   */
  async withLock<T>(
    filePath: string,
    ownerId: string,
    fn: () => Promise<T>,
    options: LockOptions = {}
  ): Promise<T> {
    const acquired = await this.acquire(filePath, ownerId, options);
    if (!acquired) {
      throw new Error(`Failed to acquire lock for ${filePath}`);
    }

    try {
      return await fn();
    } finally {
      await this.release(filePath, ownerId);
    }
  }

  /**
   * Check if a file is locked
   * @param filePath - File to check
   */
  isLocked(filePath: string): boolean {
    const normalizedPath = normalizePath(filePath);
    const lock = this.activeLocks.get(normalizedPath);
    return !!lock && lock.state === LockState.LOCKED && !this.isLockStale(lock);
  }

  /**
   * Get lock information
   * @param filePath - File to check
   */
  getLockInfo(filePath: string): LockMetadata | null {
    const normalizedPath = normalizePath(filePath);
    return this.activeLocks.get(normalizedPath) || null;
  }

  /**
   * Get lock statistics
   */
  getStats(): LockStats {
    return { ...this.stats };
  }

  /**
   * Get all active locks
   */
  getActiveLocks(): LockMetadata[] {
    return Array.from(this.activeLocks.values());
  }

  /**
   * Get queue length for a file
   * @param filePath - File to check
   */
  getQueueLength(filePath: string): number {
    const normalizedPath = normalizePath(filePath);
    const queue = this.lockQueues.get(normalizedPath);
    return queue ? queue.length : 0;
  }

  /**
   * Force release a lock (for administrative use)
   * @param filePath - File to unlock
   */
  async forceRelease(filePath: string): Promise<boolean> {
    const normalizedPath = normalizePath(filePath);
    const lock = this.activeLocks.get(normalizedPath);

    if (!lock) {
      return false;
    }

    logger.warn('Force releasing lock', {
      filePath: normalizedPath,
      ownerId: lock.ownerId
    });

    return this.revokeLock(normalizedPath, lock.ownerId);
  }

  /**
   * Clear all locks (for testing only)
   */
  clearAllLocks(): void {
    logger.warn('Clearing all locks', {
      activeLocks: this.activeLocks.size
    });

    // Clear all heartbeat timers
    for (const timer of this.heartbeatTimers.values()) {
      clearTimeout(timer);
    }
    this.heartbeatTimers.clear();

    // Clear all queues
    for (const [filePath, queue] of this.lockQueues.entries()) {
      for (const entry of queue) {
        if (entry.timeoutId) {
          clearTimeout(entry.timeoutId);
        }
        entry.reject(new Error('Locks cleared'));
      }
    }
    this.lockQueues.clear();

    // Clear active locks
    this.activeLocks.clear();

    // Reset stats
    this.stats = {
      totalAcquired: 0,
      totalReleased: 0,
      totalTimeouts: 0,
      totalDeadlocks: 0,
      activeLocks: 0,
      waitingRequests: 0,
      avgHoldTime: 0,
      avgWaitTime: 0
    };
  }

  // ─── Private Methods ───────────────────────────────────────────────────────

  /**
   * Grant a lock to an owner
   */
  private grantLock(
    normalizedPath: string,
    ownerId: string,
    options: LockOptions
  ): boolean {
    const now = Date.now();
    const lock: LockMetadata = {
      ownerId,
      acquiredAt: now,
      lastUpdate: now,
      filePath: normalizedPath,
      state: LockState.LOCKED,
      waitCount: 0
    };

    this.activeLocks.set(normalizedPath, lock);
    this.stats.totalAcquired++;
    this.stats.activeLocks = this.activeLocks.size;

    // Start heartbeat
    this.startHeartbeat(normalizedPath, ownerId, options.heartbeatInterval);

    // Write lock file to disk for persistence
    this.writeLockFile(normalizedPath, lock);

    logger.debug('Lock acquired', {
      filePath: normalizedPath,
      ownerId,
      timestamp: now
    });

    return true;
  }

  /**
   * Revoke a lock from an owner
   */
  private revokeLock(normalizedPath: string, ownerId: string): boolean {
    const lock = this.activeLocks.get(normalizedPath);
    if (!lock || lock.ownerId !== ownerId) {
      return false;
    }

    // Stop heartbeat
    this.stopHeartbeat(normalizedPath);

    // Calculate hold time for stats
    const holdTime = Date.now() - lock.acquiredAt;
    this.updateHoldTimeStats(holdTime);

    // Remove from active locks
    this.activeLocks.delete(normalizedPath);
    this.stats.totalReleased++;
    this.stats.activeLocks = this.activeLocks.size;

    // Remove lock file
    this.removeLockFile(normalizedPath);

    logger.debug('Lock released', {
      filePath: normalizedPath,
      ownerId,
      holdTime
    });

    // Process queue
    this.processLockQueue(normalizedPath);

    return true;
  }

  /**
   * Enqueue a lock request
   */
  private enqueueLockRequest(
    normalizedPath: string,
    ownerId: string,
    options: LockOptions
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const entry: LockQueueEntry = {
        ownerId,
        requestedAt: Date.now(),
        priority: options.priority || 0,
        resolve: () => resolve(true),
        reject,
        timeoutId: undefined
      };

      // Set timeout
      if (options.timeout) {
        entry.timeoutId = setTimeout(() => {
          this.removeQueueEntry(normalizedPath, entry);
          this.stats.totalTimeouts++;
          logger.warn('Lock request timed out', {
            filePath: normalizedPath,
            ownerId,
            timeout: options.timeout
          });
          reject(new Error(`Lock timeout after ${options.timeout}ms`));
        }, options.timeout);
      }

      // Add to queue
      if (!this.lockQueues.has(normalizedPath)) {
        this.lockQueues.set(normalizedPath, []);
      }
      this.lockQueues.get(normalizedPath)!.push(entry);
      this.stats.waitingRequests++;

      logger.debug('Lock request queued', {
        filePath: normalizedPath,
        ownerId,
        queueLength: this.lockQueues.get(normalizedPath)!.length,
        priority: entry.priority
      });

      // Check for deadlock
      if (this.config.deadlockDetection) {
        this.detectDeadlock(normalizedPath, ownerId);
      }
    });
  }

  /**
   * Remove a queue entry
   */
  private removeQueueEntry(
    normalizedPath: string,
    entry: LockQueueEntry
  ): void {
    const queue = this.lockQueues.get(normalizedPath);
    if (queue) {
      const index = queue.indexOf(entry);
      if (index > -1) {
        queue.splice(index, 1);
        this.stats.waitingRequests--;
      }
    }
  }

  /**
   * Process lock queue after a lock is released
   */
  private processLockQueue(normalizedPath: string): void {
    const queue = this.lockQueues.get(normalizedPath);
    if (!queue || queue.length === 0) {
      return;
    }

    // Sort by priority (higher first), then by request time (earlier first)
    queue.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return a.requestedAt - b.requestedAt;
    });

    // Grant lock to first in queue
    const nextEntry = queue[0];
    this.removeQueueEntry(normalizedPath, nextEntry);

    if (nextEntry.timeoutId) {
      clearTimeout(nextEntry.timeoutId);
    }

    // Calculate wait time for stats
    const waitTime = Date.now() - nextEntry.requestedAt;
    this.updateWaitTimeStats(waitTime);

    logger.debug('Granting lock from queue', {
      filePath: normalizedPath,
      ownerId: nextEntry.ownerId,
      waitTime,
      priority: nextEntry.priority
    });

    this.grantLock(normalizedPath, nextEntry.ownerId, {
      timeout: this.config.defaultTimeout,
      staleTime: this.config.defaultStaleTime,
      heartbeatInterval: this.config.defaultHeartbeatInterval
    });

    nextEntry.resolve();
  }

  /**
   * Start heartbeat for a lock
   */
  private startHeartbeat(
    normalizedPath: string,
    ownerId: string,
    interval: number = this.config.defaultHeartbeatInterval
  ): void {
    this.stopHeartbeat(normalizedPath); // Clear existing timer

    const timer = setInterval(() => {
      this.updateHeartbeat(normalizedPath, ownerId);
    }, interval);

    this.heartbeatTimers.set(normalizedPath, timer);
  }

  /**
   * Stop heartbeat for a lock
   */
  private stopHeartbeat(normalizedPath: string): void {
    const timer = this.heartbeatTimers.get(normalizedPath);
    if (timer) {
      clearInterval(timer);
      this.heartbeatTimers.delete(normalizedPath);
    }
  }

  /**
   * Update lock heartbeat
   */
  private updateHeartbeat(normalizedPath: string, ownerId: string): void {
    const lock = this.activeLocks.get(normalizedPath);
    if (lock && lock.ownerId === ownerId) {
      lock.lastUpdate = Date.now();
      // Update lock file
      this.writeLockFile(normalizedPath, lock);
    }
  }

  /**
   * Check if a lock is stale
   */
  private isLockStale(
    lock: LockMetadata,
    staleTime: number = this.config.defaultStaleTime
  ): boolean {
    return Date.now() - lock.lastUpdate > staleTime;
  }

  /**
   * Release a stale lock
   */
  private async releaseStaleLock(normalizedPath: string): Promise<void> {
    const lock = this.activeLocks.get(normalizedPath);
    if (lock) {
      this.stopHeartbeat(normalizedPath);
      this.activeLocks.delete(normalizedPath);
      this.removeLockFile(normalizedPath);
      logger.warn('Stale lock released', {
        filePath: normalizedPath,
        previousOwner: lock.ownerId
      });
    }
  }

  /**
   * Detect potential deadlock
   */
  private detectDeadlock(normalizedPath: string, requestingOwnerId: string): void {
    // Check if requesting owner is waiting for multiple locks
    const waitingFor = this.getWaitingLocks(requestingOwnerId);

    // Check for circular wait (simplified deadlock detection)
    for (const waitingPath of waitingFor) {
      const lock = this.activeLocks.get(waitingPath);
      if (lock) {
        const holderWaiting = this.getWaitingLocks(lock.ownerId);
        if (holderWaiting.includes(normalizedPath)) {
          // Circular wait detected
          this.stats.totalDeadlocks++;
          logger.error('Deadlock detected', {
            filePath: normalizedPath,
            requestingOwner: requestingOwnerId,
            lockHolder: lock.ownerId,
            circularWait: {
              [requestingOwnerId]: waitingPath,
              [lock.ownerId]: normalizedPath
            }
          });

          // Resolve by releasing the newer lock
          const newerLock = lock.acquiredAt > Date.now() - 1000 ? lock : this.activeLocks.get(normalizedPath);
          if (newerLock) {
            this.revokeLock(normalizePath(newerLock.filePath), newerLock.ownerId);
          }
        }
      }
    }
  }

  /**
   * Get list of files an owner is waiting for
   */
  private getWaitingLocks(ownerId: string): string[] {
    const waiting: string[] = [];
    for (const [filePath, queue] of this.lockQueues.entries()) {
      if (queue.some(entry => entry.ownerId === ownerId)) {
        waiting.push(filePath);
      }
    }
    return waiting;
  }

  /**
   * Write lock file to disk
   */
  private writeLockFile(normalizedPath: string, lock: LockMetadata): void {
    try {
      this.ensureLockDirectorySync();
      const lockFilePath = getLockFilePath(normalizedPath, this.lockDirectory);
      const lockDir = path.dirname(lockFilePath);

      if (!fs.existsSync(lockDir)) {
        fs.mkdirSync(lockDir, { recursive: true });
      }

      fs.writeFileSync(lockFilePath, JSON.stringify(lock, null, 2), {
        encoding: 'utf-8',
        flag: 'w'
      });
    } catch (err) {
      logger.debug('Failed to write lock file', {
        filePath: normalizedPath,
        error: err instanceof Error ? err.message : 'Unknown'
      });
    }
  }

  /**
   * Remove lock file from disk
   */
  private removeLockFile(normalizedPath: string): void {
    try {
      const lockFilePath = getLockFilePath(normalizedPath, this.lockDirectory);
      if (fs.existsSync(lockFilePath)) {
        fs.unlinkSync(lockFilePath);
      }
    } catch (err) {
      logger.debug('Failed to remove lock file', {
        filePath: normalizedPath,
        error: err instanceof Error ? err.message : 'Unknown'
      });
    }
  }

  /**
   * Update hold time statistics
   */
  private updateHoldTimeStats(holdTime: number): void {
    if (!this.config.enableStats) return;

    const total = this.stats.totalReleased;
    this.stats.avgHoldTime =
      (this.stats.avgHoldTime * total + holdTime) / (total + 1);
  }

  /**
   * Update wait time statistics
   */
  private updateWaitTimeStats(waitTime: number): void {
    if (!this.config.enableStats) return;

    const grantedCount = this.stats.totalAcquired - this.stats.activeLocks;
    if (grantedCount > 0) {
      this.stats.avgWaitTime =
        (this.stats.avgWaitTime * grantedCount + waitTime) / (grantedCount + 1);
    }
  }
}

// ─── Singleton Instance ──────────────────────────────────────────────────────

let globalLockManager: FileLockManager | null = null;

/**
 * Get or create global FileLockManager instance
 */
export function getFileLockManager(config?: Partial<FileLockManagerConfig>): FileLockManager {
  if (!globalLockManager) {
    globalLockManager = new FileLockManager(config);
  }
  return globalLockManager;
}

/**
 * Reset global FileLockManager instance (for testing)
 */
export function resetFileLockManager(): void {
  if (globalLockManager) {
    globalLockManager.clearAllLocks();
    globalLockManager = null;
  }
}

// ─── Convenience Functions ───────────────────────────────────────────────────

/**
 * Acquire a lock using the global manager
 */
export async function acquireLock(
  filePath: string,
  ownerId: string,
  options?: LockOptions
): Promise<boolean> {
  return getFileLockManager().acquire(filePath, ownerId, options);
}

/**
 * Release a lock using the global manager
 */
export async function releaseLock(
  filePath: string,
  ownerId: string
): Promise<boolean> {
  return getFileLockManager().release(filePath, ownerId);
}

/**
 * Execute with lock using the global manager
 */
export async function withLock<T>(
  filePath: string,
  ownerId: string,
  fn: () => Promise<T>,
  options?: LockOptions
): Promise<T> {
  return getFileLockManager().withLock(filePath, ownerId, fn, options);
}

export default FileLockManager;
