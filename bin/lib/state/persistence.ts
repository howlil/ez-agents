/**
 * State Persistence Layer - Persistent state storage for StateManager
 *
 * Provides:
 * - File-based state persistence that survives process restarts
 * - Atomic writes using temp file + rename pattern
 * - Backup management with rotation
 * - State serialization/deserialization with Map support
 * - Persistence statistics and monitoring
 *
 * @example
 * ```typescript
 * const persistence = new StatePersistence('.planning/STATE.md');
 *
 * // Write state
 * await persistence.writeState(globalState);
 *
 * // Read state
 * const state = await persistence.readState();
 *
 * // Get stats
 * const stats = persistence.getStats();
 * ```
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { GlobalState } from './state-manager.js';
import { withLock } from '../file/file-lock-manager.js';

// ─── Type Definitions ────────────────────────────────────────────────────────

/**
 * Persistence configuration
 */
export interface PersistenceConfig {
  /** Path to state file (default: '.planning/STATE.md') */
  statePath: string;
  /** Enable backup creation (default: true) */
  backupEnabled: boolean;
  /** Number of backups to retain (default: 3) */
  backupCount: number;
  /** Use atomic writes with temp file (default: true) */
  atomicWrites: boolean;
  /** Enable compression (default: false) */
  compressionEnabled: boolean;
}

/**
 * Persistence statistics
 */
export interface PersistenceStats {
  /** Total write operations */
  totalWrites: number;
  /** Total read operations */
  totalReads: number;
  /** Total write errors */
  writeErrors: number;
  /** Total read errors */
  readErrors: number;
  /** Timestamp of last write */
  lastWriteTime?: number;
  /** Timestamp of last read */
  lastReadTime?: number;
  /** Average write time in milliseconds */
  averageWriteTimeMs: number;
  /** Average read time in milliseconds */
  averageReadTimeMs: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: PersistenceConfig = {
  statePath: '.planning/STATE.md',
  backupEnabled: true,
  backupCount: 3,
  atomicWrites: true,
  compressionEnabled: false
};

// ─── StatePersistence Class ──────────────────────────────────────────────────

/**
 * State Persistence Layer
 *
 * Handles persistent storage of global state with atomic writes,
 * backup management, and statistics tracking.
 */
export class StatePersistence extends EventEmitter {
  private readonly config: PersistenceConfig;
  private readonly stats: PersistenceStats;
  private readonly stateDir: string;

  /**
   * Create a new StatePersistence instance
   *
   * @param statePath - Path to state file (optional, overrides config)
   * @param config - Persistence configuration (optional)
   */
  constructor(statePath?: string, config?: Partial<PersistenceConfig>) {
    super();
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      statePath: statePath || config?.statePath || DEFAULT_CONFIG.statePath
    };
    this.stateDir = path.dirname(this.config.statePath);
    this.stats = {
      totalWrites: 0,
      totalReads: 0,
      writeErrors: 0,
      readErrors: 0,
      averageWriteTimeMs: 0,
      averageReadTimeMs: 0
    };

    // Ensure state directory exists
    this.ensureStateDirectory();
  }

  /**
   * Ensure state directory exists
   */
  private ensureStateDirectory(): void {
    if (!fs.existsSync(this.stateDir)) {
      fs.mkdirSync(this.stateDir, { recursive: true });
    }
  }

  /**
   * Serialize global state to JSON string
   *
   * Converts Map objects to JSON-serializable format:
   * - Map<string, number> -> Object with key-value pairs
   * - Map<string, TaskState> -> Array of [key, value] entries
   * - Map<number, PhaseState> -> Array of [key, value] entries
   *
   * @param state - Global state to serialize
   * @returns JSON string
   */
  private serializeState(state: GlobalState): string {
    const serialized = {
      version: {
        vectorClock: Object.fromEntries(state.version.vectorClock),
        timestamp: state.version.timestamp,
        checksum: state.version.checksum
      },
      taskStates: Array.from(state.taskStates.entries()).map(([key, value]) => [
        key,
        {
          ...value,
          version: {
            vectorClock: Object.fromEntries(value.version.vectorClock),
            timestamp: value.version.timestamp,
            checksum: value.version.checksum
          }
        }
      ]),
      phaseState: Array.from(state.phaseState.entries()).map(([key, value]) => [
        key,
        {
          ...value,
          requirements: Array.from(value.requirements.entries())
        }
      ]),
      checkpointId: state.checkpointId
    };

    return JSON.stringify(serialized, null, 2);
  }

