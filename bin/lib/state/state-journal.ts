/**
 * State Journal - Append-only journal for state changes
 *
 * Provides:
 * - Append-only log of all state changes
 * - Audit trail for debugging and compliance
 * - Replay capability for recovery scenarios
 * - Time-travel debugging support
 * - Journal rotation and archival
 *
 * @example
 * ```typescript
 * const journal = new StateJournal('.planning/state-journal.jsonl');
 *
 * // Create and append entry
 * const entry = journal.createEntry('update', 'ez-planner', {
 *   taskId: '01-01',
 *   previousState: { status: 'pending' },
 *   newState: { status: 'in-progress' }
 * });
 * await journal.append(entry);
 *
 * // Query entries
 * const entries = await journal.query({ taskId: '01-01', limit: 10 });
 *
 * // Replay task history
 * const history = await journal.replay('01-01');
 * ```
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { withLock } from '../file/file-lock-manager.js';

// ─── Type Definitions ────────────────────────────────────────────────────────

/**
 * Journal entry type
 */
export type JournalEntryType = 'create' | 'update' | 'delete' | 'checkpoint' | 'recovery';

/**
 * Journal entry representing a state change
 */
export interface JournalEntry {
  /** Unique entry ID */
  id: string;
  /** Unix timestamp */
  timestamp: number;
  /** Type of state change */
  type: JournalEntryType;
  /** Affected task ID (optional) */
  taskId?: string;
  /** Affected phase number (optional) */
  phase?: number;
  /** Agent that made the change */
  agentId: string;
  /** State before change (optional) */
  previousState?: Record<string, unknown>;
  /** State after change (optional) */
  newState?: Record<string, unknown>;
  /** Vector clock at time of change */
  vectorClock?: Record<string, number>;
  /** Entry checksum for integrity */
  checksum: string;
}

/**
 * Journal configuration
 */
export interface JournalConfig {
  /** Path to journal file (default: '.planning/state-journal.jsonl') */
  journalPath: string;
  /** Enable journaling (default: true) */
  enabled: boolean;
  /** Maximum entries before rotation (default: 10000) */
  maxEntries: number;
  /** Flush interval in milliseconds (default: 5000) */
  flushIntervalMs: number;
  /** Enable compression (default: false) */
  compressionEnabled: boolean;
}

/**
 * Filter for querying journal entries
 */
export interface JournalFilter {
  /** Filter by task ID */
  taskId?: string;
  /** Filter by phase number */
  phase?: number;
  /** Filter by agent ID */
  agentId?: string;
  /** Filter by entry type */
  type?: JournalEntryType;
  /** Filter by start timestamp */
  startTime?: number;
  /** Filter by end timestamp */
  endTime?: number;
  /** Maximum entries to return (default: 100) */
  limit?: number;
}

/**
 * Journal statistics
 */
export interface JournalStats {
  /** Total entries in journal */
  totalEntries: number;
  /** Total append operations */
  totalAppends: number;
  /** Total append errors */
  appendErrors: number;
  /** Total query operations */
  totalQueries: number;
  /** Total replay operations */
  totalReplays: number;
  /** Total rotations */
  totalRotations: number;
  /** Timestamp of last append */
  lastAppendTime?: number;
  /** Timestamp of last query */
  lastQueryTime?: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: JournalConfig = {
  journalPath: '.planning/state-journal.jsonl',
  enabled: true,
  maxEntries: 10000,
  flushIntervalMs: 5000,
  compressionEnabled: false
};

// ─── StateJournal Class ──────────────────────────────────────────────────────

/**
 * State Journal - Append-only log for state changes
 *
 * Extends EventEmitter to emit events on journal operations:
 * - 'entry-created': When a new entry is created
 * - 'journal-appended': When an entry is appended to the journal
 * - 'journal-append-error': When append operation fails
 * - 'journal-queried': When query completes
 * - 'journal-replay': When replay completes
 * - 'journal-rotated': When journal is rotated
 */
export class StateJournal extends EventEmitter {
  private readonly config: JournalConfig;
  private readonly stats: JournalStats;
  private readonly journalDir: string;
  private pendingEntries: JournalEntry[];
  private flushTimer: NodeJS.Timeout | null;
  private entryCount: number;

