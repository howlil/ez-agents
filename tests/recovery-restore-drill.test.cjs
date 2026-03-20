/**
 * EZ Tools Tests - Restore Service and Drill Automation
 *
 * Tests for RestoreService covering restore to temp, drill execution,
 * and drill report persistence.
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { createTempGitProject, cleanup } = require('./helpers.cjs');
const BackupService = require('../ez-agents/bin/lib/backup-service.cjs');
const RestoreService = require('../ez-agents/bin/lib/restore-service.cjs');

// ─────────────────────────────────────────────────────────────────────────────
// RestoreService tests
// ─────────────────────────────────────────────────────────────────────────────

describe('RestoreService', () => {
  let tmpDir;
  let backupService;
  let restoreService;

  beforeEach(() => {
    tmpDir = createTempGitProject();
    
    // Create required files
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, '.planning', 'PROJECT.md'), '# Project\n');
    fs.writeFileSync(path.join(tmpDir, '.planning', 'STATE.md'), '# State\n');
    fs.writeFileSync(path.join(tmpDir, 'package.json'), '{"name": "test"}\n');

    backupService = new BackupService(tmpDir);
    restoreService = new RestoreService(tmpDir);
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  // ─── RECOVER-02: Restore drill ─────────────────────────────────────────────

  test('RestoreService class is exported', () => {
    assert.ok(RestoreService, 'RestoreService should be exported');
    assert.strictEqual(typeof RestoreService, 'function', 'RestoreService should be a class/function');
  });

  test('restoreToTemp restores backup to temp directory without mutating live repo', () => {
    // Create a backup first
    const backupResult = backupService.createBackup({ label: 'restore-test' });
    
    // Use the full backupDir path for restore (BackupService returns backupDir camelCase)
    const restoreResult = restoreService.restoreToTemp(backupResult.backupDir);
    
    assert.ok(restoreResult.restored_to, 'should return restored_to path');
    assert.ok(fs.existsSync(restoreResult.restored_to), 'temp restore directory should exist');
    
    // Verify temp directory is in os.tmpdir()
    const tmpDirReal = fs.realpathSync(os.tmpdir());
    const restoredReal = fs.realpathSync(restoreResult.restored_to);
    assert.ok(
      restoredReal.startsWith(tmpDirReal),
      `restored_to should be in temp directory, got ${restoreResult.restored_to}`
    );
    
    // Verify files were restored
    const restoredManifest = path.join(restoreResult.restored_to, 'manifest.json');
    assert.ok(fs.existsSync(restoredManifest), 'manifest.json should be restored');
    
    // Verify live repo was not mutated (backups dir should still exist)
    const backupsDir = path.join(tmpDir, '.planning', 'recovery', 'backups');
    assert.ok(fs.existsSync(backupsDir), 'live repo backups should not be mutated');
  });

  test('runDrill executes full drill with health validation', () => {
    // Create a backup
    const backupResult = backupService.createBackup({ label: 'drill-test' });
    
    // Run drill using backupDir (camelCase from BackupService)
    const drillResult = restoreService.runDrill(backupResult.backupDir);
    
    assert.ok(drillResult.drill_id, 'drill should have drill_id');
    assert.ok(drillResult.status, 'drill should have status');
    assert.ok(drillResult.completed_at, 'drill should have completed_at');
    assert.ok(Array.isArray(drillResult.checks), 'drill should have checks array');
    
    // Verify drill report was created
    const drillsDir = path.join(tmpDir, '.planning', 'recovery', 'drills');
    assert.ok(fs.existsSync(drillsDir), 'drills directory should exist');
    
    const drillFiles = fs.readdirSync(drillsDir);
    assert.ok(drillFiles.length > 0, 'at least one drill report should exist');
  });

  test('recordDrillResult persists drill report to .planning/recovery/drills/', () => {
    const testResult = {
      drill_id: 'drill-test-123',
      backup_id: 'backup-test',
      status: 'success',
      checks: [{ name: 'test', passed: true }],
      completed_at: new Date().toISOString(),
    };
    
    restoreService.recordDrillResult(testResult);
    
    // Verify report was created
    const drillsDir = path.join(tmpDir, '.planning', 'recovery', 'drills');
    assert.ok(fs.existsSync(drillsDir), 'drills directory should exist');
    
    const drillFiles = fs.readdirSync(drillsDir);
    assert.ok(drillFiles.length > 0, 'drill report should be created');
    
    // Verify report content
    const latestDrill = drillFiles.sort().pop();
    const reportPath = path.join(drillsDir, latestDrill);
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    
    assert.strictEqual(report.drill_id, testResult.drill_id);
    assert.strictEqual(report.backup_id, testResult.backup_id);
    assert.strictEqual(report.status, testResult.status);
  });

  test('drill report contains required fields: status, checks, completed_at, evidence', () => {
    const backupResult = backupService.createBackup({ label: 'report-test' });
    const drillResult = restoreService.runDrill(backupResult.backupDir);
    
    assert.ok(['success', 'failed', 'partial'].includes(drillResult.status), 'status should be valid');
    assert.ok(Array.isArray(drillResult.checks), 'checks should be array');
    assert.ok(drillResult.completed_at, 'completed_at should exist');
    assert.ok(drillResult.evidence_path || drillResult.restored_to, 'should have evidence location');
  });

  test('restore fails gracefully for non-existent backup', () => {
    assert.throws(
      () => restoreService.restoreToTemp('non-existent-backup'),
      /Backup not found|not exist/
    );
  });
});

describe('RestoreService integration', () => {
  let tmpDir;
  let backupService;
  let restoreService;

  beforeEach(() => {
    tmpDir = createTempGitProject();
    
    // Create required files
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, '.planning', 'PROJECT.md'), '# Project\n');
    fs.writeFileSync(path.join(tmpDir, '.planning', 'STATE.md'), '# State\n');
    fs.writeFileSync(path.join(tmpDir, 'package.json'), '{"name": "test"}\n');

    backupService = new BackupService(tmpDir);
    restoreService = new RestoreService(tmpDir);
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('full backup and restore drill workflow', () => {
    // Create backup
    const backupResult = backupService.createBackup({ label: 'full-workflow' });
    
    // Run drill using backupDir (camelCase from BackupService)
    const drillResult = restoreService.runDrill(backupResult.backupDir);
    
    // Verify drill succeeded
    assert.strictEqual(drillResult.status, 'success', 'drill should succeed');
    
    // Verify drill report exists
    const drillsDir = path.join(tmpDir, '.planning', 'recovery', 'drills');
    const drillFiles = fs.readdirSync(drillsDir);
    assert.ok(drillFiles.length > 0, 'drill report should exist');
  });
});
