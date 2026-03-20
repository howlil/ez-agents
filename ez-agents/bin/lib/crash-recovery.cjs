'use strict';

/**
 * EZ Crash Recovery — PID-stamped lock file management
 * Detects orphaned operations and enables safe concurrent execution gates.
 * Usage:
 *   const CrashRecovery = require('./crash-recovery.cjs');
 *   const cr = new CrashRecovery(cwd);
 *   cr.acquire('phase-30-plan');
 *   // ... later ...
 *   cr.release('phase-30-plan');
 */

const fs = require('fs');
const path = require('path');
const Logger = require('./logger.cjs');
const logger = new Logger();

const HEARTBEAT_INTERVAL_MS = 10000;
const STALE_HEARTBEAT_MS = 60000;

/**
 * Check if a process is alive by sending signal 0.
 * @param {number} pid
 * @returns {boolean}
 */
function isProcessAlive(pid) {
  try {
    process.kill(Number(pid), 0);
    return true;
  } catch (e) {
    if (e.code === 'ESRCH') return false; // No such process
    if (e.code === 'EPERM') return true;  // Process exists, no permission
    return false;
  }
}

class CrashRecovery {
  /**
   * @param {string} cwd - Root directory containing .planning/
   */
  constructor(cwd) {
    this.cwd = cwd || process.cwd();
    this.locksDir = path.join(this.cwd, '.planning', 'locks');
    this._intervals = {};
    this._exitHandlers = {};
  }

  /**
   * Sanitize an operation name to be a safe file name component.
   * @param {string} operation
   * @returns {string}
   */
  slugifyOperation(operation) {
    return String(operation).replace(/[^a-zA-Z0-9-_]/g, '_');
  }

  /**
   * Return the full path to the lock file for an operation.
   * @param {string} operation
   * @returns {string}
   */
  getLockPath(operation) {
    return path.join(this.locksDir, this.slugifyOperation(operation) + '.lock.json');
  }

  /**
   * Acquire a lock for the given operation.
   * Creates a PID-stamped JSON lock file and starts a heartbeat interval.
   * @param {string} operation
   */
  acquire(operation) {
    if (!fs.existsSync(this.locksDir)) {
      fs.mkdirSync(this.locksDir, { recursive: true });
    }

    const lockPath = this.getLockPath(operation);
    const now = new Date().toISOString();
    const data = { pid: process.pid, started: now, heartbeat: now, operation };
    fs.writeFileSync(lockPath, JSON.stringify(data, null, 2), 'utf8');
    logger.debug('Lock acquired: ' + operation);

    // Heartbeat interval — keeps heartbeat timestamp fresh every 10s
    const intervalId = setInterval(() => {
      try {
        if (fs.existsSync(lockPath)) {
          const current = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
          current.heartbeat = new Date().toISOString();
          fs.writeFileSync(lockPath, JSON.stringify(current, null, 2), 'utf8');
        }
      } catch (e) {
        // Ignore heartbeat write errors (process may be exiting)
      }
    }, HEARTBEAT_INTERVAL_MS);

    // Allow process to exit naturally even with active interval
    if (intervalId.unref) intervalId.unref();
    this._intervals[operation] = intervalId;

    // Release on process exit to avoid orphaned lock files
    const exitHandler = () => this.release(operation);
    this._exitHandlers[operation] = exitHandler;
    process.on('exit', exitHandler);
  }

  /**
   * Check whether a lock is orphaned (process is dead or heartbeat is stale).
   * @param {string} operation
   * @returns {boolean}
   */
  isOrphan(operation) {
    const lockPath = this.getLockPath(operation);
    if (!fs.existsSync(lockPath)) return false;

    let data;
    try {
      data = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    } catch (e) {
      return true; // Corrupt lock file treated as orphan
    }

    if (!isProcessAlive(data.pid)) return true;

    // Stale heartbeat check — lock is orphaned if heartbeat is too old
    const heartbeatAge = Date.now() - new Date(data.heartbeat).getTime();
    if (heartbeatAge > STALE_HEARTBEAT_MS) return true;

    return false;
  }

  /**
   * Release a lock for the given operation.
   * Clears the heartbeat interval and removes the lock file.
   * @param {string} operation
   */
  release(operation) {
    if (this._intervals[operation]) {
      clearInterval(this._intervals[operation]);
      delete this._intervals[operation];
    }

    if (this._exitHandlers[operation]) {
      process.off('exit', this._exitHandlers[operation]);
      delete this._exitHandlers[operation];
    }

    const lockPath = this.getLockPath(operation);
    if (fs.existsSync(lockPath)) {
      try {
        fs.unlinkSync(lockPath);
      } catch (e) {
        // Ignore unlink errors (file may already be removed)
      }
    }

    logger.debug('Lock released: ' + operation);
  }

  /**
   * Return a list of operation slugs whose lock files are orphaned.
   * @returns {string[]}
   */
  listOrphans() {
    if (!fs.existsSync(this.locksDir)) return [];
    return fs.readdirSync(this.locksDir)
      .filter(f => f.endsWith('.lock.json'))
      .map(f => f.replace(/\.lock\.json$/, ''))
      .filter(op => this.isOrphan(op));
  }
}

module.exports = CrashRecovery;
