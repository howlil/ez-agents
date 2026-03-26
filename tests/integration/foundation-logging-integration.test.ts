import { fileURLToPath } from 'node:url';


import * as fs from 'fs';
import * as path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_MODULES = [
  'bin/lib/state.ts',
  'bin/lib/init.ts',
  'bin/lib/commands.ts',
  'bin/lib/core.ts',
  'bin/lib/phase.ts',
  'bin/lib/verify.ts',
];

const LOG03_CRITICAL_MODULES = [
  'bin/lib/commands.ts',
  'bin/lib/phase.ts',
];

function assertCatchBlocksLogged(content: string, relPath: string) {
  const catches = [...content.matchAll(/catch\s*\(\s*[^)]*\)\s*\{([\s\S]*?)\n\s*\}/g)];
  for (const match of catches) {
    const body = match[1];
    expect(/logger\.(warn|error)\(/.test(body)).toBeTruthy() // `${relPath} has catch(err block without logger.warn/error`
    );
  }
}

test('foundation modules do not use silent catch blocks', () => {
  for (const relPath of TARGET_MODULES) {
    const fullPath = path.join(__dirname, '..', '..', relPath);
    const content = fs.readFileSync(fullPath, 'utf-8');
    expect(!/catch\s*\{\s*\}/g.test(content)).toBeTruthy() // `${relPath} still contains silent catch {}`;
  }
});

test('LOG-03 critical module list explicitly includes commands and phase', () => {
  expect(TARGET_MODULES.includes('bin/lib/commands.ts')).toBeTruthy() // 'commands.ts must stay in silent-catch scan list';
  expect(TARGET_MODULES.includes('bin/lib/phase.ts')).toBeTruthy() // 'phase.ts must stay in silent-catch scan list';
});

test('foundation modules route catch paths to logger.warn/error', () => {
  for (const relPath of TARGET_MODULES) {
    const fullPath = path.join(__dirname, '..', '..', relPath);
    const content = fs.readFileSync(fullPath, 'utf-8');

    const hasCatch = /catch\s*\(/.test(content);
    if (!hasCatch) continue;

    assertCatchBlocksLogged(content, relPath);
  }
});

test('LOG-03 critical modules have logged catch(err) handlers', () => {
  for (const relPath of LOG03_CRITICAL_MODULES) {
    const fullPath = path.join(__dirname, '..', '..', relPath);
    const content = fs.readFileSync(fullPath, 'utf-8');
    assertCatchBlocksLogged(content, relPath);
  }
});
