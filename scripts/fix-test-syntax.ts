#!/usr/bin/env node
/**
 * Fix broken test syntax from previous conversion
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

  // Fix describe('...') => => {  -> describe('...', () => {
  content = content.replace(/describe\((['"][^'"]+['"])\)\s*=>\s*=>/g, "describe($1, () =>");
  
  // Fix describe('...') => => {  -> describe('...', () => {  (with arrow in name)
  content = content.replace(/describe\((['"][^'"]+['"])\s*=>\s*['"]\)\s*=>\s*=>/g, "describe($1 =>'), () =>");

  // Fix })( => => {  -> }) => {
  content = content.replace(/\}\)\s*=>\s*=>/g, '}) =>');
  
  // Fix })( => {  -> }) => {
  content = content.replace(/\}\)\s*=>\s*\{/g, '}) => {');

  // Fix describe('...') => {  -> describe('...', () => {
  content = content.replace(/describe\((['"][^'"]+['"])\)\s*=>\s*\{/g, "describe($1, () => {");

  // Fix })( => => {  -> }) => {
  content = content.replace(/\}\)\s*=>\s*=>/g, '}) =>');

  // Fix }); => => {  -> });  (remove invalid arrow)
  content = content.replace(/\}\)\s*;?\s*=>\s*=>/g, '});');

  // Fix }); => {  -> });  (remove invalid arrow)
  content = content.replace(/\}\)\s*;?\s*=>\s*\{/g, '});');

  // Fix .toBeTruthy() // ( => { patterns
  content = content.replace(/\.toBeTruthy\(\)\s*\/\/\s*\(\s*=>/g, ' =>');
  content = content.replace(/\.toBeTruthy\(\)\s*\/\/\s*=>/g, '');

  // Fix }); with trailing comment and toBeTruthy
  content = content.replace(/\}\)\s*\/\/\s*['"][^'"]*['"]\s*\.toBeTruthy\(\)/g, '});');
  
  // Fix .toBeTruthy() at end of line followed by semicolon
  content = content.replace(/\.toBeTruthy\(\)\s*;/g, ';');
  
  // Fix .toBeTruthy() at end of line followed by closing paren
  content = content.replace(/\.toBeTruthy\(\)\s*\)/g, ')');
  
  // Fix .toBeTruthy() at end of line followed by closing brace
  content = content.replace(/\.toBeTruthy\(\)\s*\}/g, '}');

  // Fix assert.ok with trailing comment pattern - ensure semicolon
  content = content.replace(/assert\.ok\(([^)]+)\)\s*\/\/\s*['"]([^'"]+)['"]\s*$/gm, 
    (match, expr, msg) => `assert.ok(${expr}); // ${msg}`);
  
  // Fix expect with trailing comment pattern - ensure semicolon
  content = content.replace(/expect\(([^)]+)\)\s*\/\/\s*['"]([^'"]+)['"]\s*$/gm, 
    (match, expr, msg) => `expect(${expr}); // ${msg}`);

  // Fix expect().something() // 'message' patterns - ensure semicolon before comment
  content = content.replace(/(expect\([^)]+\)\.(?:toBe|toBeTruthy|toEqual|toMatch|toBeDefined|toBeUndefined|toBeNull|toBeGreaterThan|toBeLessThan|toBeGreaterThanOrEqual|toContain|toHaveLength|toBeInstanceOf|rejects)\([^)]*\))\s*\/\/\s*['"]([^'"]+)['"]/g, 
    (match, assertion, msg) => `${assertion}; // ${msg}`);
    
  // Fix expect().something() without args // 'message' patterns
  content = content.replace(/(expect\([^)]+\)\.(?:toBeTruthy|toBeDefined|toBeUndefined|toBeNull)\(\))\s*\/\/\s*['"]([^'"]+)['"]/g, 
    (match, assertion, msg) => `${assertion}; // ${msg}`);

  // Fix malformed array in expect
  content = content.replace(/expect\(\[(['"][^'"]+['"])\)\.toBeTruthy\(\)\s*;\s*\/\/\s*([^,\]]+)/g, 
    (match, firstElem, comment) => `expect([${firstElem}, ${comment}]).toBeTruthy()`);

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  }
  
  return false;
}

const testFiles = getAllTestFiles(testsDir);
let fixedCount = 0;

console.log(`Fixing test syntax in ${testFiles.length} files...\n`);

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
