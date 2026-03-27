/**
 * CLI Memory Utilities
 *
 * Pure functions for reactive memory management.
 * No classes, no state, no manual GC.
 *
 * @example
 * ```typescript
 * if (isMemoryCritical()) {
 *   const chunkSize = getOptimalChunkSize(); // Auto-reduces
 * }
 * ```
 */

/**
 * Check if memory usage is critical (>90% of limit)
 *
 * @returns True if memory usage exceeds 90% of limit
 */
export function isMemoryCritical(): boolean {
  const usage = process.memoryUsage().heapUsed / 1024 / 1024; // MB
  const limit = parseInt(process.env.EZ_CLI_MEMORY_LIMIT || '4096', 10);
  return usage > limit * 0.9; // 90% threshold
}

/**
 * Get current degradation mode based on memory usage
 *
 * Modes:
 * - normal: <60% of limit
 * - reduced: 60-90% of limit
 * - minimal: >90% of limit
 *
 * @returns Current degradation mode
 */
export function getDegradationMode(): 'normal' | 'reduced' | 'minimal' {
  const usage = process.memoryUsage().heapUsed / 1024 / 1024;
  const limit = parseInt(process.env.EZ_CLI_MEMORY_LIMIT || '4096', 10);

  if (usage > limit * 0.9) return 'minimal';
  if (usage > limit * 0.6) return 'reduced';
  return 'normal';
}

/**
 * Get optimal chunk size based on memory mode
 *
 * Chunk sizes:
 * - minimal mode: 5 files (very small)
 * - reduced mode: 10 files (small)
 * - normal mode: 20 files (standard)
 *
 * @returns Number of files per chunk
 */
export function getOptimalChunkSize(): number {
  const mode = getDegradationMode();
  if (mode === 'minimal') return 5;
  if (mode === 'reduced') return 10;
  return 20; // Normal
}

/**
 * Get current memory usage in MB
 *
 * @returns Memory usage in megabytes
 */
export function getMemoryUsage(): number {
  return process.memoryUsage().heapUsed / 1024 / 1024;
}

export default {
  isMemoryCritical,
  getDegradationMode,
  getOptimalChunkSize,
  getMemoryUsage
};
