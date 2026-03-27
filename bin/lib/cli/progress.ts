/**
 * CLI Progress Utilities
 *
 * Stateless progress rendering functions.
 * No classes, no state, no instance variables.
 *
 * @example
 * ```typescript
 * const start = Date.now();
 * for (const [i, chunk] of chunkIterator(files, 20).entries()) {
 *   await processChunk(chunk);
 *   renderProgress(i + 1, files.length, start);
 * }
 * ```
 */

/**
 * Render progress bar to stdout (stateless)
 *
 * Shows:
 * - Progress bar (30 chars)
 * - Percentage
 * - Current/Total
 * - ETA (if speed > 0)
 * - Speed (items/second)
 *
 * Respects EZ_CLI_VERBOSE environment variable.
 *
 * @param current - Current progress
 * @param total - Total items
 * @param startTime - Start timestamp (Date.now())
 * @param label - Progress label
 */
export function renderProgress(
  current: number,
  total: number,
  startTime: number,
  label: string = 'Processing'
): void {
  if (process.env.EZ_CLI_VERBOSE !== 'true') return;

  const percent = (current / total) * 100;
  const elapsed = (Date.now() - startTime) / 1000;
  const speed = current / elapsed;
  const eta = speed > 0 ? ((total - current) / speed) : 0;

  const barWidth = 30;
  const filled = Math.floor((percent / 100) * barWidth);
  const bar = '█'.repeat(filled) + '░'.repeat(barWidth - filled);

  let output = `\r${label}: [${bar}] ${percent.toFixed(1)}% (${current}/${total})`;

  if (eta > 0) {
    const etaMin = Math.floor(eta / 60);
    const etaSec = Math.floor(eta % 60);
    output += ` - ETA: ${etaMin}m ${etaSec}s`;
  }

  output += ` - ${speed.toFixed(1)} items/s`;
  process.stdout.write(output);
}

/**
 * Render completion message
 *
 * @param total - Total items
 * @param startTime - Start timestamp
 * @param label - Completion label
 */
export function renderComplete(
  total: number,
  startTime: number,
  label: string = 'Complete'
): void {
  if (process.env.EZ_CLI_VERBOSE !== 'true') return;

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✅ ${label}: ${total} items in ${elapsed}s`);
}

/**
 * Clear progress line (for cleanup)
 */
export function clearProgress(): void {
  process.stdout.write('\r\x1b[K');
}

export default { renderProgress, renderComplete, clearProgress };
