#!/usr/bin/env node

/**
 * Test File Import Fixer Script
 *
 * Fixes malformed imports in converted test files
 * Usage: node scripts/fix-test-imports.ts [directory]
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Fix malformed imports in a test file
 * @param filePath - Path to the test file
 * @returns True if file was modified
 */
function fixFile(filePath: string): boolean {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    // Fix malformed default imports: "const X = import x from '...'" -> "import X from '...'"
    content = content.replace(/const\s+(\w+)\s*=\s*import\s+\S+\s+from\s+['"]([^'"]+)['"];?/g, (match, name, modulePath) => {
      modified = true;
      return `import ${name} from '${modulePath}';`;
    });

    // Fix malformed named imports: "const { X } = import x from '...'" -> "import { X } from '...'"
    content = content.replace(/const\s+\{([^}]+)\}\s*=\s*import\s+\S+\s+from\s+['"]([^'"]+)['"];?/g, (match, names, modulePath) => {
      modified = true;
      return `import {${names}} from '${modulePath}';`;
    });

    // Fix mixed imports: "const X = import x from '...';\nconst { Y } = import x from '...';" -> "import X, { Y } from '...'"
    // This is handled by the above patterns separately

    // Fix require statements that weren't converted
    content = content.replace(/const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\);/g, (match, name, modulePath) => {
      if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
        modified = true;
        // Check if it's a named export or default
        return `import ${name} from '${modulePath.replace(/\.cjs$/, '.js')}';`;
      }
      return match; // Keep node built-ins as require for now
    });

    // Fix destructured require statements
    content = content.replace(/const\s+\{([^}]+)\}\s*=\s*require\(['"]([^'"]+)['"]\);/g, (match, names, modulePath) => {
      if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
        modified = true;
        return `import {${names}} from '${modulePath.replace(/\.cjs$/, '.js')}';`;
      }
      return match;
    });

    // Update .cjs extensions to .js for TypeScript module resolution
    content = content.replace(/from\s+['"]([^'"]*)\.cjs['"]/g, (_match, p1: string) => {
      modified = true;
      return `from '${p1}.js'`;
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`✓ Fixed: ${path.basename(filePath)}`);
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

console.log(`\n=== Test File Import Fixer ===`);
console.log(`Scanning: ${targetDir}\n`);

const files = findTestFiles(targetDir);
console.log(`Found ${files.length} test files to fix\n`);

let fixed = 0;

for (const file of files) {
  if (fixFile(file)) {
    fixed++;
  }
}

console.log(`\n=== Summary ===`);
console.log(`Fixed: ${fixed}`);
console.log(`Unchanged: ${files.length - fixed}`);
