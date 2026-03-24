/**
 * Deploy Rollback — Rolls back to previous version
 * Supports vercel rollback, fly rollback, and git revert
 */

const { execSync } = require('child_process');

class DeployRollback {
  constructor(cwd) {
    this.cwd = cwd || process.cwd();
  }

  /**
   * Rollback deployment to previous version
   * @param {string} platform - Platform name
   * @returns {Object} Rollback result
   */
  async rollback(platform) {
    try {
      if (platform === 'vercel') {
        return this.rollbackVercel();
      } else if (platform === 'fly.io') {
        return this.rollbackFly();
      } else {
        return this.rollbackGit();
      }
    } catch (e) {
      throw new Error(`Rollback failed: ${e.message}`);
    }
  }

  /**
   * Rollback Vercel deployment
   * @returns {Object} Result
   */
  rollbackVercel() {
    execSync('vercel rollback', { stdio: 'inherit' });
    return { success: true, platform: 'vercel' };
  }

  /**
   * Rollback Fly.io deployment
   * @returns {Object} Result
   */
  rollbackFly() {
    execSync('fly rollback', { stdio: 'inherit' });
    return { success: true, platform: 'fly.io' };
  }

  /**
   * Generic git revert rollback
   * @returns {Object} Result
   */
  rollbackGit() {
    execSync('git revert HEAD --no-edit', { cwd: this.cwd, stdio: 'inherit' });
    execSync('git push origin main', { cwd: this.cwd, stdio: 'inherit' });
    return { success: true, platform: 'git' };
  }
}

/**
 * Rollback deployment
 * @param {string} platform - Platform name
 * @param {string} cwd - Working directory
 * @returns {Object} Rollback result
 */
async function rollback(platform, cwd) {
  const rollbacker = new DeployRollback(cwd);
  return rollbacker.rollback(platform);
}

module.exports = { DeployRollback, rollback };
