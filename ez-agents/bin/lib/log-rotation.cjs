#!/usr/bin/env node

/**
 * Log Rotation Utility
 * 
 * Automatically deletes EZ Agents logs older than 7 days to prevent git spam.
 * Run this weekly or add to CI/CD cleanup job.
 * 
 * Usage: node ez-agents/bin/lib/log-rotation.cjs [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(process.cwd(), '.planning', 'logs');
const MAX_AGE_DAYS = 7;
const DRY_RUN = process.argv.includes('--dry-run');

function rotateLogs() {
  if (!fs.existsSync(LOGS_DIR)) {
    console.log('Logs directory not found:', LOGS_DIR);
    return;
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - MAX_AGE_DAYS);

  const files = fs.readdirSync(LOGS_DIR);
  const logFiles = files.filter(f => f.endsWith('.log'));
  
  let deleted = 0;
  let kept = 0;
  let totalSize = 0;

  logFiles.forEach(file => {
    const filePath = path.join(LOGS_DIR, file);
    const stats = fs.statSync(filePath);
    
    if (stats.mtime < cutoff) {
      if (DRY_RUN) {
        console.log(`[DRY-RUN] Would delete: ${file} (${formatBytes(stats.size)})`);
      } else {
        fs.unlinkSync(filePath);
        console.log(`Deleted: ${file}`);
      }
      deleted++;
      totalSize += stats.size;
    } else {
      kept++;
    }
  });

  console.log(`\n${DRY_RUN ? '[DRY-RUN] ' : ''}Log Rotation Complete`);
  console.log(`  Deleted: ${deleted} files (${formatBytes(totalSize)})`);
  console.log(`  Kept: ${kept} files (last ${MAX_AGE_DAYS} days)`);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Run if called directly
if (require.main === module) {
  rotateLogs();
}

module.exports = { rotateLogs };