  /**
   * Deserialize global state from JSON string
   *
   * Reconstructs Map objects from JSON format:
   * - Object -> Map<string, number> for vectorClock
   * - Array entries -> Map<string, TaskState> for taskStates
   * - Array entries -> Map<number, PhaseState> for phaseState
   *
   * @param data - JSON string to deserialize
   * @returns GlobalState object
   */
  private deserializeState(data: string): GlobalState {
    const parsed = JSON.parse(data);

    return {
      version: {
        vectorClock: new Map(Object.entries(parsed.version.vectorClock)),
        timestamp: parsed.version.timestamp,
        checksum: parsed.version.checksum
      },
      taskStates: new Map(
        parsed.taskStates.map(([key, value]) => [
          key,
          {
            ...value,
            version: {
              vectorClock: new Map(Object.entries(value.version.vectorClock)),
              timestamp: value.version.timestamp,
              checksum: value.version.checksum
            }
          }
        ])
      ),
      phaseState: new Map(
        parsed.phaseState.map(([key, value]) => [
          key,
          {
            ...value,
            requirements: new Map(value.requirements)
          }
        ])
      ),
      checkpointId: parsed.checkpointId
    };
  }

  /**
   * Write global state to disk
   *
   * Uses atomic write pattern:
   * 1. Serialize state to temp file
   * 2. Create backup of existing state (if enabled)
   * 3. Rename temp file to state file
   *
   * Emits 'state-written' event on success.
   * Emits 'state-write-error' event on failure.
   *
   * @param state - Global state to write
   * @returns Promise resolving to true on success, false on failure
   */
  async writeState(state: GlobalState): Promise<boolean> {
    const startTime = Date.now();

    try {
      // Use file locking for atomic writes
      await withLock(this.config.statePath, 'state-persistence', async () => {
        // Generate temp file path
        const tempPath = `${this.config.statePath}.tmp.${Date.now()}`;

        // Serialize state
        const serialized = this.serializeState(state);

        // Write to temp file
        await fs.promises.writeFile(tempPath, serialized, 'utf-8');

        // Create backup if enabled
        if (this.config.backupEnabled && fs.existsSync(this.config.statePath)) {
          await this.rotateBackups();
        }

        // Rename temp file to state file (atomic operation)
        await fs.promises.rename(tempPath, this.config.statePath);
      });

      // Update stats
      const writeTime = Date.now() - startTime;
      this.updateWriteStats(writeTime);

      // Emit success event
      this.emit('state-written', {
        state,
        timestamp: Date.now(),
        writeTime
      });

      return true;
    } catch (error) {
      // Update error stats
      this.stats.writeErrors++;

      // Emit error event
      this.emit('state-write-error', {
        error,
        state,
        timestamp: Date.now()
      });

      return false;
    }
  }

