/**
 * Process Executor Utility
 *
 * Provides type-safe process execution with proper error handling.
 */

import {
  spawn,
  type SpawnOptions,
  type ChildProcessWithoutNullStreams
} from 'child_process';

export interface ProcessResult {
  success: boolean;
  output: string;
  code: number | null;
}

/**
 * Spawn a process with proper types
 */
export function spawnProcess(
  cmd: string,
  args: string[],
  options: SpawnOptions = {}
): ChildProcessWithoutNullStreams {
  const proc = spawn(cmd, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options
  }) as ChildProcessWithoutNullStreams;

  return proc;
}

/**
 * Execute command and capture output
 */
export async function executeProcess(
  cmd: string,
  args: string[],
  options: SpawnOptions & { timeout?: number } = {}
): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    const proc = spawnProcess(cmd, args, options);
    let output = '';
    const timeout = options.timeout ?? 300000;

    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error(`Process timeout after ${timeout}ms`));
    }, timeout);

    proc.stdout.on('data', (data: Buffer) => {
      output += data.toString();
    });

    proc.stderr.on('data', (data: Buffer) => {
      output += data.toString();
    });

    proc.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        success: code === 0,
        output,
        code
      });
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}
