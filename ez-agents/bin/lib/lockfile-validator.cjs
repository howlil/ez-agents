#!/usr/bin/env node

/**
 * Lockfile Validator — Validate package manager lockfiles
 *
 * Validates lockfile integrity for npm, yarn, and pnpm:
 * - npm: package-lock.json (JSON format with lockfileVersion)
 * - yarn: yarn.lock (YAML-like format with metadata header)
 * - pnpm: pnpm-lock.yaml (YAML format with lockfileVersion)
 *
 * Usage:
 *   const LockfileValidator = require('./lockfile-validator.cjs');
 *   const validator = new LockfileValidator(cwd);
 *   const result = validator.validate('npm');
 *   // Returns: { valid, reason, lockfileVersion?, packageCount? }
 */

const fs = require('fs');
const path = require('path');
const Logger = require('./logger.cjs');

/**
 * Lockfile Validator class
 * Validates lockfile integrity for different package managers
 */
class LockfileValidator {
  /**
   * Create a LockfileValidator instance
   * @param {string} cwd - Working directory (default: process.cwd())
   */
  constructor(cwd = process.cwd()) {
    this.cwd = cwd;
    this.logger = new Logger();
  }

  /**
   * Validate lockfile for a specific package manager
   * @param {string} manager - Package manager name ('npm', 'yarn', or 'pnpm')
   * @returns {Object} Validation result
   *   - {boolean} valid - Whether lockfile is valid
   *   - {string} reason - Reason code if invalid
   *   - {string} message - Human-readable message if invalid
   *   - {number} lockfileVersion - Lockfile version (if valid)
   *   - {number} packageCount - Number of packages (if valid)
   */
  validate(manager) {
    const lockfilePath = this.getLockfilePath(manager);

    this.logger.debug('Validating lockfile', {
      manager,
      lockfilePath,
      cwd: this.cwd
    });

    // Check file existence
    if (!fs.existsSync(lockfilePath)) {
      this.logger.debug('Lockfile not found', { lockfilePath });
      return {
        valid: false,
        reason: 'lockfile_missing',
        message: `No ${path.basename(lockfilePath)} found`
      };
    }

    try {
      const content = fs.readFileSync(lockfilePath, 'utf-8');

      switch (manager) {
        case 'npm':
          return this.validateNpmLockfile(content);
        case 'yarn':
          return this.validateYarnLockfile(content);
        case 'pnpm':
          return this.validatePnpmLockfile(content);
        default:
          return {
            valid: false,
            reason: 'unknown_manager',
            message: `Unknown package manager: ${manager}`
          };
      }
    } catch (err) {
      this.logger.error('Lockfile read error', {
        manager,
        lockfilePath,
        error: err.message
      });
      return {
        valid: false,
        reason: 'read_error',
        message: err.message
      };
    }
  }

  /**
   * Validate npm lockfile (package-lock.json)
   * @param {string} content - Lockfile content
   * @returns {Object} Validation result
   */
  validateNpmLockfile(content) {
    try {
      const lockfile = JSON.parse(content);

      // Check required fields
      if (!lockfile.lockfileVersion) {
        return {
          valid: false,
          reason: 'invalid_format',
          message: 'Missing lockfileVersion field'
        };
      }

      if (!lockfile.packages && !lockfile.dependencies) {
        return {
          valid: false,
          reason: 'empty_lockfile',
          message: 'Lockfile has no dependencies'
        };
      }

      const packageCount = Object.keys(lockfile.packages || lockfile.dependencies || {}).length;

      this.logger.debug('npm lockfile valid', {
        lockfileVersion: lockfile.lockfileVersion,
        packageCount
      });

      return {
        valid: true,
        lockfileVersion: lockfile.lockfileVersion,
        packageCount
      };
    } catch (err) {
      this.logger.debug('npm lockfile invalid JSON', { error: err.message });
      return {
        valid: false,
        reason: 'invalid_json',
        message: `Invalid JSON: ${err.message}`
      };
    }
  }

  /**
   * Validate yarn lockfile (yarn.lock)
   * @param {string} content - Lockfile content
   * @returns {Object} Validation result
   */
  validateYarnLockfile(content) {
    // Yarn lockfile is YAML-like format
    // Check for basic structure: __metadata__ (Yarn 2+) or "# yarn lockfile v" (Yarn 1)
    const hasYarn2Metadata = content.includes('__metadata:');
    const hasYarn1Header = content.match(/^# yarn lockfile v/i);

    if (!hasYarn2Metadata && !hasYarn1Header) {
      this.logger.debug('yarn lockfile invalid format');
      return {
        valid: false,
        reason: 'invalid_format',
        message: 'Invalid yarn.lock format'
      };
    }

    // Count dependency entries (lines starting with package name pattern)
    const entryCount = (content.match(/^"?[^@\s]+@/gm) || []).length;

    this.logger.debug('yarn lockfile valid', {
      version: hasYarn2Metadata ? '2+' : '1',
      entryCount
    });

    return {
      valid: true,
      entryCount
    };
  }

  /**
   * Validate pnpm lockfile (pnpm-lock.yaml)
   * @param {string} content - Lockfile content
   * @returns {Object} Validation result
   */
  validatePnpmLockfile(content) {
    // Check for lockfileVersion
    const versionMatch = content.match(/^lockfileVersion:\s*(\d+)/m);
    if (!versionMatch) {
      this.logger.debug('pnpm lockfile missing lockfileVersion');
      return {
        valid: false,
        reason: 'invalid_format',
        message: 'Missing lockfileVersion in pnpm-lock.yaml'
      };
    }

    const lockfileVersion = parseInt(versionMatch[1], 10);

    // Count dependency entries (lines starting with "  /" which are package specs)
    const entryCount = (content.match(/^  \/[^:]+:/gm) || []).length;

    this.logger.debug('pnpm lockfile valid', {
      lockfileVersion,
      entryCount
    });

    return {
      valid: true,
      lockfileVersion,
      entryCount
    };
  }

  /**
   * Get the lockfile path for a specific package manager
   * @param {string} manager - Package manager name
   * @returns {string} Full path to lockfile
   */
  getLockfilePath(manager) {
    const lockfiles = {
      'npm': 'package-lock.json',
      'yarn': 'yarn.lock',
      'pnpm': 'pnpm-lock.yaml'
    };
    return path.join(this.cwd, lockfiles[manager] || 'package-lock.json');
  }
}

module.exports = LockfileValidator;
