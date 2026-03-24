/**
 * BackupService — Repository backup automation for EZ Agents
 *
 * Creates snapshot backups of configured paths with manifest.json and SHA-256 checksums.
 * Backups are stored in .planning/recovery/backups/<backup-id>/
 *
 * Usage:
 *   const BackupService = require('./backup-service.cjs');
 *   const backupService = new BackupService(cwd, options);
 *   const result = backupService.createBackup({ label: 'manual', scope: [...] });
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const { safePlanningWriteSync } = require('./planning-write.cjs');
const Logger = require('./logger.cjs');

const logger = new Logger();

/**
 * Default backup scope for EZ Agents repository
 */
const DEFAULT_BACKUP_SCOPE = [
  '.planning',
  '.github/workflows',
  'commands',
  'ez-agents/bin/lib',
  'package.json',
  'package-lock.json'
];

/**
 * Default retention settings
 */
const DEFAULT_RETENTION = {
  local_backups: 10,
  drill_reports: 12
};

class BackupService {
  /**
   * Create a BackupService instance
   * @param {string} cwd - Working directory (project root)
   * @param {Object} options - Configuration options
   * @param {string[]} options.scope - Override default backup scope
   * @param {Object} options.retention - Retention settings
   */
  constructor(cwd, options = {}) {
    this.cwd = cwd || process.cwd();
    this.scope = options.scope || DEFAULT_BACKUP_SCOPE;
    this.retention = {
      ...DEFAULT_RETENTION,
      ...(options.retention || {})
    };
    this.backupsDir = path.join(this.cwd, '.planning', 'recovery', 'backups');
  }

