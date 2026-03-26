#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

const files = glob.sync('tests/**/*.test.ts', { cwd: process.cwd() });

files.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  let content = fs.readFileSync(fullPath, 'utf-8');
  let changed = false;

  // Fix missing describe import and extra spaces
  const patterns = [
    {
      regex: /import \{ test, beforeEach, afterEach  \} from 'node:test';/g,
      replacement: 'import { test, describe, beforeEach, afterEach } from \'node:test\';'
    },
    {
      regex: /import \{ test, describe, beforeEach, afterEach  \} from 'node:test';/g,
      replacement: 'import { test, describe, beforeEach, afterEach } from \'node:test\';'
    },
    {
      regex: /import \{ test, describe, beforeEach, afterEach  \\} from 'node:test';/g,
      replacement: 'import { test, describe, beforeEach, afterEach } from \'node:test\';'
    }
  ];

  patterns.forEach(({ regex, replacement }) => {
    if (regex.test(content)) {
      content = content.replace(regex, replacement);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log('Fixed:', file);
  }
});

console.log('Done!');
