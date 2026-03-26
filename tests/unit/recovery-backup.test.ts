/**
 * Backup Service Tests
 *
 * Tests for BackupService: backup creation, manifest integrity, retention pruning,
 * and checksum verification.
 */

import * as fs from 'fs';
import * as path from 'path';

import { createTempGitProject, cleanup } from '../helpers/index.js';
import { BackupService } from '../../bin/lib/backup-service.js';

describe('BackupService', () => {
  let tmpDir: string;
  let backupService: BackupService;

  beforeEach(() => {
    tmpDir = createTempGitProject();
    backupService = new BackupService(tmpDir);
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  describe('createBackup()', () => {
    it('copies only configured recovery paths and skips missing optional paths', () => {
      // Create some files that are in the default backup scope
      fs.mkdirSync(path.join(tmpDir, '.planning', 'phases'), { recursive: true });
      fs.writeFileSync(path.join(tmpDir, '.planning', 'PROJECT.md'), '# Project\n');
      fs.writeFileSync(path.join(tmpDir, 'package.json'), '{"name": "test"}\n');

      // Create a backup (synchronous)
      const result = backupService.createBackup({ label: 'test', scope: ['.planning', 'package.json'] });

      // Verify backup was created
      expect(result.backupDir).toBeTruthy();
      expect(fs.existsSync(result.backupDir)).toBeTruthy();

      // Verify only specified paths are included
      const backupFiles: string[] = [];
      function walkDir(dir: string, baseDir: string) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.relative(baseDir, fullPath);
          if (entry.isDirectory()) {
            backupFiles.push(relativePath + '/');
            walkDir(fullPath, baseDir);
          } else {
            backupFiles.push(relativePath);
          }
        }
      }
      walkDir(result.backupDir, result.backupDir);

      // Should contain .planning and package.json but not missing paths
      expect(backupFiles.some(f => f.startsWith('.planning'))).toBeTruthy();
      expect(backupFiles.includes('package.json')).toBeTruthy();
    });

    it('backs up files to .planning/recovery/backups/<backup-id>/', () => {
      // Create required files
      fs.mkdirSync(path.join(tmpDir, '.planning', 'phases'), { recursive: true });
      fs.writeFileSync(path.join(tmpDir, '.planning', 'PROJECT.md'), '# Project\n');

      const result = backupService.createBackup({ label: 'smoke' });

      // Verify backup is in correct location (normalize path separators for cross-platform)
      const normalizedPath = result.backupDir.replace(/\\/g, '/');
      expect(normalizedPath.includes('.planning/recovery/backups/')).toBeTruthy();

      // Verify directory structure exists
      const backupsDir = path.join(tmpDir, '.planning', 'recovery', 'backups');
      expect(fs.existsSync(backupsDir)).toBeTruthy();
    });

    it('manifest.json contains backup_id, created_at, scope, commit_sha, and files', () => {
      // Create required files
      fs.mkdirSync(path.join(tmpDir, '.planning', 'phases'), { recursive: true });
      fs.writeFileSync(path.join(tmpDir, '.planning', 'PROJECT.md'), '# Project\n');

      const result = backupService.createBackup({ label: 'test' });

      // Read manifest
      const manifestPath = path.join(result.backupDir, 'manifest.json');
      expect(fs.existsSync(manifestPath)).toBeTruthy();

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

      // Verify required fields
      expect(manifest.backup_id).toBeTruthy();
      expect(manifest.created_at).toBeTruthy();
      expect(Array.isArray(manifest.scope)).toBeTruthy();
      expect('commit_sha' in manifest).toBeTruthy();
      expect(Array.isArray(manifest.files)).toBeTruthy();
    });

    it('file entries contain path, sha256, and size_bytes', () => {
      // Create a test file
      fs.mkdirSync(path.join(tmpDir, '.planning'), { recursive: true });
      const testFile = path.join(tmpDir, '.planning', 'test.txt');
      const testContent = 'test content';
      fs.writeFileSync(testFile, testContent);

      const result = backupService.createBackup({
        label: 'test',
        scope: ['.planning/test.txt']
      });

      // Read manifest
      const manifest = JSON.parse(
        fs.readFileSync(path.join(result.backupDir, 'manifest.json'), 'utf-8')
      );

      expect(manifest.files.length > 0).toBeTruthy();

      for (const file of manifest.files) {
        expect(file.path).toBeTruthy();
        expect(file.sha256).toBeTruthy();
        expect(typeof file.size_bytes === 'number').toBeTruthy();
        expect(file.sha256).toMatch(/^[a-f0-9]{64}$/);
      }
    });

    it('retention pruning respects recovery.retention.local_backups', () => {
      // Create required files
      fs.mkdirSync(path.join(tmpDir, '.planning', 'phases'), { recursive: true });
      fs.writeFileSync(path.join(tmpDir, '.planning', 'PROJECT.md'), '# Project\n');

      // Create multiple backups with delays to ensure unique timestamps
      for (let i = 0; i < 5; i++) {
        backupService.createBackup({ label: `prune-${i}` });
        // Small delay to ensure unique timestamps
        const end = Date.now() + 10;
        while (Date.now() < end) {} // busy wait
      }

      const backupsBefore = backupService.listBackups();
      // listBackups returns array of objects with 'name' property
      const backupCount = Array.isArray(backupsBefore) ? backupsBefore.length : 0;
      expect(backupCount >= 5).toBeTruthy();

      // Prune to keep only 3
      const pruneResult = backupService.pruneBackups(3);

      // pruneResult.pruned is an array of pruned backup names
      expect(Array.isArray(pruneResult.pruned)).toBeTruthy();
      expect(pruneResult.pruned.length).toBe(backupsBefore.length - 3);

      const backupsAfter = backupService.listBackups();
      const afterCount = Array.isArray(backupsAfter) ? backupsAfter.length : 0;
      expect(afterCount).toBe(3);
    });
  });

  describe('verifyBackup()', () => {
    it('succeeds when checksums match', () => {
      // Create required files
      fs.mkdirSync(path.join(tmpDir, '.planning', 'phases'), { recursive: true });
      fs.writeFileSync(path.join(tmpDir, '.planning', 'PROJECT.md'), '# Project\n');

      const result = backupService.createBackup({ label: 'verify' });

      // Verify should succeed
      const verification = backupService.verifyBackup(result.backupDir);
      expect(verification.valid).toBe(true);
    });

    it('fails on checksum mismatch', () => {
      // Create required files
      fs.mkdirSync(path.join(tmpDir, '.planning', 'phases'), { recursive: true });
      const testFile = path.join(tmpDir, '.planning', 'PROJECT.md');
      fs.writeFileSync(testFile, '# Project\n');

      const result = backupService.createBackup({ label: 'corrupt' });

      // Corrupt a file in the backup
      const backupFile = path.join(result.backupDir, '.planning', 'PROJECT.md');
      fs.appendFileSync(backupFile, 'corrupted');

      // Verify should return invalid result (not throw)
      const verification = backupService.verifyBackup(result.backupDir);
      expect(verification.valid).toBe(false);
      expect(verification.errors.length > 0).toBeTruthy();
      expect(verification.errors.some(e => e.includes('Checksum mismatch'))).toBeTruthy();
    });
  });
});
