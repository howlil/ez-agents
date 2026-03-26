/**
 * Deploy Runner — Executes one-command deploy for multiple platforms
 * Spawns platform CLI (vercel, flyctl, heroku, railway)
 */

import { execSync } from 'child_process';
import { executeProcess } from '../process-executor.js';

/**
 * Deploy options
 */
export interface DeployOptions {
  /** Environment name */
  env?: string;
  /** Callback for output data */
  onOutput?: (data: string) => void;
}

/**
 * Deploy result
 */
export interface DeployResult {
  /** Whether deployment was successful */
  success: boolean;
  /** Deployment output */
  output: string;
}

export class DeployRunner {
  private cwd: string;

  constructor(cwd?: string) {
    this.cwd = cwd || process.cwd();
  }

  /**
   * Run deployment for specified platform
   * @param platform - Platform name (vercel, fly.io, heroku, railway)
   * @param options - Deploy options
   * @returns Deploy result
   */
  async run(platform: string, options: DeployOptions = {}): Promise<DeployResult> {
    const envValue = options.env;
    const commands: Record<string, string[]> = {
      vercel: ['vercel', '--prod', ...(envValue ? ['--env', envValue] : [])],
      'fly.io': ['fly', 'deploy', ...(envValue ? ['--env', envValue] : [])],
      heroku: ['git', 'push', 'heroku', 'main'],
      railway: ['railway', 'up', ...(envValue ? ['--environment', envValue] : [])]
    };

    const cmdArgs = commands[platform];
    if (!cmdArgs) {
      throw new Error(`Unknown platform: ${platform}`);
    }

    const [cmd, ...args] = cmdArgs as [string, ...string[]];

    try {
      const result = await executeProcess(cmd, args, {
        cwd: this.cwd,
        timeout: 300000 // 5 minute timeout
      });

      if (result.success) {
        if (options.onOutput) options.onOutput(result.output);
        return { success: true, output: result.output };
      } else {
        throw new Error(`Deploy failed with code ${result.code}`);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      throw new Error(`Deploy failed: ${error.message}`);
    }
  }

  /**
   * Check if platform CLI is installed
   * @param platform - Platform name
   * @returns True if installed
   */
  isCliInstalled(platform: string): boolean {
    const commands: Record<string, string> = {
      vercel: 'vercel',
      'fly.io': 'fly',
      heroku: 'heroku',
      railway: 'railway'
    };

    try {
      const cmd = commands[platform];
      if (!cmd) return false;
      execSync(`${cmd} --version`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Run deployment
 * @param platform - Platform name
 * @param options - Deploy options
 * @returns Deploy result
 */
export async function run(platform: string, options: DeployOptions = {}): Promise<DeployResult> {
  const runner = new DeployRunner();
  return runner.run(platform, options);
}
