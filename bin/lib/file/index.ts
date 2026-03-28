/**
 * File System Module
 *
 * Handles file access, locking, temp files, and path utilities.
 */

export { FileAccessService } from './file-access.js';

// File Lock Manager - Advanced locking for parallel agent coordination
export {
  FileLockManager,
  getFileLockManager,
  resetFileLockManager,
  acquireLock,
  releaseLock,
  withLock
} from './file-lock-manager.js';
export type {
  LockState,
  LockMetadata,
  LockOptions,
  LockQueueEntry,
  LockStats,
  FileLockManagerConfig
} from './file-lock-manager.js';

// Simple file locking (backward compatibility)
export { withLock as withSimpleLock, isLocked as isSimpleLocked, ifUnlocked } from './file-lock.js';
export type { LockOptions as SimpleLockOptions, LockRelease } from './file-lock.js';

export { TempResourceType, createTempDir, createTempFile, createTempFileWithCleanup, writeToTemp, readFromTemp, cleanupTemp, cleanupAll, getTrackedTemps, generateSecureSuffix, isPathSafe as tempFileIsPathSafe } from './temp-file.js';
export type { TempResource, TempFileOptions, TempFileResult } from './temp-file.js';

export { normalizePath, isPathSafe, validatePathExists, safeReadFile as safePathReadFile, toPosixPath as safePathToPosix } from './safe-path.js';

export {
  normalizePath as fsNormalizePath,
  isPathSafe as fsIsPathSafe,
  safeReadFile as fsSafeReadFile,
  findFiles
} from './fs-utils.js';

// Re-export for backward compatibility
export { FileOperations } from './file-operations.js';
export { fileOperations } from './file-operations.js';