  /**
   * Create a new StateJournal instance
   *
   * @param journalPath - Path to journal file (optional, overrides config)
   * @param config - Journal configuration (optional)
   */
  constructor(journalPath?: string, config?: Partial<JournalConfig>) {
    super();
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      journalPath: journalPath || config?.journalPath || DEFAULT_CONFIG.journalPath
    };
    this.journalDir = path.dirname(this.config.journalPath);
    this.stats = {
      totalEntries: 0,
      totalAppends: 0,
      appendErrors: 0,
      totalQueries: 0,
      totalReplays: 0,
      totalRotations: 0
    };
    this.pendingEntries = [];
    this.flushTimer = null;
    this.entryCount = 0;

    // Ensure journal directory exists
    this.ensureJournalDirectory();

    // Count existing entries
    this.countExistingEntries();

    // Start flush timer
    this.startFlushTimer();
  }

  /**
   * Ensure journal directory exists
   */
  private ensureJournalDirectory(): void {
    if (!fs.existsSync(this.journalDir)) {
      fs.mkdirSync(this.journalDir, { recursive: true });
    }
  }

  /**
   * Count existing entries in journal file
   */
  private countExistingEntries(): void {
    try {
      if (fs.existsSync(this.config.journalPath)) {
        const content = fs.readFileSync(this.config.journalPath, 'utf-8');
        const lines = content.split('\n').filter((line) => line.trim() !== '');
        this.entryCount = lines.length;
        this.stats.totalEntries = this.entryCount;
      }
    } catch (error) {
      // Ignore errors, start fresh
    }
  }