  /**
   * Get current git commit SHA
   * @returns {string|null} - Commit SHA or null if not in git repo
   */
  _getCommitSha() {
    try {
      const sha = execSync('git rev-parse HEAD', {
        cwd: this.cwd,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim();
      return sha;
    } catch (err) {
      logger.warn('Could not get git commit SHA', { error: err.message });
      return null;
    }
  }

  /**
   * Calculate SHA-256 hash of file content
   * @param {string} content - File content
   * @returns {string} - SHA-256 hash
   */
  _calculateSha256(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Get file size in bytes
   * @param {string} filePath - File path
   * @returns {number} - File size
   */
  _getFileSize(filePath) {
    return fs.statSync(filePath).size;
  }

  /**
   * Generate unique backup ID
   * @returns {string} - Backup ID
   */
  _generateBackupId() {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    return `${timestamp}-${random}`;
  }

  /**
   * Collect files from backup scope
   * @param {string[]} scope - Paths to include
   * @returns {Object[]} - Array of file info objects
   */
  _collectFiles(scope) {
    const files = [];

    for (const scopePath of scope) {
      const fullPath = path.join(this.cwd, scopePath);

      if (!fs.existsSync(fullPath)) {
        logger.debug('Skipping missing path', { path: scopePath });
        continue;
      }

      const stat = fs.statSync(fullPath);

      if (stat.isFile()) {
        // Single file
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          files.push({
            originalPath: fullPath,
            relativePath: scopePath,
            content,
            sha256: this._calculateSha256(content),
            size_bytes: this._getFileSize(fullPath)
          });
        } catch (err) {
          logger.warn('Failed to read file', { path: scopePath, error: err.message });
        }
      } else if (stat.isDirectory()) {
        // Directory - walk recursively
        const dirFiles = this._walkDirectory(fullPath, scopePath);
        files.push(...dirFiles);
      }
    }

    return files;
  }

  /**
   * Walk directory recursively
   * @param {string} dirPath - Directory path
   * @param {string} basePath - Base path for relative calculation
   * @returns {Object[]} - Array of file info objects
   */
  _walkDirectory(dirPath, basePath) {
    const files = [];

    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        // Skip node_modules and other common exclusions
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
          // But allow .planning, .github
          if (!['.planning', '.github'].includes(entry.name) && entry.isDirectory()) {
            continue;
          }
        }

        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.join(basePath, path.relative(path.join(this.cwd, basePath), fullPath));

        if (entry.isDirectory()) {
          files.push(...this._walkDirectory(fullPath, basePath));
        } else if (entry.isFile()) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            files.push({
              originalPath: fullPath,
              relativePath: relativePath.replace(/^[\\/]/, ''),
              content,
              sha256: this._calculateSha256(content),
              size_bytes: this._getFileSize(fullPath)
            });
          } catch (err) {
            logger.warn('Failed to read file during directory walk', {
              path: fullPath,
              error: err.message
            });
          }
        }
      }
    } catch (err) {
      logger.warn('Failed to walk directory', { path: dirPath, error: err.message });
    }

    return files;
  }

  /**
   * Create a backup
   * @param {Object} options - Backup options
   * @param {string} options.label - Backup label (default: 'manual')
   * @param {string[]} options.scope - Override default scope
   * @param {boolean} options.verify - Verify backup after creation
   * @returns {Object} - Backup result with backupDir and manifest
   */
  createBackup({ label = 'manual', scope, verify = false } = {}) {
    const backupScope = scope || this.scope;
    const backupId = this._generateBackupId();
    const backupDir = path.join(this.backupsDir, `${Date.now()}-${label}`);
    const commitSha = this._getCommitSha();

    logger.info('Creating backup', { backupId, label, scope: backupScope });

    // Ensure backups directory exists
    fs.mkdirSync(this.backupsDir, { recursive: true });

    // Collect files from scope
    const files = this._collectFiles(backupScope);

    if (files.length === 0) {
      logger.warn('No files found in backup scope', { scope: backupScope });
    }

    // Create backup directory structure and copy files
    for (const file of files) {
      const backupPath = path.join(backupDir, file.relativePath);
      const backupDirPath = path.dirname(backupPath);

      fs.mkdirSync(backupDirPath, { recursive: true });
      fs.writeFileSync(backupPath, file.content, 'utf-8');
    }

    // Create manifest
    const manifest = {
      backup_id: backupId,
      created_at: new Date().toISOString(),
      scope: backupScope,
      commit_sha: commitSha,
      files: files.map(f => ({
        path: f.relativePath,
        sha256: f.sha256,
        size_bytes: f.size_bytes
      }))
    };

    // Write manifest atomically
    const manifestPath = path.join(backupDir, 'manifest.json');
    safePlanningWriteSync(manifestPath, JSON.stringify(manifest, null, 2));

    logger.info('Backup created', {
      backupId,
      backupDir,
      fileCount: files.length
    });

    // Verify if requested
    let verifyResult = null;
    if (verify) {
      verifyResult = this.verifyBackup(backupDir);
    }

    // Prune old backups
    this.pruneBackups(this.retention.local_backups);

    return {
      backup_id: backupId,
      backupDir,
      manifest,
      fileCount: files.length,
      verify: verifyResult
    };
  }

  /**
   * Verify a backup by checking checksums
   * @param {string} backupDir - Backup directory path
   * @returns {Object} - Verification result
   */
  verifyBackup(backupDir) {
    const manifestPath = path.join(backupDir, 'manifest.json');

    if (!fs.existsSync(manifestPath)) {
      const error = 'Manifest not found';
      logger.error('Backup verification failed', { error });
      return {
        valid: false,
        errors: [error]
      };
    }

    let manifest;
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    } catch (err) {
      const error = `Failed to parse manifest: ${err.message}`;
      logger.error('Backup verification failed', { error });
      return {
        valid: false,
        errors: [error]
      };
    }

    const errors = [];
    const warnings = [];

    for (const file of manifest.files) {
      const filePath = path.join(backupDir, file.path);

      if (!fs.existsSync(filePath)) {
        errors.push(`Missing file: ${file.path}`);
        continue;
      }

      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const actualSha256 = this._calculateSha256(content);

        if (actualSha256 !== file.sha256) {
          errors.push(`Checksum mismatch for ${file.path}: expected ${file.sha256}, got ${actualSha256}`);
        }
      } catch (err) {
        errors.push(`Failed to read ${file.path}: ${err.message}`);
      }
    }

    const valid = errors.length === 0;

    if (valid) {
      logger.info('Backup verification passed', { backupDir });
    } else {
      logger.error('Backup verification failed', { errors });
    }

    return {
      valid,
      errors,
      warnings,
      manifest
    };
  }

  /**
   * Prune old backups to respect retention policy
   * @param {number} maxBackups - Maximum number of backups to keep
   * @returns {Object} - Prune result
   */
  pruneBackups(maxBackups) {
    if (!fs.existsSync(this.backupsDir)) {
      return { pruned: [] };
    }

    const backups = fs.readdirSync(this.backupsDir)
      .filter(name => {
        const fullPath = path.join(this.backupsDir, name);
        return fs.statSync(fullPath).isDirectory();
      })
      .map(name => ({
        name,
        path: path.join(this.backupsDir, name),
        mtime: fs.statSync(path.join(this.backupsDir, name)).mtimeMs
      }))
      .sort((a, b) => a.mtime - b.mtime); // Oldest first

    const toPrune = backups.length - maxBackups;
    const pruned = [];

    if (toPrune > 0) {
      for (let i = 0; i < toPrune; i++) {
        const backup = backups[i];
        try {
          fs.rmSync(backup.path, { recursive: true, force: true });
          pruned.push(backup.name);
          logger.info('Pruned old backup', { name: backup.name });
        } catch (err) {
          logger.error('Failed to prune backup', { name: backup.name, error: err.message });
        }
      }
    }

    return { pruned };
  }

  /**
   * List all backups
   * @returns {Object[]} - Array of backup info objects
   */
  listBackups() {
    if (!fs.existsSync(this.backupsDir)) {
      return [];
    }

    return fs.readdirSync(this.backupsDir)
      .filter(name => {
        const fullPath = path.join(this.backupsDir, name);
        return fs.statSync(fullPath).isDirectory();
      })
      .map(name => {
        const backupPath = path.join(this.backupsDir, name);
        const manifestPath = path.join(backupPath, 'manifest.json');
        let manifest = null;

        if (fs.existsSync(manifestPath)) {
          try {
            manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
          } catch (err) {
            // Ignore manifest parse errors
          }
        }

        return {
          name,
          path: backupPath,
          manifest,
          createdAt: manifest?.created_at || fs.statSync(backupPath).mtime.toISOString()
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Newest first
  }
}

module.exports = BackupService;
