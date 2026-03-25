/**
 * Recovery Manager — Disaster recovery orchestration layer
 *
 * High-level recovery operations coordinating BackupService
 * and other recovery components.
 */

import * as fs from 'fs';
import * as path from 'path';
import { BackupService, BackupResult, BackupServiceOptions } from './backup-service.js';
import { defaultLogger as logger } from './logger.js';

// ─── Type Definitions ────────────────────────────────────────────────────────

export interface BackupOptions {
  label?: string;
  verify?: boolean;
}

export interface BackupMetadata {
  backup_id: string;
  created_at?: string | null;
  commit_sha?: string | null;
  files_count: number;
  manifest?: Record<string, unknown> | null;
}

export interface VerificationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

// ─── RecoveryManager Class ───────────────────────────────────────────────────

export class RecoveryManager {
  private cwd: string;
  private logger: typeof logger;
  private backupService: BackupService;
  private backupsDir: string;

  /**
   * Create a RecoveryManager instance
   * @param cwd - Working directory (repo root)
   * @param options - Options (logger instance, etc.)
   */
  constructor(cwd: string, options: BackupServiceOptions = {}) {
    this.cwd = cwd || process.cwd();
    this.logger = options.logger || logger;
    this.backupService = new BackupService(cwd, options);
    this.backupsDir = path.join(this.cwd, '.planning', 'recovery', 'backups');
  }

  /**
   * Create a backup with optional verification
   * @param options - Backup options
   * @returns Backup result
   */
  backup(options: BackupOptions = {}): BackupResult {
    const { label = 'manual', verify = false } = options;
    this.logger.info('Starting backup', { label });
    const result = this.backupService.createBackup({ label, verify });
    this.logger.info('Backup complete', { backup_id: result.backup_id });
    return result;
  }

  /**
   * List all available backups
   * @returns Array of backup metadata
   */
  listBackups(): BackupMetadata[] {
    if (!fs.existsSync(this.backupsDir)) {
      return [];
    }

    const backups = fs
      .readdirSync(this.backupsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => {
        const manifestPath = path.join(this.backupsDir, d.name, 'manifest.json');
        let manifest: Record<string, unknown> | null = null;
        if (fs.existsSync(manifestPath)) {
          manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        }
        return {
          backup_id: d.name,
          created_at: manifest?.created_at as string | undefined,
          commit_sha: manifest?.commit_sha as string | undefined,
          files_count: (manifest?.files as unknown[])?.length || 0,
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
   * @param backupIdOrPath - Backup ID or path
   * @returns Verification result
   */
  verifyBackup(backupIdOrPath: string): VerificationResult {
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

// Default export for backward compatibility
export default RecoveryManager;
