/**
 * Recovery & Backup Module
 */

export { RecoveryManager } from './recovery-manager.js';
export type { BackupOptions, BackupMetadata, VerificationResult } from './recovery-manager.js';

export { BackupService } from './backup-service.js';
export type { BackupResult, FileInfo, ManifestFileEntry, BackupManifest, BackupInfo, RetentionSettings } from './backup-service.js';

export { CrashRecovery } from './crash-recovery.js';
export type { LockData, LockStatus, ActiveLock } from './crash-recovery.js';
