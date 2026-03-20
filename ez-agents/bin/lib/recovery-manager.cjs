/**
 * Recovery Manager — Disaster recovery orchestration layer
 *
 * High-level recovery operations coordinating BackupService
 * and other recovery components.
 */

const fs = require('fs');
const path = require('path');
const BackupService = require('./backup-service.cjs');
const Logger = require('./logger.cjs');

class RecoveryManager {
  /**
   * Create a RecoveryManager instance
   * @param {string} cwd - Working directory (repo root)
   * @param {object} options - Options (logger instance, etc.)
   */
  constructor(cwd, options = {}) {
    this.cwd = cwd || process.cwd();
    this.logger = options.logger || new Logger();
    this.backupService = new BackupService(cwd, options);
    this.backupsDir = path.join(this.cwd, '.planning', 'recovery', 'backups');
  }

  /**
   * Create a backup with optional verification
   * @param {object} options - Backup options
   * @param {string} options.label - Backup label
   * @param {boolean} options.verify - Verify after creation
   * @returns {object} Backup result
   */
  backup({ label = 'manual', verify = false } = {}) {
    this.logger.info('Starting backup', { label });
    const result = this.backupService.createBackup({ label, verify });
    this.logger.info('Backup complete', { backup_id: result.backup_id });
    // Normalize to snake_case for CLI consistency
    return {
      ...result,
      backup_dir: result.backupDir,
      files_count: result.fileCount,
    };
  }

  /**
   * List all available backups
   * @returns {array} Array of backup metadata
   */
  listBackups() {
    if (!fs.existsSync(this.backupsDir)) {
      return [];
    }

    const backups = fs
      .readdirSync(this.backupsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => {
        const manifestPath = path.join(this.backupsDir, d.name, 'manifest.json');
        let manifest = null;
        if (fs.existsSync(manifestPath)) {
          manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        }
        return {
          backup_id: d.name,
          created_at: manifest?.created_at,
          commit_sha: manifest?.commit_sha,
          files_count: manifest?.files?.length || 0,
          manifest,
        };
      })
      .sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
      });

    return backups;
  }

  /**
   * Verify a backup by ID or path
   * @param {string} backupIdOrPath - Backup ID or path
   * @returns {object} Verification result
   */
  verifyBackup(backupIdOrPath) {
    let backupDir = backupIdOrPath;

    // If it's a backup ID (not a full path), construct the path
    if (!path.isAbsolute(backupIdOrPath) && !backupIdOrPath.includes('..')) {
      backupDir = path.join(this.backupsDir, backupIdOrPath);
    }

    if (!fs.existsSync(backupDir)) {
      throw new Error(`Backup not found: ${backupIdOrPath}`);
    }

    const result = this.backupService.verifyBackup(backupDir);
    this.logger.info('Backup verified', { backup_id: backupIdOrPath });
    return result;
  }
}

module.exports = RecoveryManager;
