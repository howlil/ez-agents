/**
 * CLI Performance Utilities
 *
 * Pure functions for timeout, memory, chunking, and progress.
 * Functional composition over class-based architecture.
 *
 * @module cli
 *
 * @example
 * ```typescript
 * import { getTimeout, isMemoryCritical, chunkIterator, renderProgress } from './cli/index.js';
 *
 * // Adaptive timeout
 * const timeout = getTimeout(fileCount);
 *
 * // Memory management
 * if (isMemoryCritical()) {
 *   // Reduce workload
 * }
 *
 * // Chunking
 * for (const chunk of chunkIterator(files, 20)) {
 *   await processChunk(chunk);
 * }
 *
 * // Progress
 * const start = Date.now();
 * for (const [i, chunk] of chunkIterator(files, 20).entries()) {
 *   await processChunk(chunk);
 *   renderProgress(i + 1, files.length, start);
 * }
 * ```
 */

// Timeout utilities
export { getTimeout, execWithTimeout } from './timeout.js';
export type { } from './timeout.js'; // No additional types

// Memory utilities
export {
  isMemoryCritical,
  getDegradationMode,
  getOptimalChunkSize,
  getMemoryUsage
} from './memory.js';

// Chunking utilities
export {
  chunkIterator,
  asyncChunkIterator,
  countChunks
} from './chunk.js';

// Progress utilities
export {
  renderProgress,
  renderComplete,
  clearProgress
} from './progress.js';

// Default export (all utilities)
export default {
  getTimeout: (await import('./timeout.js')).getTimeout,
  execWithTimeout: (await import('./timeout.js')).execWithTimeout,
  isMemoryCritical: (await import('./memory.js')).isMemoryCritical,
  getDegradationMode: (await import('./memory.js')).getDegradationMode,
  getOptimalChunkSize: (await import('./memory.js')).getOptimalChunkSize,
  getMemoryUsage: (await import('./memory.js')).getMemoryUsage,
  chunkIterator: (await import('./chunk.js')).chunkIterator,
  asyncChunkIterator: (await import('./chunk.js')).asyncChunkIterator,
  countChunks: (await import('./chunk.js')).countChunks,
  renderProgress: (await import('./progress.js')).renderProgress,
  renderComplete: (await import('./progress.js')).renderComplete,
  clearProgress: (await import('./progress.js')).clearProgress
};
