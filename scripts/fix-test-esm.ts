#!/usr/bin/env node
/**
 * Codemod: Fix test file imports for ESM + Vitest
 * 
 * Changes:
 * 1. Replace require('node:test') with vitest imports
 * 2. Replace require() assertions with vitest assertions
 * 3. Ensure all relative imports have .js extension
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const testsDir = join(__dirname, '..', 'tests');

function getAllTestFiles(dir) {
  let results = [];
  const items = readdirSync(dir);

  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      results = results.concat(getAllTestFiles(fullPath));
    } else if (item.endsWith('.test.ts')) {
      results.push(fullPath);
    }
  }

  return results;
}

function fixImports(content) {
  let result = content;

  // 1. Replace require('node:test') with vitest imports
  result = result.replace(
    /const\s*\{\s*test,\s*describe,\s*beforeEach,\s*afterEach\s*\}\s*=\s*require\(['"]node:test['"]\);?/g,
    ''
  );
  
  result = result.replace(
    /const\s*\{\s*test,\s*describe\s*\}\s*=\s*require\(['"]node:test['"]\);?/g,
    ''
  );

  // 2. Replace require('node:assert') with vitest expect
  result = result.replace(
    /import\s+assert\s+from\s+['"]node:assert['"];?/g,
    ''
  );

  // 3. Add vitest imports if not present
  if (result.includes('describe(') || result.includes('it(') || result.includes('expect(')) {
    if (!result.includes("from 'vitest'") && !result.includes('from "vitest"')) {
      // Add vitest import after existing imports
      const importMatch = result.match(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?\n/);
      if (importMatch) {
        result = result.replace(
          importMatch[0],
          `import { describe, it, expect, beforeEach, afterEach } from 'vitest';\n${importMatch[0]}`
        );
      } else {
        // Add at the beginning
        result = `import { describe, it, expect, beforeEach, afterEach } from 'vitest';\n\n${result}`;
      }
    }
  }

  // 4. Fix require() calls for modules (convert to import)
  const requireMatches = result.matchAll(/const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\);?/g);
  for (const match of requireMatches) {
    const [, varName, modulePath] = match;
    if (modulePath.startsWith('.') || modulePath.startsWith('..')) {
      // Relative import - convert to ESM
      const hasJsExtension = modulePath.endsWith('.js') || modulePath.endsWith('.ts');
      const fixedPath = hasJsExtension ? modulePath : `${modulePath}.js`;
      result = result.replace(
        match[0],
        `import { ${varName} } from '${fixedPath}';`
      );
    }
  }

  // 5. Add .js extension to relative imports that don't have it
  result = result.replace(
    /(import\s+[\s\S]*?from\s+['"](\.\/|\.\.\/)[^'"]+?)(['"])/g,
    (match, prefix, relativePath, quote) => {
      if (match.includes('node:') || match.endsWith('.js"') || match.endsWith(".js'")) {
        return match;
      }
      // Skip if it's a directory import or has already .js
      if (match.includes('/')) {
        return `${prefix}.js${quote}`;
      }
      return match;
    }
  );

  // 6. Fix assert.equal/strictEqual/deepStrictEqual to expect().toBe/toEqual
  result = result.replace(/assert\.equal\(([^,]+),\s*([^)]+)\)/g, 'expect($1).toBe($2)');
  result = result.replace(/assert\.strictEqual\(([^,]+),\s*([^)]+)\)/g, 'expect($1).toBe($2)');
  result = result.replace(/assert\.deepStrictEqual\(([^,]+),\s*([^)]+)\)/g, 'expect($1).toEqual($2)');
  result = result.replace(/assert\.ok\(([^)]+)\)/g, 'expect($1).toBeTruthy()');
  result = result.replace(/assert\.throws\(([^)]+)\)/g, 'expect(() => $1).toThrow()');

  return result;
}

function fixFile(filePath) {
  try {
    let content = readFileSync(filePath, 'utf-8');
    const original = content;
    
    content = fixImports(content);
    
    if (content !== original) {
      writeFileSync(filePath, content, 'utf-8');
      console.log(`✓ Fixed: ${filePath}`);
      return true;
    } else {
      console.log(`  No changes: ${filePath}`);
      return false;
    }
  } catch (err) {
    console.error(`✗ Error processing ${filePath}:`, err.message);
    return false;
  }
}

// Main
const testFiles = getAllTestFiles(testsDir);
console.log(`Found ${testFiles.length} test files\n`);

let fixed = 0;
for (const file of testFiles) {
  if (fixFile(file)) {
    fixed++;
  }
}

console.log(`\n✅ Fixed ${fixed}/${testFiles.length} files`);