  /**
   * Read global state from disk
   *
   * Validates state file format before deserialization.
   * Returns null if state file doesn't exist.
   *
   * Emits 'state-read' event on success.
   * Emits 'state-read-error' event on failure.
   *
   * @returns Promise resolving to GlobalState or null
   */
  async readState(): Promise<GlobalState | null> {
    const startTime = Date.now();

    try {
      // Check if state file exists
      try {
        await fs.promises.access(this.config.statePath);
      } catch {
        // File doesn't exist - return null
        return null;
      }

      // Read file content
      const content = await fs.promises.readFile(this.config.statePath, 'utf-8');

      // Validate JSON structure
      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch (parseError) {
        throw new Error(`Invalid JSON in state file: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }

      // Validate required fields
      const data = parsed as Record<string, unknown>;
      if (
        !data.version ||
        !data.taskStates ||
        !data.phaseState
      ) {
        throw new Error('Invalid state file format: missing required fields (version, taskStates, phaseState)');
      }

      // Deserialize state
      const state = this.deserializeState(content);

      // Update stats
      const readTime = Date.now() - startTime;
      this.updateReadStats(readTime);

      // Emit success event
      this.emit('state-read', {
        state,
        timestamp: Date.now(),
        readTime
      });

      return state;
    } catch (error) {
      // Update error stats
      this.stats.readErrors++;

      // Emit error event
      this.emit('state-read-error', {
        error,
        timestamp: Date.now()
      });

      return null;
    }
  }

  /**
   * Rotate backup files
   *
   * Deletes oldest backup if count exceeds backupCount,
   * renames existing backups (incrementing numbers),
   * and renames current state file to backup.1
   */
  private async rotateBackups(): Promise<void> {
    const backupPattern = /\.backup\.(\d+)$/;
    const backups: { path: string; number: number }[] = [];

    // Find existing backups
    const stateDir = path.dirname(this.config.statePath);
    const stateBaseName = path.basename(this.config.statePath);

    if (fs.existsSync(stateDir)) {
      const files = fs.readdirSync(stateDir);
      for (const file of files) {
        const match = backupPattern.exec(file);
        if (match && file.startsWith(stateBaseName)) {
          backups.push({
            path: path.join(stateDir, file),
            number: parseInt(match[1]!, 10)
          });
        }
      }
    }

    // Sort by backup number
    backups.sort((a, b) => a.number - b.number);

    // Delete oldest backup if exceeds backupCount
    while (backups.length >= this.config.backupCount) {
      const oldest = backups.shift()!;
      try {
        await fs.promises.unlink(oldest.path);
      } catch (error) {
        // Ignore deletion errors
      }
    }

    // Rename remaining backups (increment numbers)
    for (let i = backups.length - 1; i >= 0; i--) {
      const backup = backups[i]!;
      const newPath = backup.path.replace(/\.backup\.(\d+)$/, `.backup.${i + 2}`);
      try {
        await fs.promises.rename(backup.path, newPath);
      } catch (error) {
        // Ignore rename errors
      }
    }

    // Rename current state to backup.1
    const backupPath = `${this.config.statePath}.backup.1`;
    try {
      await fs.promises.rename(this.config.statePath, backupPath);
    } catch (error) {
      // Ignore if state file doesn't exist
    }
  }

  /**
   * Get list of backup files
   *
   * @returns Promise resolving to array of backup file paths (sorted by age)
   */
  async getBackups(): Promise<string[]> {
    const backupPattern = /\.backup\.(\d+)$/;
    const backups: { path: string; number: number }[] = [];

    const stateDir = path.dirname(this.config.statePath);
    const stateBaseName = path.basename(this.config.statePath);

    if (fs.existsSync(stateDir)) {
      const files = fs.readdirSync(stateDir);
      for (const file of files) {
        const match = backupPattern.exec(file);
        if (match && file.startsWith(stateBaseName)) {
          backups.push({
            path: path.join(stateDir, file),
            number: parseInt(match[1]!, 10)
          });
        }
      }
    }

    // Sort by backup number (1 = newest, higher = older)
    backups.sort((a, b) => a.number - b.number);

    return backups.map((b) => b.path);
  }

  /**
   * Restore state from backup
   *
   * @param backupPath - Path to backup file
   * @returns Promise resolving to true on success, false on failure
   */
  async restoreFromBackup(backupPath: string): Promise<boolean> {
    try {
      // Validate backup file exists
      await fs.promises.access(backupPath);

      // Read backup content
      const content = await fs.promises.readFile(backupPath, 'utf-8');

      // Validate and deserialize
      const state = this.deserializeState(content);

      // Write to state path using writeState
      return await this.writeState(state);
    } catch (error) {
      this.emit('state-restore-error', {
        error,
        backupPath,
        timestamp: Date.now()
      });
      return false;
    }
  }

  /**
   * Get persistence statistics
   *
   * @returns Copy of persistence statistics
   */
  getStats(): PersistenceStats {
    return { ...this.stats };
  }

  /**
   * Update write statistics
   *
   * @param writeTime - Time taken for write operation in ms
   */
  private updateWriteStats(writeTime: number): void {
    this.stats.totalWrites++;
    this.stats.lastWriteTime = Date.now();

    // Update average write time (running average)
    this.stats.averageWriteTimeMs =
      (this.stats.averageWriteTimeMs * (this.stats.totalWrites - 1) + writeTime) /
      this.stats.totalWrites;
  }

  /**
   * Update read statistics
   *
   * @param readTime - Time taken for read operation in ms
   */
  private updateReadStats(readTime: number): void {
    this.stats.totalReads++;
    this.stats.lastReadTime = Date.now();

    // Update average read time (running average)
    this.stats.averageReadTimeMs =
      (this.stats.averageReadTimeMs * (this.stats.totalReads - 1) + readTime) /
      this.stats.totalReads;
  }
}

// ─── Checkpoint Service ──────────────────────────────────────────────────────

/**
 * Checkpoint metadata
 */
export interface CheckpointMetadata {
  id: string;
  timestamp: number;
  phase?: number;
  plan?: number;
  taskId?: string;
  agentId?: string;
  reason: 'periodic' | 'task-complete' | 'phase-complete' | 'manual' | 'pre-shutdown';
  stateSize: number;
  checksum: string;
}

/**
 * Checkpoint Service - Manages checkpoint creation and retrieval
 *
 * Provides:
 * - Explicit checkpoint API for crash recovery
 * - Checkpoint metadata tracking
 * - Task-level and phase-level checkpoints
 * - Checkpoint lifecycle management
 *
 * @example
 * ```typescript
 * const checkpointService = new CheckpointService('.planning/checkpoints');
 *
 * // Create checkpoint
 * const checkpointId = await checkpointService.createCheckpoint(
 *   globalState,
 *   { id: 'checkpoint-1', timestamp: Date.now(), reason: 'manual' }
 * );
 *
 * // Retrieve checkpoint
 * const state = await checkpointService.getCheckpoint(checkpointId);
 *
 * // List checkpoints
 * const checkpoints = await checkpointService.listCheckpoints();
 * ```
 */
export class CheckpointService extends EventEmitter {
  private readonly checkpointDir: string;
  private readonly metadata: Map<string, CheckpointMetadata>;

  /**
   * Create a new CheckpointService
   *
   * @param checkpointDir - Directory to store checkpoints
   */
  constructor(checkpointDir: string) {
    super();
    this.checkpointDir = checkpointDir;
    this.metadata = new Map();

    // Ensure checkpoint directory exists
    this.ensureCheckpointDirectory();
  }

  /**
   * Ensure checkpoint directory exists
   */
  private ensureCheckpointDirectory(): void {
    if (!fs.existsSync(this.checkpointDir)) {
      fs.mkdirSync(this.checkpointDir, { recursive: true });
    }
  }

  /**
   * Calculate checksum for state validation
   *
   * @param serialized - Serialized state string
   * @returns Checksum as base-36 string
   */
  private calculateChecksum(serialized: string): string {
    let hash = 0;
    for (let i = 0; i < serialized.length; i++) {
      const char = serialized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  /**
   * Create checkpoint
   *
   * Serializes and persists global state with metadata.
   * Emits 'checkpoint-created' event on success.
   *
   * @param state - Global state to checkpoint
   * @param metadata - Checkpoint metadata (without stateSize and checksum)
   * @returns Promise resolving to checkpoint ID
   */
  async createCheckpoint(
    state: GlobalState,
    metadata: Omit<CheckpointMetadata, 'stateSize' | 'checksum'>
  ): Promise<string> {
    // Generate checkpoint ID
    const checkpointId = metadata.id || `checkpoint-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const timestamp = metadata.timestamp || Date.now();

    // Serialize state
    const serialized = JSON.stringify({
      version: {
        vectorClock: Object.fromEntries(state.version.vectorClock),
        timestamp: state.version.timestamp,
        checksum: state.version.checksum
      },
      taskStates: Array.from(state.taskStates.entries()).map(([key, value]) => [
        key,
        {
          ...value,
          version: {
            vectorClock: Object.fromEntries(value.version.vectorClock),
            timestamp: value.version.timestamp,
            checksum: value.version.checksum
          }
        }
      ]),
      phaseState: Array.from(state.phaseState.entries()).map(([key, value]) => [
        key,
        {
          ...value,
          requirements: Array.from(value.requirements.entries())
        }
      ]),
      checkpointId: state.checkpointId
    });

    // Calculate state size and checksum
    const stateSize = serialized.length;
    const checksum = this.calculateChecksum(serialized);

    // Create full metadata
    const fullMetadata: CheckpointMetadata = {
      ...metadata,
      stateSize,
      checksum
    };

    // Ensure checkpoint directory exists
    this.ensureCheckpointDirectory();

    // Write checkpoint file
    const checkpointFilename = `checkpoint-${timestamp}-${checkpointId}.json`;
    const checkpointPath = path.join(this.checkpointDir, checkpointFilename);
    await fs.promises.writeFile(checkpointPath, serialized, 'utf-8');

    // Write metadata file
    const metadataFilename = `checkpoint-${timestamp}-${checkpointId}.meta.json`;
    const metadataPath = path.join(this.checkpointDir, metadataFilename);
    await fs.promises.writeFile(metadataPath, JSON.stringify(fullMetadata, null, 2), 'utf-8');

    // Store metadata in memory
    this.metadata.set(checkpointId, fullMetadata);

    // Emit event
    this.emit('checkpoint-created', { checkpointId, metadata: fullMetadata });

    return checkpointId;
  }

  /**
   * Get checkpoint
   *
   * Retrieves and deserializes checkpoint state.
   * Validates checksum before returning.
   * Emits 'checkpoint-loaded' event on success.
   *
   * @param checkpointId - Checkpoint identifier
   * @returns Promise resolving to GlobalState or null if not found
   */
  async getCheckpoint(checkpointId: string): Promise<GlobalState | null> {
    try {
      // Find checkpoint file
      const files = fs.readdirSync(this.checkpointDir);
      const checkpointFile = files.find(
        (f) => f.endsWith('.json') && !f.endsWith('.meta.json') && f.includes(checkpointId)
      );

      if (!checkpointFile) {
        return null;
      }

      // Read checkpoint content
      const checkpointPath = path.join(this.checkpointDir, checkpointFile);
      const content = await fs.promises.readFile(checkpointPath, 'utf-8');

      // Validate checksum
      const actualChecksum = this.calculateChecksum(content);
      const metadata = this.metadata.get(checkpointId);
      if (metadata && metadata.checksum !== actualChecksum) {
        throw new Error(`Checkpoint checksum mismatch: expected ${metadata.checksum}, got ${actualChecksum}`);
      }

      // Deserialize state
      const parsed = JSON.parse(content);
      const state: GlobalState = {
        version: {
          vectorClock: new Map(Object.entries(parsed.version.vectorClock)),
          timestamp: parsed.version.timestamp,
          checksum: parsed.version.checksum
        },
        taskStates: new Map(
          parsed.taskStates.map(([key, value]: [string, unknown]) => [
            key,
            {
              ...value,
              version: {
                vectorClock: new Map(Object.entries(value.version.vectorClock)),
                timestamp: value.version.timestamp,
                checksum: value.version.checksum
              }
            }
          ])
        ),
        phaseState: new Map(
          parsed.phaseState.map(([key, value]: [number, unknown]) => [
            key,
            {
              ...value,
              requirements: new Map(value.requirements)
            }
          ])
        ),
        checkpointId: parsed.checkpointId
      };

      // Emit event
      this.emit('checkpoint-loaded', { checkpointId, state });

      return state;
    } catch (error) {
      this.emit('checkpoint-load-error', { checkpointId, error });
      return null;
    }
  }

  /**
   * List checkpoints
   *
   * Returns all checkpoints sorted by timestamp (newest first).
   *
   * @returns Promise resolving to array of CheckpointMetadata
   */
  async listCheckpoints(): Promise<CheckpointMetadata[]> {
    try {
      const files = fs.readdirSync(this.checkpointDir);
      const metadataFiles = files.filter((f) => f.endsWith('.meta.json'));

      const checkpoints: CheckpointMetadata[] = [];

      for (const file of metadataFiles) {
        const metadataPath = path.join(this.checkpointDir, file);
        const content = await fs.promises.readFile(metadataPath, 'utf-8');
        const metadata = JSON.parse(content) as CheckpointMetadata;
        checkpoints.push(metadata);

        // Update in-memory metadata
        this.metadata.set(metadata.id, metadata);
      }

      // Sort by timestamp (newest first)
      checkpoints.sort((a, b) => b.timestamp - a.timestamp);

      return checkpoints;
    } catch (error) {
      this.emit('checkpoint-list-error', { error });
      return [];
    }
  }

  /**
   * Delete checkpoint
   *
   * Removes checkpoint and metadata files.
   *
   * @param checkpointId - Checkpoint identifier
   * @returns Promise resolving to true on success, false on failure
   */
  async deleteCheckpoint(checkpointId: string): Promise<boolean> {
    try {
      const files = fs.readdirSync(this.checkpointDir);

      // Find checkpoint and metadata files
      const checkpointFile = files.find(
        (f) => f.endsWith('.json') && !f.endsWith('.meta.json') && f.includes(checkpointId)
      );
      const metadataFile = files.find(
        (f) => f.endsWith('.meta.json') && f.includes(checkpointId)
      );

      // Return false if checkpoint doesn't exist
      if (!checkpointFile && !metadataFile) {
        return false;
      }

      // Delete files
      if (checkpointFile) {
        const checkpointPath = path.join(this.checkpointDir, checkpointFile);
        await fs.promises.unlink(checkpointPath);
      }

      if (metadataFile) {
        const metadataPath = path.join(this.checkpointDir, metadataFile);
        await fs.promises.unlink(metadataPath);
      }

      // Remove from memory
      this.metadata.delete(checkpointId);

      // Emit event
      this.emit('checkpoint-deleted', { checkpointId });

      return true;
    } catch (error) {
      this.emit('checkpoint-delete-error', { checkpointId, error });
      return false;
    }
  }

  /**
   * Get metadata for a checkpoint
   *
   * @param checkpointId - Checkpoint identifier
   * @returns CheckpointMetadata or undefined
   */
  getMetadata(checkpointId: string): CheckpointMetadata | undefined {
    return this.metadata.get(checkpointId);
  }
}

export default StatePersistence;
