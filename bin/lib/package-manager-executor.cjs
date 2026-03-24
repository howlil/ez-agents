#!/usr/bin/env node

/**
 * Package Manager Executor — Execute package manager commands
 *
 * Provides unified interface for npm, yarn, and pnpm operations:
 * - install: Install dependencies from lockfile
 * - add: Add new package(s) to project
 * - remove: Remove package(s) from project
 *
 * Cross-platform execution using execFile (not exec) for security
 * and consistent behavior across Windows, macOS, and Linux.
 *
 * Usage:
 *   const PackageManagerExecutor = require('./package-manager-executor.cjs');
 *   const executor = new PackageManagerExecutor('npm', cwd);
 *   await executor.install({ production: false, frozenLockfile: true });
 */

const { execFile } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const Logger = require('./logger.cjs');

const execFileAsync = promisify(execFile);

/**
 * Custom error class for package manager operations
 */
class PackageManagerError extends Error {
  constructor({ manager, cmd, args, error, stderr, stdout }) {
    const message = `[${manager}] ${cmd} ${args.join(' ')} failed: ${error}${stderr ? `\n${stderr}` : ''}`;
    super(message);
    this.name = 'PackageManagerError';
    this.manager = manager;
    this.cmd = cmd;
    this.args = args;
    this.stderr = stderr;
    this.stdout = stdout;
  }
}

/**
 * Package Manager Executor class
 * Executes package manager commands with cross-platform compatibility
 */
class PackageManagerExecutor {
  /**
   * Create a PackageManagerExecutor instance
   * @param {string} manager - Package manager name ('npm', 'yarn', or 'pnpm')
   * @param {string} cwd - Working directory (default: process.cwd())
   */
  constructor(manager, cwd = process.cwd()) {
    if (!['npm', 'yarn', 'pnpm'].includes(manager)) {
      throw new Error(`Unknown package manager: ${manager}. Must be 'npm', 'yarn', or 'pnpm'`);
    }

    this.manager = manager;
    this.cwd = cwd;
    this.logger = new Logger();
    this.timeout = 300000; // 5 minutes
    this.maxBuffer = 10 * 1024 * 1024; // 10MB buffer
  }

  /**
   * Execute install command
   * @param {Object} options - Install options
   * @param {boolean} [options.production] - Production install (exclude devDependencies)
   * @param {boolean} [options.frozenLockfile] - Use frozen lockfile (CI/CD safe)
   * @param {boolean} [options.preferOffline] - Prefer offline cache
   * @returns {Promise<string>} Command output
   */
  async install(options = {}) {
    const { production, frozenLockfile, preferOffline } = options;

    const args = this._buildInstallArgs({ production, frozenLockfile, preferOffline });

    this.logger.info('Package manager install', {
      manager: this.manager,
      args: args.join(' '),
      cwd: this.cwd
    });

    return await this._execute(this.manager, args);
  }

  /**
   * Add package(s) to project
   * @param {string[]} packages - Package names to add
   * @param {Object} options - Add options
   * @param {boolean} [options.dev] - Add as devDependency
   * @param {boolean} [options.peer] - Add as peerDependency
   * @param {boolean} [options.optional] - Add as optionalDependency
   * @param {boolean} [options.global] - Install globally
   * @returns {Promise<string>} Command output
   */
  async add(packages, options = {}) {
    const { dev, peer, optional, global } = options;

    const args = this._buildAddArgs(packages, { dev, peer, optional, global });

    this.logger.info('Package manager add', {
      manager: this.manager,
      packages,
      args: args.join(' '),
      cwd: this.cwd
    });

    return await this._execute(this.manager, args);
  }

  /**
   * Remove package(s) from project
   * @param {string[]} packages - Package names to remove
   * @param {Object} options - Remove options
   * @param {boolean} [options.global] - Remove from global install
   * @returns {Promise<string>} Command output
   */
  async remove(packages, options = {}) {
    const { global } = options;

    const args = this._buildRemoveArgs(packages, { global });

    this.logger.info('Package manager remove', {
      manager: this.manager,
      packages,
      args: args.join(' '),
      cwd: this.cwd
    });

    return await this._execute(this.manager, args);
  }

  /**
   * Build install arguments for specific package manager
   * @private
   * @param {Object} options - Install options
   * @returns {string[]} Command arguments
   */
  _buildInstallArgs(options = {}) {
    const { production, frozenLockfile, preferOffline } = options;

    switch (this.manager) {
      case 'npm':
        return this._buildNpmInstallArgs({ production, frozenLockfile, preferOffline });
      case 'yarn':
        return this._buildYarnInstallArgs({ production, frozenLockfile, preferOffline });
      case 'pnpm':
        return this._buildPnpmInstallArgs({ production, frozenLockfile, preferOffline });
      default:
        throw new Error(`Unknown package manager: ${this.manager}`);
    }
  }

  /**
   * Build npm install arguments
   * @private
   */
  _buildNpmInstallArgs(options = {}) {
    const { production, frozenLockfile, preferOffline } = options;
    const args = ['install'];

    if (production) args.push('--production');
    if (frozenLockfile) args.push('--frozen-lockfile');
    if (preferOffline) args.push('--prefer-offline');

    return args.filter(Boolean);
  }

