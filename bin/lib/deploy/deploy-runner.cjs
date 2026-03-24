/**
 * Deploy Runner — Executes one-command deploy for multiple platforms
 * Spawns platform CLI (vercel, flyctl, heroku, railway)
 */

const { spawn } = require('child_process');

class DeployRunner {
  constructor(cwd) {
    this.cwd = cwd || process.cwd();
  }

  /**
   * Run deployment for specified platform
   * @param {string} platform - Platform name (vercel, fly.io, heroku, railway)
   * @param {Object} options - Deploy options
   * @returns {Promise} Deploy result
   */
  async run(platform, options = {}) {
    const commands = {
      vercel: ['vercel', '--prod', ...(options.env ? ['--env', options.env] : [])],
      'fly.io': ['fly', 'deploy', ...(options.env ? ['--env', options.env] : [])],
      heroku: ['git', 'push', 'heroku', 'main'],
      railway: ['railway', 'up', ...(options.env ? ['--environment', options.env] : [])]
    };

    const cmdArgs = commands[platform];
    if (!cmdArgs) {
      throw new Error(`Unknown platform: ${platform}`);
    }

    const [cmd, ...args] = cmdArgs;

    return new Promise((resolve, reject) => {
      const proc = spawn(cmd, args, { 
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: this.cwd,
        timeout: 300000 // 5 minute timeout
      });

      let output = '';
      proc.stdout.on('data', (data) => {
        output += data.toString();
        if (options.onOutput) options.onOutput(data.toString());
      });
      proc.stderr.on('data', (data) => {
        output += data.toString();
        if (options.onOutput) options.onOutput(data.toString());
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, output });
        } else {
          reject(new Error(`Deploy failed with code ${code}`));
        }
      });

      proc.on('error', reject);
    });
  }

  /**
   * Check if platform CLI is installed
   * @param {string} platform - Platform name
   * @returns {boolean} True if installed
   */
  isCliInstalled(platform) {
    const commands = {
      vercel: 'vercel',
      'fly.io': 'fly',
      heroku: 'heroku',
      railway: 'railway'
    };

    try {
      const { execSync } = require('child_process');
      execSync(`${commands[platform]} --version`, { stdio: 'ignore' });
      return true;
    } catch (e) {
      return false;
    }
  }
}

/**
 * Run deployment
 * @param {string} platform - Platform name
 * @param {Object} options - Deploy options
 * @returns {Promise} Deploy result
 */
async function run(platform, options = {}) {
  const runner = new DeployRunner();
  return runner.run(platform, options);
}

module.exports = { DeployRunner, run };
