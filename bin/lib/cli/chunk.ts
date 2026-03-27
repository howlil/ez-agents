/**
 * CLI Chunking Utilities
 *
 * Generator-based chunking for memory-efficient iteration.
 * No classes, no state, lazy evaluation.
 *
 * @example
 * ```typescript
 * for (const chunk of chunkIterator(files, 20)) {
 *   await processChunk(chunk);
 * }
 * ```
 */

/**
 * Generator that yields chunks from an array
 *
 * Lazy evaluation: only creates current chunk, not all chunks at once.
 * Memory efficient for large arrays.
 *
 * @param items - Array of items to chunk
 * @param size - Maximum chunk size
 * @yields Arrays of items (chunks)
 */
export function* chunkIterator<T>(items: T[], size: number): Generator<T[]> {
  for (let i = 0; i < items.length; i += size) {
    yield items.slice(i, i + size);
  }
}

/**
 * Async generator that yields chunks (for I/O operations)
 *
 * Yields to event loop between chunks to prevent blocking.
 * Use for file operations, network requests, etc.
 *
 * @param items - Array of items to chunk
 * @param size - Maximum chunk size
 * @yields Arrays of items (chunks)
 */
export async function* asyncChunkIterator<T>(
  items: T[],
  size: number
): AsyncGenerator<T[]> {
  for (let i = 0; i < items.length; i += size) {
    yield items.slice(i, i + size);
    await Promise.resolve(); // Yield to event loop
  }
}

/**
 * Count total chunks without creating all chunks
 *
 * @param totalItems - Total number of items
 * @param chunkSize - Size of each chunk
 * @returns Number of chunks
 */
export function countChunks(totalItems: number, chunkSize: number): number {
  return Math.ceil(totalItems / chunkSize);
}

export default { chunkIterator, asyncChunkIterator, countChunks };