  /**
   * Start flush timer for periodic flushing
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flushPendingEntries().catch((error) => {
        this.emit('journal-append-error', { error, reason: 'flush-timer' });
      });
    }, this.config.flushIntervalMs);
  }

  /**
   * Calculate checksum for entry integrity
   *
   * @param entry - Entry to calculate checksum for (without checksum field)
   * @returns Checksum as base-36 string
   */
  private calculateChecksum(entry: Omit<JournalEntry, 'checksum'>): string {
    const serialized = JSON.stringify(entry);
    let hash = 0;
    for (let i = 0; i < serialized.length; i++) {
      const char = serialized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Create a new journal entry
   *
   * @param type - Type of state change
   * @param agentId - Agent that made the change
   * @param options - Entry options (taskId, phase, previousState, newState, vectorClock)
   * @returns New journal entry
   *
   * @emits StateJournal#entry-created
   */
  createEntry(
    type: JournalEntryType,
    agentId: string,
    options: {
      taskId?: string;
      phase?: number;
      previousState?: Record<string, unknown>;
      newState?: Record<string, unknown>;
      vectorClock?: Record<string, number>;
    } = {}
  ): JournalEntry {
    // Generate entry ID
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const id = `journal-${timestamp}-${randomId}`;

    // Build entry without checksum
    const entryWithoutChecksum: Omit<JournalEntry, 'checksum'> = {
      id,
      timestamp,
      type,
      agentId,
      ...(options.taskId !== undefined && { taskId: options.taskId }),
      ...(options.phase !== undefined && { phase: options.phase }),
      ...(options.previousState !== undefined && { previousState: options.previousState }),
      ...(options.newState !== undefined && { newState: options.newState }),
      ...(options.vectorClock !== undefined && { vectorClock: options.vectorClock })
    };

    // Calculate checksum
    const checksum = this.calculateChecksum(entryWithoutChecksum);

    // Build complete entry
    const entry: JournalEntry = {
      ...entryWithoutChecksum,
      checksum
    };

    // Emit event
    this.emit('entry-created', { entry });

    return entry;
  }

  /**
   * Append an entry to the journal
   *
   * Appends entry to journal file in JSONL format (one JSON per line).
   * Uses file locking for concurrent safety.
   *
   * @param entry - Journal entry to append
   * @returns Promise resolving to true on success, false on failure
   *
   * @emits StateJournal#journal-appended
   * @emits StateJournal#journal-append-error
   */
  async append(entry: JournalEntry): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    try {
      // Add to pending entries
      this.pendingEntries.push(entry);

      // Check if we should flush immediately
      const shouldFlush = this.pendingEntries.length >= 100; // Flush threshold

      if (shouldFlush) {
        await this.flushPendingEntries();
      }

      // Update stats
      this.stats.totalAppends++;
      this.stats.lastAppendTime = Date.now();
      this.entryCount++;
      this.stats.totalEntries = this.entryCount;

      // Emit success event
      this.emit('journal-appended', { entry });

      // Check if rotation is needed
      if (this.entryCount >= this.config.maxEntries) {
        await this.rotate();
      }

      return true;
    } catch (error) {
      // Update error stats
      this.stats.appendErrors++;

      // Emit error event
      this.emit('journal-append-error', { error, entry });

      return false;
    }
  }

  /**
   * Flush pending entries to disk
   */
  private async flushPendingEntries(): Promise<boolean> {
    if (this.pendingEntries.length === 0) {
      return true;
    }

    try {
      // Use file locking for atomic writes
      await withLock(this.config.journalPath, 'state-journal', async () => {
        // Serialize entries to JSONL format
        const lines = this.pendingEntries.map((entry) => JSON.stringify(entry));
        const content = lines.join('\n') + '\n';

        // Append to journal file
        await fs.promises.appendFile(this.config.journalPath, content, 'utf-8');
      });

      // Clear pending entries
      this.pendingEntries = [];

      return true;
    } catch (error) {
      this.emit('journal-append-error', { error, reason: 'flush' });
      return false;
    }
  }

  /**
   * Query journal entries
   *
   * @param filter - Query filter criteria
   * @returns Promise resolving to filtered entries (sorted by timestamp, newest first)
   *
   * @emits StateJournal#journal-queried
   */
  async query(filter: JournalFilter): Promise<JournalEntry[]> {
    const startTime = Date.now();
    this.stats.totalQueries++;

    try {
      // Ensure pending entries are flushed
      await this.flushPendingEntries();

      // Read journal file
      if (!fs.existsSync(this.config.journalPath)) {
        this.emit('journal-queried', { filter, entries: [], queryTime: Date.now() - startTime });
        return [];
      }

      const content = fs.readFileSync(this.config.journalPath, 'utf-8');
      const lines = content.split('\n').filter((line) => line.trim() !== '');

      // Parse and filter entries
      const entries: JournalEntry[] = [];

      for (const line of lines) {
        try {
          const entry = JSON.parse(line) as JournalEntry;

          // Apply filters
          if (filter.taskId && entry.taskId !== filter.taskId) {
            continue;
          }
          if (filter.phase && entry.phase !== filter.phase) {
            continue;
          }
          if (filter.agentId && entry.agentId !== filter.agentId) {
            continue;
          }
          if (filter.type && entry.type !== filter.type) {
            continue;
          }
          if (filter.startTime && entry.timestamp < filter.startTime) {
            continue;
          }
          if (filter.endTime && entry.timestamp > filter.endTime) {
            continue;
          }

          entries.push(entry);
        } catch (parseError) {
          // Skip malformed entries
        }
      }

      // Sort by timestamp (newest first)
      entries.sort((a, b) => b.timestamp - a.timestamp);

      // Apply limit
      const limit = filter.limit ?? 100;
      const result = entries.slice(0, limit);

      // Update stats
      this.stats.lastQueryTime = Date.now();

      // Emit event
      this.emit('journal-queried', { filter, entries: result, queryTime: Date.now() - startTime });

      return result;
    } catch (error) {
      this.emit('journal-query-error', { error, filter });
      return [];
    }
  }

  /**
   * Replay journal entries for a specific task
   *
   * Returns all entries for a task in chronological order (oldest first).
   *
   * @param taskId - Task identifier to replay
   * @returns Promise resolving to entries in chronological order
   *
   * @emits StateJournal#journal-replay
   */
  async replay(taskId: string): Promise<JournalEntry[]> {
    this.stats.totalReplays++;

    try {
      // Query all entries for the task
      const entries = await this.query({
        taskId,
        limit: 10000 // High limit to get all entries
      });

      // Sort by timestamp ascending (chronological order)
      entries.sort((a, b) => a.timestamp - b.timestamp);

      // Emit event
      this.emit('journal-replay', { taskId, entries });

      return entries;
    } catch (error) {
      this.emit('journal-replay-error', { error, taskId });
      return [];
    }
  }

  /**
   * Rotate journal when maxEntries exceeded
   *
   * Archives current journal with timestamp and creates new empty journal.
   * Keeps only last N archives (based on maxEntries / 1000).
   *
   * @returns Promise resolving when rotation completes
   *
   * @emits StateJournal#journal-rotated
   */
  async rotate(): Promise<void> {
    try {
      // Ensure pending entries are flushed
      await this.flushPendingEntries();

      if (!fs.existsSync(this.config.journalPath)) {
        return;
      }

      // Count entries
      const content = fs.readFileSync(this.config.journalPath, 'utf-8');
      const lines = content.split('\n').filter((line) => line.trim() !== '');

      if (lines.length < this.config.maxEntries) {
        return; // No rotation needed
      }

      // Generate archive filename
      const timestamp = Date.now();
      const archiveFilename = `state-journal.${timestamp}.jsonl`;
      const archivePath = path.join(this.journalDir, archiveFilename);

      // Archive current journal
      await fs.promises.rename(this.config.journalPath, archivePath);

      // Reset entry count
      this.entryCount = 0;
      this.stats.totalEntries = 0;

      // Delete oldest archives if exceeding retention
      await this.cleanupOldArchives();

      // Update stats
      this.stats.totalRotations++;

      // Emit event
      this.emit('journal-rotated', { archivePath, timestamp });
    } catch (error) {
      this.emit('journal-rotate-error', { error });
    }
  }

  /**
   * Clean up old journal archives
   */
  private async cleanupOldArchives(): Promise<void> {
    try {
      const archivePattern = /^state-journal\.\d+\.jsonl$/;
      const archives: { path: string; timestamp: number }[] = [];

      const files = fs.readdirSync(this.journalDir);
      for (const file of files) {
        const match = archivePattern.exec(file);
        if (match) {
          const timestamp = parseInt(file.replace('state-journal.', '').replace('.jsonl', ''), 10);
          archives.push({
            path: path.join(this.journalDir, file),
            timestamp
          });
        }
      }

      // Sort by timestamp (newest first)
      archives.sort((a, b) => b.timestamp - a.timestamp);

      // Keep only last N archives (default: 10)
      const retentionCount = Math.max(10, Math.floor(this.config.maxEntries / 1000));
      const toDelete = archives.slice(retentionCount);

      for (const archive of toDelete) {
        try {
          await fs.promises.unlink(archive.path);
        } catch (error) {
          // Ignore deletion errors
        }
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  /**
   * Get list of journal archives
   *
   * @returns Promise resolving to array of archive paths (sorted by age)
   */
  async getArchives(): Promise<string[]> {
    try {
      const archivePattern = /^state-journal\.\d+\.jsonl$/;
      const archives: { path: string; timestamp: number }[] = [];

      const files = fs.readdirSync(this.journalDir);
      for (const file of files) {
        const match = archivePattern.exec(file);
        if (match) {
          const timestamp = parseInt(file.replace('state-journal.', '').replace('.jsonl', ''), 10);
          archives.push({
            path: path.join(this.journalDir, file),
            timestamp
          });
        }
      }

      // Sort by timestamp (newest first)
      archives.sort((a, b) => b.timestamp - a.timestamp);

      return archives.map((a) => a.path);
    } catch (error) {
      return [];
    }
  }

  /**
   * Get journal statistics
   *
   * @returns Copy of journal statistics
   */
  getStats(): JournalStats {
    return { ...this.stats };
  }

  /**
   * Stop the flush timer
   *
   * Call this when shutting down the StateJournal.
   */
  stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Flush any remaining entries
    if (this.pendingEntries.length > 0) {
      this.flushPendingEntries().catch((error) => {
        this.emit('journal-append-error', { error, reason: 'shutdown' });
      });
    }
  }
}

export default StateJournal;
