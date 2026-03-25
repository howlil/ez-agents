#!/usr/bin/env node

/**
 * Test File Cleanup Script
 *
 * Removes duplicate/malformed imports in converted test files
 * Usage: node scripts/cleanup-test-imports.ts [directory]
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Clean up malformed imports in a test file
 * @param filePath - Path to the test file
 * @returns True if file was modified
 */
function cleanupFile(filePath: string): boolean {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const original = content;

    // Remove malformed duplicate imports: "const X = import ..." followed by proper import
    content = content.replace(/const\s+\{[^}]+\}\s*=\s*import\s+\{[^}]+\}\s+from\s+['"][^'"]+['"];?/g, '');
    content = content.replace(/const\s+\{\s*runEzTools,\s*createTempProject,\s*cleanup\s*\}\s*=\s*import\s+\{[^}]+\}\s+from\s+['"][^'"]+['"];?/g, '');
    content = content.replace(/const\s+\{\s*createTempProject,\s*cleanup\s*\}\s*=\s*import\s+\{[^}]+\}\s+from\s+['"][^'"]+['"];?/g, '');
    content = content.replace(/const\s+\{\s*createTempDir,\s*cleanupTempDir\s*\}\s*=\s*import\s+\{[^}]+\}\s+from\s+['"][^'"]+['"];?/g, '');
    content = content.replace(/const\s+\{\s*test\s*\}\s*=\s*import\s+\{[^}]+\}\s+from\s+['"][^'"]+['"];?/g, '');
    content = content.replace(/const\s+\{\s*runEzTools,\s*createTempProject,\s*createTempGitProject,\s*cleanup\s*\}\s*=\s*import\s+\{[^}]+\}\s+from\s+['"][^'"]+['"];?/g, '');

    // Remove any remaining "const X = import" patterns
    content = content.replace(/const\s+\w+\s*=\s*import\s+\w+\s+from\s+['"][^'"]+['"];?/g, '');

    // Fix specific pattern: "const { X } = import { ... } from" - remove entire line
    content = content.replace(/const\s+\{[^}]*\}\s*=\s*import[^;]*;?\s*\n/g, '\n');

    // Clean up multiple blank lines
    content = content.replace(/\n{3,}/g, '\n\n');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`✓ Cleaned: ${path.basename(filePath)}`);
      return true;
    } else {
      return false;
    }
  } catch (err) {
    const error = err as Error;
    console.error(`✗ Failed: ${path.basename(filePath)} - ${error.message}`);
    return false;
  }
}

/**
 * Find all test files in directory
 * @param dir - Directory to search
 * @returns Array of test file paths
 */
function findTestFiles(dir: string): string[] {
  const files: string[] = [];

  function walk(currentDir: string): void {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          walk(fullPath);
        }
      } else if (entry.isFile() && entry.name.endsWith('.test.ts')) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

// Main execution
const targetDir = process.argv[2] || path.join(__dirname, '..', 'tests');

console.log(`\n=== Test File Cleanup ===`);
console.log(`Scanning: ${targetDir}\n`);

const files = findTestFiles(targetDir);
console.log(`Found ${files.length} test files to clean\n`);

let cleaned = 0;

for (const file of files) {
  if (cleanupFile(file)) {
    cleaned++;
  }
}

console.log(`\n=== Summary ===`);
console.log(`Cleaned: ${cleaned}`);
console.log(`Unchanged: ${files.length - cleaned}`);
