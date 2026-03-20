/**
 * Restore Service — Backup restore and drill automation
 *
 * Restores backups to temp directories for safe drill execution
 * without mutating live repository state.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { safePlanningWriteSync } = require('./planning-write.cjs');
const Logger = require('./logger.cjs');

class RestoreService {
  /**
   * Create a RestoreService instance
   * @param {string} cwd - Working directory (repo root)
   * @param {object} options - Options (logger instance, etc.)
   */
  constructor(cwd, options = {}) {
    this.cwd = cwd || process.cwd();
    this.logger = options.logger || new Logger();
    this.backupsDir = path.join(this.cwd, '.planning', 'recovery', 'backups');
    this.drillsDir = path.join(this.cwd, '.planning', 'recovery', 'drills');
  }

  /**
   * Get backup manifest
   * @param {string} backupIdOrPath - Backup ID or path
   * @returns {object} Backup manifest
   */
  _getBackupManifest(backupIdOrPath) {
    let backupDir = backupIdOrPath;
    
    // If it looks like a backup ID (not a full path), construct the path
    if (!path.isAbsolute(backupIdOrPath) && !backupIdOrPath.includes('..')) {
      backupDir = path.join(this.backupsDir, backupIdOrPath);
    }
    
    const manifestPath = path.join(backupDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      throw new Error(`Backup not found: ${backupIdOrPath} (looked in ${backupDir})`);
    }
    
    return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  }

  /**
   * Copy file recursively
   * @param {string} src - Source path
   * @param {string} dest - Destination path
   */
  _copyFile(src, dest) {
    const destDir = path.dirname(dest);
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(src, dest);
  }

  /**
   * Copy directory recursively
   * @param {string} srcDir - Source directory
   * @param {string} destDir - Destination directory
   */
  _copyDirectory(srcDir, destDir) {
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(srcDir, entry.name);
      const destPath = path.join(destDir, entry.name);
      
      if (entry.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        this._copyDirectory(srcPath, destPath);
      } else {
        this._copyFile(srcPath, destPath);
      }
    }
  }

  /**
   * Restore backup to temp directory
   * @param {string} backupIdOrPath - Backup ID or path
   * @param {object} options - Restore options
   * @param {boolean} options.cleanup - Clean up temp after restore (default: false)
   * @returns {object} Restore result with restored_to path
   */
  restoreToTemp(backupIdOrPath, options = {}) {
    const { cleanup = false } = options;
    const manifest = this._getBackupManifest(backupIdOrPath);
    
    this.logger.info('Starting restore to temp', { backup_id: manifest.backup_id });
    
    // Determine backup directory
    let backupDir = backupIdOrPath;
    if (!path.isAbsolute(backupIdOrPath)) {
      backupDir = path.join(this.backupsDir, backupIdOrPath);
    }
    
    // Create temp directory
    const tempBase = fs.mkdtempSync(path.join(os.tmpdir(), 'ez-restore-'));
    const restoreDir = path.join(tempBase, 'restored');
    fs.mkdirSync(restoreDir, { recursive: true });
    
    // Copy all files from backup to restore dir
    this._copyDirectory(backupDir, restoreDir);
    
    this.logger.info('Restore complete', { 
      backup_id: manifest.backup_id,
      restored_to: restoreDir 
    });
    
    return {
      restored_to: restoreDir,
      backup_id: manifest.backup_id,
      temp_base: tempBase,
      cleanup,
    };
  }

  /**
   * Run full restore drill with health validation
   * @param {string} backupIdOrPath - Backup ID or path
   * @param {object} options - Drill options
   * @param {boolean} options.cleanup - Clean up temp after drill (default: true)
   * @returns {object} Drill result with status, checks, evidence
   */
  runDrill(backupIdOrPath, options = {}) {
    const { cleanup = true } = options;
    const manifest = this._getBackupManifest(backupIdOrPath);
    const drillId = `drill-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    
    this.logger.info('Starting restore drill', { backup_id: manifest.backup_id, drill_id: drillId });
    
    const checks = [];
    let status = 'success';
    let error = null;
    
    try {
      // Step 1: Restore to temp
      const restoreResult = this.restoreToTemp(backupIdOrPath, { cleanup });
      checks.push({
        name: 'restore_to_temp',
        passed: true,
        details: `Restored to ${restoreResult.restored_to}`,
      });
      
      // Step 2: Verify manifest exists
      const manifestPath = path.join(restoreResult.restored_to, 'manifest.json');
      const manifestExists = fs.existsSync(manifestPath);
      checks.push({
        name: 'manifest_exists',
        passed: manifestExists,
        details: manifestExists ? 'Manifest found' : 'Manifest missing',
      });
      
      if (!manifestExists) {
        status = 'failed';
      } else {
        // Step 3: Verify file count matches
        const restoredManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        const expectedFiles = restoredManifest.files?.length || 0;
        
        let actualFiles = 0;
        const walkDir = (dir) => {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.isFile()) {
              actualFiles++;
            } else if (entry.isDirectory()) {
              walkDir(path.join(dir, entry.name));
            }
          }
        };
        walkDir(restoreResult.restored_to);
        
        // Subtract 1 for manifest.json itself
        const fileCountMatch = actualFiles - 1 === expectedFiles;
        checks.push({
          name: 'file_count_match',
          passed: fileCountMatch,
          details: `Expected ${expectedFiles}, got ${actualFiles - 1}`,
        });
        
        if (!fileCountMatch) {
          status = 'partial';
        }
      }
      
      // Step 4: Record drill result
      const drillResult = {
        drill_id: drillId,
        backup_id: manifest.backup_id,
        status,
        checks,
        completed_at: new Date().toISOString(),
        evidence_path: restoreResult.restored_to,
        error,
      };
      
      this.recordDrillResult(drillResult);
      
      // Cleanup if requested
      if (cleanup && restoreResult.temp_base) {
        try {
          fs.rmSync(restoreResult.temp_base, { recursive: true, force: true });
        } catch (cleanupErr) {
          this.logger.warn('Temp cleanup failed', { error: cleanupErr.message });
        }
      }
      
      this.logger.info('Drill complete', { drill_id: drillId, status });
      
      return drillResult;
      
    } catch (err) {
      status = 'failed';
      error = err.message;
      
      checks.push({
        name: 'drill_execution',
        passed: false,
        details: error,
      });
      
      const drillResult = {
        drill_id: drillId,
        backup_id: manifest.backup_id,
        status,
        checks,
        completed_at: new Date().toISOString(),
        error,
      };
      
      this.recordDrillResult(drillResult);
      this.logger.error('Drill failed', { drill_id: drillId, error });
      
      return drillResult;
    }
  }

  /**
   * Record drill result to persistent storage
   * @param {object} result - Drill result
   */
  recordDrillResult(result) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(this.drillsDir, `${timestamp}.json`);
    
    // Ensure drills directory exists
    fs.mkdirSync(this.drillsDir, { recursive: true });
    
    safePlanningWriteSync(
      reportPath,
      JSON.stringify(result, null, 2)
    );
    
    this.logger.info('Drill result recorded', { 
      drill_id: result.drill_id,
      report_path: reportPath 
    });
  }

  /**
   * List all drill reports
   * @returns {array} Array of drill metadata
   */
  listDrills() {
    if (!fs.existsSync(this.drillsDir)) {
      return [];
    }
    
    const drills = fs
      .readdirSync(this.drillsDir, { withFileTypes: true })
      .filter((d) => d.isFile() && d.name.endsWith('.json'))
      .map((d) => {
        const reportPath = path.join(this.drillsDir, d.name);
        let report = null;
        try {
          report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
        } catch {
          // Skip malformed reports
        }
        return {
          report_file: d.name,
          drill_id: report?.drill_id,
          backup_id: report?.backup_id,
          status: report?.status,
          completed_at: report?.completed_at,
          report,
        };
      })
      .sort((a, b) => {
        const timeA = a.completed_at ? new Date(a.completed_at).getTime() : 0;
        const timeB = b.completed_at ? new Date(b.completed_at).getTime() : 0;
        return timeB - timeA;
      });
    
    return drills;
  }
}

module.exports = RestoreService;
