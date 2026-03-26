#!/usr/bin/env node
/**
 * Fix test imports - convert node:test and node:assert to vitest
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testsDir = path.join(__dirname, '..', 'tests');

function getAllTestFiles(dir: string): string[] {
  let results: string[] = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      results = results.concat(getAllTestFiles(fullPath));
    } else if (item.endsWith('.test.ts')) {
      results.push(fullPath);
    }
  }

  return results;
}

function fixTestFile(filePath: string): boolean {
  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;

  // Remove node:test imports
  content = content.replace(/import\s*\{[^}]*\}\s*from\s*['"]node:test['"];?\s*\n/g, '\n');
  content = content.replace(/import\s*test\s*from\s*['"]node:test['"];?\s*\n/g, '\n');
  
  // Remove node:assert imports  
  content = content.replace(/import\s*assert\s*from\s*['"]node:assert['"];?\s*\n/g, '\n');
  
  // Replace assert.strictEqual with expect().toBe()
  content = content.replace(/assert\.strictEqual\(([^,]+),\s*([^,]+)(,\s*([^)]+))?\)/g, (match, actual, expected, _, msg) => {
    const message = msg ? `, ${msg.trim()}` : '';
    return `expect(${actual.trim()}).toBe(${expected.trim()}${message})`;
  });
  
  // Replace assert.ok with expect().toBeTruthy()
  content = content.replace(/assert\.ok\(([^,]+)(,\s*([^)]+))?\)/g, (match, expr, _, msg) => {
    if (msg && msg.trim()) {
      return `expect(${expr.trim()}).toBeTruthy() // ${msg.trim()}`;
    }
    return `expect(${expr.trim()}).toBeTruthy()`;
  });
  
  // Replace assert.match with expect().toMatch()
  content = content.replace(/assert\.match\(([^,]+),\s*([^,]+)(,\s*([^)]+))?\)/g, (match, actual, regex, _, msg) => {
    const message = msg ? `, ${msg.trim()}` : '';
    return `expect(${actual.trim()}).toMatch(${regex.trim()}${message})`;
  });
  
  // Replace assert.fail with fail()
  content = content.replace(/assert\.fail\(([^)]+)\)/g, 'fail($1)');
  
  // Replace assert.rejects with expect().rejects.toThrow()
  content = content.replace(/await\s+assert\.rejects\(\s*async\s*\(\)\s*=>\s*\{([^}]+)\},\s*([^)]+)\)/g, (match, body, matcher) => {
    return `await expect(async () => {${body}}).rejects.toThrow(${matcher})`;
  });
  content = content.replace(/assert\.rejects\(\s*async\s*\(\)\s*=>\s*\{([^}]+)\},\s*\/(.+)\/\)/g, (match, body, regex) => {
    return `expect(async () => {${body}}).rejects.toMatchObject({ message: expect.stringMatching(/${regex}/) })`;
  });
  
  // Remove process.exit and preceding console.log
  content = content.replace(/\n\s*console\.log\([^)]*\);\s*\n\s*process\.exit\([^)]*\);?/g, '');
  content = content.replace(/\n\s*process\.exit\([^)]*\);?/g, '');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  }
  
  return false;
}

const testFiles = getAllTestFiles(testsDir);
let fixedCount = 0;

console.log(`Processing ${testFiles.length} test files...\n`);

for (const file of testFiles) {
  const relativePath = path.relative(process.cwd(), file);
  try {
    if (fixTestFile(file)) {
      console.log(`✓ Fixed: ${relativePath}`);
      fixedCount++;
    }
  } catch (err) {
    console.error(`✗ Error fixing ${relativePath}:`, err instanceof Error ? err.message : err);
  }
}

console.log(`\nDone! Fixed ${fixedCount}/${testFiles.length} files.`);