  /**
   * Build yarn install arguments
   * @private
   */
  _buildYarnInstallArgs(options = {}) {
    const { production, frozenLockfile, preferOffline } = options;
    const args = ['install'];

    if (production) args.push('--production');
    if (frozenLockfile) args.push('--frozen-lockfile');
    if (preferOffline) args.push('--prefer-offline');

    return args.filter(Boolean);
  }

  /**
   * Build pnpm install arguments
   * @private
   */
  _buildPnpmInstallArgs(options = {}) {
    const { production, frozenLockfile, preferOffline } = options;
    const args = ['install'];

    if (production) args.push('--prod');
    if (frozenLockfile) args.push('--frozen-lockfile');
    if (preferOffline) args.push('--prefer-offline');

    return args.filter(Boolean);
  }

  /**
   * Build add arguments for specific package manager
   * @private
   * @param {string[]} packages - Package names
   * @param {Object} options - Add options
   * @returns {string[]} Command arguments
   */
  _buildAddArgs(packages, options = {}) {
    switch (this.manager) {
      case 'npm':
        return this._buildNpmAddArgs(packages, options);
      case 'yarn':
        return this._buildYarnAddArgs(packages, options);
      case 'pnpm':
        return this._buildPnpmAddArgs(packages, options);
      default:
        throw new Error(`Unknown package manager: ${this.manager}`);
    }
  }

  /**
   * Build npm add arguments
   * @private
   */
  _buildNpmAddArgs(packages, options = {}) {
    const { dev, peer, optional, global } = options;
    const args = ['install'];

    if (global) args.push('-g');
    if (dev) args.push('--save-dev');
    if (peer) args.push('--save-peer');
    if (optional) args.push('--save-optional');

    return [...args, ...packages];
  }

  /**
   * Build yarn add arguments
   * @private
   */
  _buildYarnAddArgs(packages, options = {}) {
    const { dev, peer, optional, global } = options;
    const args = ['add'];

    if (global) args.push('global');
    if (dev) args.push('--dev');
    if (peer) args.push('--peer');
    if (optional) args.push('--optional');

    return [...args, ...packages];
  }

  /**
   * Build pnpm add arguments
   * @private
   */
  _buildPnpmAddArgs(packages, options = {}) {
    const { dev, peer, optional, global } = options;
    const args = ['add'];

    if (global) args.push('-g');
    if (dev) args.push('--save-dev');
    if (peer) args.push('--save-peer');
    if (optional) args.push('--save-optional');

    return [...args, ...packages];
  }

  /**
   * Build remove arguments for specific package manager
   * @private
   * @param {string[]} packages - Package names
   * @param {Object} options - Remove options
   * @returns {string[]} Command arguments
   */
  _buildRemoveArgs(packages, options = {}) {
    switch (this.manager) {
      case 'npm':
        return this._buildNpmRemoveArgs(packages, options);
      case 'yarn':
        return this._buildYarnRemoveArgs(packages, options);
      case 'pnpm':
        return this._buildPnpmRemoveArgs(packages, options);
      default:
        throw new Error(`Unknown package manager: ${this.manager}`);
    }
  }

  /**
   * Build npm remove arguments
   * @private
   */
  _buildNpmRemoveArgs(packages, options = {}) {
    const { global } = options;
    const args = ['uninstall'];

    if (global) args.push('-g');

    return [...args, ...packages];
  }

  /**
   * Build yarn remove arguments
   * @private
   */
  _buildYarnRemoveArgs(packages, options = {}) {
    const { global } = options;
    const args = ['remove'];

    if (global) args.push('global');

    return [...args, ...packages];
  }

  /**
   * Build pnpm remove arguments
   * @private
   */
  _buildPnpmRemoveArgs(packages, options = {}) {
    const { global } = options;
    const args = ['remove'];

    if (global) args.push('-g');

    return [...args, ...packages];
  }

  /**
   * Execute command with cross-platform compatibility
   * @private
   * @param {string} cmd - Command to execute
   * @param {string[]} args - Command arguments
   * @returns {Promise<string>} Command output
   */
  async _execute(cmd, args) {
    const startTime = Date.now();

    this.logger.debug('Package manager command start', {
      manager: this.manager,
      cmd,
      args: args.join(' '),
      cwd: this.cwd
    });

    try {
      const result = await execFileAsync(cmd, args, {
        cwd: this.cwd,
        shell: false, // Use execFile for security (no shell injection)
        maxBuffer: this.maxBuffer,
        timeout: this.timeout
      });

      const duration = Date.now() - startTime;
      this.logger.debug('Package manager command completed', {
        manager: this.manager,
        duration,
        stdout_length: result.stdout?.length || 0
      });

      return result.stdout.trim();
    } catch (err) {
      const duration = Date.now() - startTime;
      this.logger.error('Package manager command failed', {
        manager: this.manager,
        cmd,
        args: args.join(' '),
        duration,
        error: err.message,
        stderr: err.stderr?.trim(),
        stdout: err.stdout?.trim()
      });

      throw new PackageManagerError({
        manager: this.manager,
        cmd,
        args,
        error: err.message,
        stderr: err.stderr?.trim(),
        stdout: err.stdout?.trim()
      });
    }
  }
}

module.exports = PackageManagerExecutor;
module.exports.PackageManagerError = PackageManagerError;
