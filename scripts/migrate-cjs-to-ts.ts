#!/usr/bin/env node

/**
 * Migration Helper Script
 *
 * This script helps migrate .cjs files to .ts files by:
 * 1. Converting require() to import
 * 2. Converting module.exports to export
 * 3. Adding basic TypeScript types
 *
 * Usage: node scripts/migrate-cjs-to-ts.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface MigrationResult {
  success: boolean;
  file: string;
  error?: string;
}

const FILES_TO_MIGRATE = [
  'assistant-adapter.cjs',
  'auth.cjs',
  'bdd-validator.cjs',
  'commands.cjs',
  'config.cjs',
  'content-scanner.cjs',
  'cost-alerts.cjs',
  'cost-tracker.cjs',
  'discussion-synthesizer.cjs',
  'health-check.cjs',
  'init.cjs',
  'lock-logger.cjs',
  'log-rotation.cjs',
  'memory-compression.cjs',
  'model-provider.cjs',
  'project-reporter.cjs',
  'release-validator.cjs',
  'template.cjs',
  'tier-manager.cjs',
  'url-fetch.cjs',
  'verify.cjs',
];

const LIB_DIR = path.join(__dirname, '..', 'bin', 'lib');

/**
 * Convert CommonJS to ESM imports
 * @param content - File content
 * @returns Content with converted imports
 */
export function convertImports(content: string): string {
  // Convert require statements to imports
  content = content.replace(
    /const\s+(\w+)\s*=\s*require\(['"]\.\/([\w-]+)\.cjs['"]\);/g,
    "import $1 from './$2.js';"
  );

  content = content.replace(
    /const\s+\{\s*([^}]+)\s*\}\s*=\s*require\(['"]\.\/([\w-]+)\.cjs['"]\);/g,
    "import { $1 } from './$2.js';"
  );

  // Handle destructured imports with renaming
  content = content.replace(
    /const\s+\{\s*defaultLogger:\s*(\w+)\s*\}\s*=\s*require\(['"]\.\/([\w-]+)\.cjs['"]\);/g,
    "import { defaultLogger as $1 } from './$2.js';"
  );

  return content;
}

/**
 * Convert module.exports to export statements
 * @param content - File content
 * @returns Content with converted exports
 */
export function convertExports(content: string): string {
  // Convert module.exports = { ... } to export { ... }
  const exportMatch = content.match(/module\.exports\s*=\s*\{([^}]+)\};/s);
  if (exportMatch) {
    const exports = exportMatch[1].trim();
    content = content.replace(
      /module\.exports\s*=\s*\{[^}]+\};/s,
      `export { ${exports} };`
    );
  }

  // Convert module.exports.X = Y to export { Y as X } or export const X = Y
  content = content.replace(
    /module\.exports\.(\w+)\s*=\s*(\w+);/g,
    'export { $2 as $1 };'
  );

  return content;
}

/**
 * Add JSDoc type annotations for common patterns
 * @param content - File content
 * @returns Content with basic type annotations
 */
export function addBasicTypes(content: string): string {
  // Add type annotations for function parameters where obvious
  content = content.replace(
    /function\s+(\w+)\s*\(([^)]*)\)/g,
    (match, name, params) => {
      // This is a basic placeholder - real migration would need more sophisticated parsing
      return `function ${name}(${params})`;
    }
  );

  return content;
}

/**
 * Process a single file
 * @param filePath - Path to the .cjs file
 * @returns Converted content
 */
export function processFile(filePath: string): string {
  const content = fs.readFileSync(filePath, 'utf-8');

  let result = content;
  result = convertImports(result);
  result = convertExports(result);
  result = addBasicTypes(result);

  return result;
}

/**
 * Main migration function
 * @returns Array of migration results
 */
export function migrate(): MigrationResult[] {
  const results: MigrationResult[] = [];

  console.log('Starting migration...\n');

  for (const file of FILES_TO_MIGRATE) {
    const cjsPath = path.join(LIB_DIR, file);
    const tsPath = cjsPath.replace('.cjs', '.ts');

    if (!fs.existsSync(cjsPath)) {
      console.log(`⚠️  Skipping ${file} - file not found`);
      results.push({ success: false, file, error: 'File not found' });
      continue;
    }

    if (fs.existsSync(tsPath)) {
      console.log(`⚠️  Skipping ${file} - TypeScript version already exists`);
      results.push({ success: false, file, error: 'Already exists' });
      continue;
    }

    try {
      const result = processFile(cjsPath);
      fs.writeFileSync(tsPath, result, 'utf-8');
      console.log(`✓ Migrated ${file} -> ${path.basename(tsPath)}`);
      results.push({ success: true, file });
    } catch (err) {
      const error = err as Error;
      console.error(`✗ Error migrating ${file}: ${error.message}`);
      results.push({ success: false, file, error: error.message });
    }
  }

  console.log('\nMigration complete!');
  return results;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate();
}
