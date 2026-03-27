/**
 * CLI Timeout Utilities
 *
 * Pure functions for adaptive timeout management.
 * No classes, no state, no side effects.
 *
 * @example
 * ```typescript
 * const timeout = getTimeout(50); // 60000ms for 50 files
 * const result = await execWithTimeout('node', ['script.js'], fileCount);
 * ```
 */

/**
 * Get adaptive timeout based on file count
 *
 * Scales timeout automatically:
 * - <10 files: 25% of base (30s default)
 * - 10-50 files: 50% of base (60s default)
 * - 50-100 files: 75% of base (90s default)
 * - 100+ files: 100% of base (120s default)
 *
 * @param fileCount - Number of files to process
 * @returns Timeout in milliseconds
 */
export function getTimeout(fileCount: number): number {
  const baseTimeout = parseInt(process.env.EZ_CLI_TIMEOUT || '120', 10) * 1000;

  // Scale down for smaller operations
  if (fileCount < 10) return Math.max(30000, baseTimeout * 0.25);
  if (fileCount < 50) return Math.max(60000, baseTimeout * 0.5);
  if (fileCount < 100) return Math.max(90000, baseTimeout * 0.75);
  return baseTimeout; // 100+ files use full timeout
}

/**
 * Execute command with adaptive timeout
 *
 * @param cmd - Command to execute
 * @param args - Command arguments
 * @param fileCount - Number of files (for timeout calculation)
 * @returns Command stdout
 */
export async function execWithTimeout<T = string>(
  cmd: string,
  args: string[],
  fileCount: number
): Promise<T> {
  const { execFile } = await import('child_process');
  const { promisify } = await import('util');
  const execFileAsync = promisify(execFile);

  const timeout = getTimeout(fileCount);

  try {
    const result = await execFileAsync(cmd, args, { timeout });
    return result.stdout.trim() as T;
  } catch (error) {
    const err = error as Error & { code?: string; stdout?: string };
    if (err.code === 'ETIMEDOUT') {
      throw new Error(`Command timed out after ${timeout}ms: ${cmd} ${args.join(' ')}`);
    }
    throw err;
  }
}

export default { getTimeout, execWithTimeout };
