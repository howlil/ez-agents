/**
 * BackupService — Repository backup automation for EZ Agents
 *
 * Creates snapshot backups of configured paths with manifest.json and SHA-256 checksums.
 * Backups are stored in .planning/recovery/backups/<backup-id>/
 *
 * Usage:
 *   import BackupService from './backup-service.js';
 *   const backupService = new BackupService(cwd, options);
 *   const result = backupService.createBackup({ label: 'manual', scope: [...] });
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { execSync } from 'child_process';
import { safePlanningWriteSync } from './planning-write.js';
import { defaultLogger as logger } from './logger.js';

// ─── Type Definitions ────────────────────────────────────────────────────────

export interface FileInfo {
  originalPath: string;
  relativePath: string;
  content: string;
  sha256: string;
  size_bytes: number;
}

export interface ManifestFileEntry {
  path: string;
  sha256: string;
  size_bytes: number;
}

export interface BackupManifest {
  backup_id: string;
  created_at: string;
  scope: string[];
  commit_sha: string | null;
  files: ManifestFileEntry[];
}

export interface BackupOptions {
  label?: string;
  scope?: string[];
  verify?: boolean;
}

export interface BackupResult {
  backup_id: string;
  backupDir: string;
  manifest: BackupManifest;
  fileCount: number;
  verify: VerificationResult | null;
}

export interface VerificationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  manifest?: BackupManifest;
}

export interface BackupInfo {
  name: string;
  path: string;
  manifest: BackupManifest | null;
  createdAt: string;
}

export interface RetentionSettings {
  local_backups: number;
  drill_reports: number;
}

export interface BackupServiceOptions {
  scope?: string[];
  retention?: Partial<RetentionSettings>;
  logger?: typeof logger;
}

// ─── Constants ───────────────────────────────────────────────────────────────

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
const DEFAULT_RETENTION: RetentionSettings = {
  local_backups: 10,
  drill_reports: 12
};

// ─── BackupService Class ─────────────────────────────────────────────────────

export class BackupService {
  private cwd: string;
  private scope: string[];
  private retention: RetentionSettings;
  private backupsDir: string;

  /**
   * Create a BackupService instance
   * @param cwd - Working directory (project root)
   * @param options - Configuration options
   */
  constructor(cwd: string, options: BackupServiceOptions = {}) {
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
   * @returns Commit SHA or null if not in git repo
   */
  private _getCommitSha(): string | null {
    try {
      const sha = execSync('git rev-parse HEAD', {
        cwd: this.cwd,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim();
      return sha;
    } catch (err) {
      const error = err as Error & { code?: string };
      logger.warn('Could not get git commit SHA', { error: error.message });
      return null;
    }
  }

  /**
   * Calculate SHA-256 hash of file content
   * @param content - File content
   * @returns SHA-256 hash
   */
  private _calculateSha256(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Get file size in bytes
   * @param filePath - File path
   * @returns File size
   */
  private _getFileSize(filePath: string): number {
    return fs.statSync(filePath).size;
  }

  /**
   * Generate unique backup ID
   * @returns Backup ID
   */
  private _generateBackupId(): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    return `${timestamp}-${random}`;
  }

  /**
   * Collect files from backup scope
   * @param scope - Paths to include
   * @returns Array of file info objects
   */
  private _collectFiles(scope: string[]): FileInfo[] {
    const files: FileInfo[] = [];

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
          const error = err as Error;
          logger.warn('Failed to read file', { path: scopePath, error: error.message });
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
   * @param dirPath - Directory path
   * @param basePath - Base path for relative calculation
   * @returns Array of file info objects
   */
  private _walkDirectory(dirPath: string, basePath: string): FileInfo[] {
    const files: FileInfo[] = [];

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
            const error = err as Error;
            logger.warn('Failed to read file during directory walk', {
              path: fullPath,
              error: error.message
            });
          }
        }
      }
    } catch (err) {
      const error = err as Error;
      logger.warn('Failed to walk directory', { path: dirPath, error: error.message });
    }

    return files;
  }

  /**
   * Create a backup
   * @param options - Backup options
   * @returns Backup result with backupDir and manifest
   */
  createBackup(options: BackupOptions = {}): BackupResult {
    const { label = 'manual', scope, verify = false } = options;
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
    const manifest: BackupManifest = {
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
    let verifyResult: VerificationResult | null = null;
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
   * @param backupDir - Backup directory path
   * @returns Verification result
   */
  verifyBackup(backupDir: string): VerificationResult {
    const manifestPath = path.join(backupDir, 'manifest.json');

    if (!fs.existsSync(manifestPath)) {
      const error = 'Manifest not found';
      logger.error('Backup verification failed', { error });
      return {
        valid: false,
        errors: [error],
        warnings: []
      };
    }

    let manifest: BackupManifest;
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as BackupManifest;
    } catch (err) {
      const error = err as Error;
      const errorMsg = `Failed to parse manifest: ${error.message}`;
      logger.error('Backup verification failed', { error: errorMsg });
      return {
        valid: false,
        errors: [errorMsg],
        warnings: []
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

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
        const error = err as Error;
        errors.push(`Failed to read ${file.path}: ${error.message}`);
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
   * @param maxBackups - Maximum number of backups to keep
   * @returns Prune result
   */
  pruneBackups(maxBackups: number): { pruned: string[] } {
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
    const pruned: string[] = [];

    if (toPrune > 0) {
      for (let i = 0; i < toPrune; i++) {
        const backup = backups[i];
        if (!backup) continue;
        try {
          fs.rmSync(backup.path, { recursive: true, force: true });
          pruned.push(backup.name);
          logger.info('Pruned old backup', { name: backup.name });
        } catch (err) {
          const error = err as Error;
          logger.error('Failed to prune backup', { name: backup.name, error: error.message });
        }
      }
    }

    return { pruned };
  }

  /**
   * List all backups
   * @returns Array of backup info objects
   */
  listBackups(): BackupInfo[] {
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
        let manifest: BackupManifest | null = null;

        if (fs.existsSync(manifestPath)) {
          try {
            manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as BackupManifest;
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
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Newest first
  }
}

// Default export for backward compatibility
export default BackupService;
