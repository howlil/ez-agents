#!/usr/bin/env node
// Cross-platform test runner — resolves test file globs via Node
// instead of relying on shell expansion (which fails on Windows PowerShell/cmd).
// Propagates NODE_V8_COVERAGE so c8 collects coverage from the child process.
'use strict';

const { readdirSync, statSync } = require('fs');
const { join } = require('path');
const { execFileSync } = require('child_process');

function getAllTestFiles(dir, baseDir = dir) {
  let results = [];
  const items = readdirSync(dir);
  
  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      results = results.concat(getAllTestFiles(fullPath, baseDir));
    } else if (item.endsWith('.test.ts') || item.endsWith('.test.cjs')) {
      results.push(fullPath.replace(/\\/g, '/'));
    }
  }
  
  return results.sort();
}

const testDir = join(__dirname, '..', 'tests');
const files = getAllTestFiles(testDir);

if (files.length === 0) {
  console.error('No test files found in tests/');
  process.exit(1);
}

try {
  execFileSync(process.execPath, ['--test', ...files], {
    stdio: 'inherit',
    env: { ...process.env },
  });
} catch (err) {
  process.exit(err.status || 1);
}
