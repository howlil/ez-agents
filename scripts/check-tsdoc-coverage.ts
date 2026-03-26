/**
 * TSDoc Coverage Check Script - Validates TSDoc comment coverage
 *
 * Uses TypeDoc to parse source files and calculate TSDoc coverage percentage.
 * Warns (but doesn't fail) if coverage is below 80%.
 *
 * Usage: npm run check:tsdoc
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import * as path from 'path';
import * as fs from 'fs';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const COVERAGE_THRESHOLD = 80;

interface Reflection {
  kind: number;
  kindString: string;
  name: string;
  comment?: { summary?: unknown };
  children?: Reflection[];
}

interface TypeDocJSON {
  children?: Reflection[];
  reflections?: Reflection[];
}

function countSymbols(reflection: Reflection): { total: number; documented: number } {
  let total = 0;
  let documented = 0;

  // Count this symbol
  if (['Class', 'Interface', 'Function', 'Method', 'Property', 'Variable'].includes(reflection.kindString)) {
    total++;
    if (reflection.comment || reflection.name.startsWith('/**')) {
      documented++;
    }
  }

  // Recursively count children
  if (reflection.children) {
    for (const child of reflection.children) {
      const childCount = countSymbols(child);
      total += childCount.total;
      documented += childCount.documented;
    }
  }

  return { total, documented };
}

async function main() {
  console.log('📝 Checking TSDoc coverage...\n');

  try {
    // Run TypeDoc with JSON output
    const { stdout } = await execAsync(
      `npx typedoc --json ${path.join(rootDir, 'typedoc-output.json')} --entryPoints bin/lib/index.ts`,
      { cwd: rootDir }
    );

    // Read the JSON output
    const jsonPath = path.join(rootDir, 'typedoc-output.json');
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
    const data: TypeDocJSON = JSON.parse(jsonContent);

    // Clean up temp file
    fs.unlinkSync(jsonPath);

    // Count symbols
    let total = 0;
    let documented = 0;

    if (data.children) {
      for (const child of data.children) {
        const count = countSymbols(child);
        total += count.total;
        documented += count.documented;
      }
    }

    if (total === 0) {
      console.log('⚠️  No symbols found to analyze');
      process.exit(0);
    }

    const coverage = ((documented / total) * 100).toFixed(2);
    const coverageNum = parseFloat(coverage);

    console.log(`TSDoc Coverage Report:`);
    console.log(`  Total symbols: ${total}`);
    console.log(`  Documented: ${documented}`);
    console.log(`  Coverage: ${coverage}%`);
    console.log(`  Threshold: ${COVERAGE_THRESHOLD}% (warning only)\n`);

    if (coverageNum < COVERAGE_THRESHOLD) {
      console.log(`⚠️  Warning: TSDoc coverage (${coverage}%) is below threshold (${COVERAGE_THRESHOLD}%)`);
      console.log(`💡 Tip: Add TSDoc comments to public APIs using /** ... */ format`);
      console.log(`   Include @param, @returns, @throws, and @example tags where applicable.\n`);
    } else {
      console.log(`✅ TSDoc coverage meets threshold!`);
    }

    // Always exit 0 (warning only, not failure)
    process.exit(0);
  } catch (error) {
    console.error('Error running TSDoc coverage check:', error);
    // Don't fail on errors, just warn
    console.log('⚠️  Could not calculate TSDoc coverage. This is a warning only.\n');
    process.exit(0);
  }
}

main();
