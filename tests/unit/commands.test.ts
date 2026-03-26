/**
 * EZ Tools Tests - Commands
 */



import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { runEzTools, createTempProject, createTempGitProject, cleanup } from '../helpers.js';
import { cmdWebsearch } from '../../bin/lib/commands.js';

describe('history-digest command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('empty phases directory returns valid schema', () => {
    const result = runEzTools('history-digest', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const digest = JSON.parse(result.output);

    assert.deepStrictEqual(digest.phases, {}, 'phases should be empty object');
    assert.deepStrictEqual(digest.decisions, [], 'decisions should be empty array');
    assert.deepStrictEqual(digest.tech_stack, [], 'tech_stack should be empty array');
  });

  test('nested frontmatter fields extracted correctly', () => {
    // Create phase directory with SUMMARY containing nested frontmatter
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '01-foundation');
    fs.mkdirSync(phaseDir, { recursive: true });

    const summaryContent = `---
phase: "01"
name: "Foundation Setup"
dependency-graph:
  provides:
    - "Database schema"
    - "Auth system"
  affects:
    - "API layer"
tech-stack:
  added:
    - "prisma"
    - "jose"
patterns-established:
  - "Repository pattern"
  - "JWT auth flow"
key-decisions:
  - "Use Prisma over Drizzle"
  - "JWT in httpOnly cookies"
---

# Summary content here
`;

    fs.writeFileSync(path.join(phaseDir, '01-01-SUMMARY.md'), summaryContent);

    const result = runEzTools('history-digest', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const digest = JSON.parse(result.output);

    // Check nested dependency-graph.provides
    expect(digest.phases['01']).toBeTruthy() // 'Phase 01 should exist';
    assert.deepStrictEqual(
      digest.phases['01'].provides.sort(),
      ['Auth system', 'Database schema'],
      'provides should contain nested values'
    );

    // Check nested dependency-graph.affects
    assert.deepStrictEqual(
      digest.phases['01'].affects,
      ['API layer'],
      'affects should contain nested values'
    );

    // Check nested tech-stack.added
    assert.deepStrictEqual(
      digest.tech_stack.sort(),
      ['jose', 'prisma'],
      'tech_stack should contain nested values'
    );

    // Check patterns-established (flat array)
    assert.deepStrictEqual(
      digest.phases['01'].patterns.sort(),
      ['JWT auth flow', 'Repository pattern'],
      'patterns should be extracted'
    );

    // Check key-decisions
    expect(digest.decisions.length).toBe(2, 'Should have 2 decisions');
    expect(digest.decisions.some(d => d.decision === 'Use Prisma over Drizzle')).toBeTruthy() // 'Should contain first decision';
  });

  test('multiple phases merged into single digest', () => {
    // Create phase 01
    const phase01Dir = path.join(tmpDir, '.planning', 'phases', '01-foundation');
    fs.mkdirSync(phase01Dir, { recursive: true });
    fs.writeFileSync(
      path.join(phase01Dir, '01-01-SUMMARY.md'),
      `---
phase: "01"
name: "Foundation"
provides:
  - "Database"
patterns-established:
  - "Pattern A"
key-decisions:
  - "Decision 1"
---
`
    );

    // Create phase 02
    const phase02Dir = path.join(tmpDir, '.planning', 'phases', '02-api');
    fs.mkdirSync(phase02Dir, { recursive: true });
    fs.writeFileSync(
      path.join(phase02Dir, '02-01-SUMMARY.md'),
      `---
phase: "02"
name: "API"
provides:
  - "REST endpoints"
patterns-established:
  - "Pattern B"
key-decisions:
  - "Decision 2"
tech-stack:
  added:
    - "zod"
---
`
    );

    const result = runEzTools('history-digest', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const digest = JSON.parse(result.output);

    // Both phases present
    expect(digest.phases['01']).toBeTruthy() // 'Phase 01 should exist';
    expect(digest.phases['02']).toBeTruthy() // 'Phase 02 should exist';

    // Decisions merged
    expect(digest.decisions.length).toBe(2, 'Should have 2 decisions total');

    // Tech stack merged
    assert.deepStrictEqual(digest.tech_stack, ['zod'], 'tech_stack should have zod');
  });

  test('malformed SUMMARY.md skipped gracefully', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '01-test');
    fs.mkdirSync(phaseDir, { recursive: true });

    // Valid summary
    fs.writeFileSync(
      path.join(phaseDir, '01-01-SUMMARY.md'),
      `---
phase: "01"
provides:
  - "Valid feature"
---
`
    );

    // Malformed summary (no frontmatter)
    fs.writeFileSync(
      path.join(phaseDir, '01-02-SUMMARY.md'),
      `# Just a heading
No frontmatter here
`
    );

    // Another malformed summary (broken YAML)
    fs.writeFileSync(
      path.join(phaseDir, '01-03-SUMMARY.md'),
      `---
broken: [unclosed
---
`
    );

    const result = runEzTools('history-digest', tmpDir);
    expect(result.success).toBeTruthy() // `Command should succeed despite malformed files: ${result.error}`;

    const digest = JSON.parse(result.output);
    expect(digest.phases['01']).toBeTruthy() // 'Phase 01 should exist';
    expect(digest.phases['01'].provides.includes('Valid feature')).toBeTruthy() // 'Valid feature should be extracted';
  });

  test('flat provides field still works (backward compatibility)', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '01-test');
    fs.mkdirSync(phaseDir, { recursive: true });

    fs.writeFileSync(
      path.join(phaseDir, '01-01-SUMMARY.md'),
      `---
phase: "01"
provides:
  - "Direct provides"
---
`
    );

    const result = runEzTools('history-digest', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const digest = JSON.parse(result.output);
    assert.deepStrictEqual(
      digest.phases['01'].provides,
      ['Direct provides'],
      'Direct provides should work'
    );
  });

  test('inline array syntax supported', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '01-test');
    fs.mkdirSync(phaseDir, { recursive: true });

    fs.writeFileSync(
      path.join(phaseDir, '01-01-SUMMARY.md'),
      `---
phase: "01"
provides: [Feature A, Feature B]
patterns-established: ["Pattern X", "Pattern Y"]
---
`
    );

    const result = runEzTools('history-digest', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const digest = JSON.parse(result.output);
    assert.deepStrictEqual(
      digest.phases['01'].provides.sort(),
      ['Feature A', 'Feature B'],
      'Inline array should work'
    );
    assert.deepStrictEqual(
      digest.phases['01'].patterns.sort(),
      ['Pattern X', 'Pattern Y'],
      'Inline quoted array should work'
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// phases list command
// ─────────────────────────────────────────────────────────────────────────────


describe('summary-extract command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('missing file returns error', () => {
    const result = runEzTools('summary-extract .planning/phases/01-test/01-01-SUMMARY.md', tmpDir);
    expect(result.success).toBeTruthy() // `Command should succeed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.error).toBe('File not found', 'should report missing file');
  });

  test('extracts all fields from SUMMARY.md', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '01-foundation');
    fs.mkdirSync(phaseDir, { recursive: true });

    fs.writeFileSync(
      path.join(phaseDir, '01-01-SUMMARY.md'),
      `---
one-liner: Set up Prisma with User and Project models
key-files:
  - prisma/schema.prisma
  - src/lib/db.ts
tech-stack:
  added:
    - prisma
    - zod
patterns-established:
  - Repository pattern
  - Dependency injection
key-decisions:
  - Use Prisma over Drizzle: Better DX and ecosystem
  - Single database: Start simple, shard later
requirements-completed:
  - AUTH-01
  - AUTH-02
---

# Summary

Full summary content here.
`
    );

    const result = runEzTools('summary-extract .planning/phases/01-foundation/01-01-SUMMARY.md', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.path).toBe('.planning/phases/01-foundation/01-01-SUMMARY.md', 'path correct');
    expect(output.one_liner).toBe('Set up Prisma with User and Project models', 'one-liner extracted');
    assert.deepStrictEqual(output.key_files, ['prisma/schema.prisma', 'src/lib/db.ts'], 'key files extracted');
    assert.deepStrictEqual(output.tech_added, ['prisma', 'zod'], 'tech added extracted');
    assert.deepStrictEqual(output.patterns, ['Repository pattern', 'Dependency injection'], 'patterns extracted');
    expect(output.decisions.length).toBe(2, 'decisions extracted');
    assert.deepStrictEqual(output.requirements_completed, ['AUTH-01', 'AUTH-02'], 'requirements completed extracted');
  });

  test('selective extraction with --fields', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '01-foundation');
    fs.mkdirSync(phaseDir, { recursive: true });

    fs.writeFileSync(
      path.join(phaseDir, '01-01-SUMMARY.md'),
      `---
one-liner: Set up database
key-files:
  - prisma/schema.prisma
tech-stack:
  added:
    - prisma
patterns-established:
  - Repository pattern
key-decisions:
  - Use Prisma: Better DX
requirements-completed:
  - AUTH-01
---
`
    );

    const result = runEzTools('summary-extract .planning/phases/01-foundation/01-01-SUMMARY.md --fields one_liner,key_files,requirements_completed', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.one_liner).toBe('Set up database', 'one_liner included');
    assert.deepStrictEqual(output.key_files, ['prisma/schema.prisma'], 'key_files included');
    assert.deepStrictEqual(output.requirements_completed, ['AUTH-01'], 'requirements_completed included');
    expect(output.tech_added).toBe(undefined, 'tech_added excluded');
    expect(output.patterns).toBe(undefined, 'patterns excluded');
    expect(output.decisions).toBe(undefined, 'decisions excluded');
  });

  test('handles missing frontmatter fields gracefully', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '01-foundation');
    fs.mkdirSync(phaseDir, { recursive: true });

    fs.writeFileSync(
      path.join(phaseDir, '01-01-SUMMARY.md'),
      `---
one-liner: Minimal summary
---

# Summary
`
    );

    const result = runEzTools('summary-extract .planning/phases/01-foundation/01-01-SUMMARY.md', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.one_liner).toBe('Minimal summary', 'one-liner extracted');
    assert.deepStrictEqual(output.key_files, [], 'key_files defaults to empty');
    assert.deepStrictEqual(output.tech_added, [], 'tech_added defaults to empty');
    assert.deepStrictEqual(output.patterns, [], 'patterns defaults to empty');
    assert.deepStrictEqual(output.decisions, [], 'decisions defaults to empty');
    assert.deepStrictEqual(output.requirements_completed, [], 'requirements_completed defaults to empty');
  });

  test('parses key-decisions with rationale', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '01-foundation');
    fs.mkdirSync(phaseDir, { recursive: true });

    fs.writeFileSync(
      path.join(phaseDir, '01-01-SUMMARY.md'),
      `---
key-decisions:
  - Use Prisma: Better DX than alternatives
  - JWT tokens: Stateless auth for scalability
---
`
    );

    const result = runEzTools('summary-extract .planning/phases/01-foundation/01-01-SUMMARY.md', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.decisions[0].summary).toBe('Use Prisma', 'decision summary parsed');
    expect(output.decisions[0].rationale).toBe('Better DX than alternatives', 'decision rationale parsed');
    expect(output.decisions[1].summary).toBe('JWT tokens', 'second decision summary');
    expect(output.decisions[1].rationale).toBe('Stateless auth for scalability', 'second decision rationale');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// init commands tests
// ─────────────────────────────────────────────────────────────────────────────


describe('progress command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('renders JSON progress', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.0 MVP\n`
    );
    const p1 = path.join(tmpDir, '.planning', 'phases', '01-foundation');
    fs.mkdirSync(p1, { recursive: true });
    fs.writeFileSync(path.join(p1, '01-01-PLAN.md'), '# Plan');
    fs.writeFileSync(path.join(p1, '01-01-SUMMARY.md'), '# Done');
    fs.writeFileSync(path.join(p1, '01-02-PLAN.md'), '# Plan 2');

    const result = runEzTools('progress json', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.total_plans).toBe(2, '2 total plans');
    expect(output.total_summaries).toBe(1, '1 summary');
    expect(output.percent).toBe(50, '50%');
    expect(output.phases.length).toBe(1, '1 phase');
    expect(output.phases[0].status).toBe('In Progress', 'phase in progress');
  });

  test('renders bar format', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.0\n`
    );
    const p1 = path.join(tmpDir, '.planning', 'phases', '01-test');
    fs.mkdirSync(p1, { recursive: true });
    fs.writeFileSync(path.join(p1, '01-01-PLAN.md'), '# Plan');
    fs.writeFileSync(path.join(p1, '01-01-SUMMARY.md'), '# Done');

    const result = runEzTools('progress bar --raw', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;
    expect(result.output.includes('1/1')).toBeTruthy() // 'should include count';
    expect(result.output.includes('100%')).toBeTruthy() // 'should include 100%';
  });

  test('renders table format', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.0 MVP\n`
    );
    const p1 = path.join(tmpDir, '.planning', 'phases', '01-foundation');
    fs.mkdirSync(p1, { recursive: true });
    fs.writeFileSync(path.join(p1, '01-01-PLAN.md'), '# Plan');

    const result = runEzTools('progress table --raw', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;
    expect(result.output.includes('Phase')).toBeTruthy() // 'should have table header';
    expect(result.output.includes('foundation')).toBeTruthy() // 'should include phase name';
  });

  test('does not crash when summaries exceed plans (orphaned SUMMARY.md)', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.0 MVP\n`
    );
    const p1 = path.join(tmpDir, '.planning', 'phases', '01-foundation');
    fs.mkdirSync(p1, { recursive: true });
    // 1 plan but 2 summaries (orphaned SUMMARY.md after PLAN.md deletion)
    fs.writeFileSync(path.join(p1, '01-01-PLAN.md'), '# Plan');
    fs.writeFileSync(path.join(p1, '01-01-SUMMARY.md'), '# Done');
    fs.writeFileSync(path.join(p1, '01-02-SUMMARY.md'), '# Orphaned summary');

    // bar format - should not crash with RangeError
    const barResult = runEzTools('progress bar --raw', tmpDir);
    expect(barResult.success).toBeTruthy() // `Bar format crashed: ${barResult.error}`;
    expect(barResult.output.includes('100%')).toBeTruthy() // 'percent should be clamped to 100%';

    // table format - should not crash with RangeError
    const tableResult = runEzTools('progress table --raw', tmpDir);
    expect(tableResult.success).toBeTruthy() // `Table format crashed: ${tableResult.error}`;

    // json format - percent should be clamped
    const jsonResult = runEzTools('progress json', tmpDir);
    expect(jsonResult.success).toBeTruthy() // `JSON format crashed: ${jsonResult.error}`;
    const output = JSON.parse(jsonResult.output);
    expect(output.percent <= 100).toBeTruthy() // `percent should be <= 100 but got ${output.percent}`;
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// todo complete command
// ─────────────────────────────────────────────────────────────────────────────


describe('todo complete command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('moves todo from pending to completed', () => {
    const pendingDir = path.join(tmpDir, '.planning', 'todos', 'pending');
    fs.mkdirSync(pendingDir, { recursive: true });
    fs.writeFileSync(
      path.join(pendingDir, 'add-dark-mode.md'),
      `title: Add dark mode\narea: ui\ncreated: 2025-01-01\n`
    );

    const result = runEzTools('todo complete add-dark-mode.md', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.completed).toBe(true);

    // Verify moved
    expect(!fs.existsSync(path.join(tmpDir).toBeTruthy() // '.planning', 'todos', 'pending', 'add-dark-mode.md'),
      'should be removed from pending'
    );
    expect(fs.existsSync(path.join(tmpDir).toBeTruthy() // '.planning', 'todos', 'completed', 'add-dark-mode.md'),
      'should be in completed'
    );

    // Verify completion timestamp added
    const content = fs.readFileSync(
      path.join(tmpDir, '.planning', 'todos', 'completed', 'add-dark-mode.md'),
      'utf-8'
    );
    expect(content.startsWith('completed:')).toBeTruthy() // 'should have completed timestamp';
  });

  test('fails for nonexistent todo', () => {
    const result = runEzTools('todo complete nonexistent.md', tmpDir);
    expect(!result.success).toBeTruthy() // 'should fail';
    expect(result.error!.includes('not found')).toBeTruthy() // 'error mentions not found';
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// scaffold command
// ─────────────────────────────────────────────────────────────────────────────


describe('scaffold command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('scaffolds context file', () => {
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '03-api'), { recursive: true });

    const result = runEzTools('scaffold context --phase 3', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.created).toBe(true);

    // Verify file content
    const content = fs.readFileSync(
      path.join(tmpDir, '.planning', 'phases', '03-api', '03-CONTEXT.md'),
      'utf-8'
    );
    expect(content.includes('Phase 3')).toBeTruthy() // 'should reference phase number';
    expect(content.includes('Decisions')).toBeTruthy() // 'should have decisions section';
    expect(content.includes('Discretion Areas')).toBeTruthy() // 'should have discretion section';
  });

  test('scaffolds UAT file', () => {
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '03-api'), { recursive: true });

    const result = runEzTools('scaffold uat --phase 3', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.created).toBe(true);

    const content = fs.readFileSync(
      path.join(tmpDir, '.planning', 'phases', '03-api', '03-UAT.md'),
      'utf-8'
    );
    expect(content.includes('User Acceptance Testing')).toBeTruthy() // 'should have UAT heading';
    expect(content.includes('Test Results')).toBeTruthy() // 'should have test results section';
  });

  test('scaffolds verification file', () => {
    fs.mkdirSync(path.join(tmpDir, '.planning', 'phases', '03-api'), { recursive: true });

    const result = runEzTools('scaffold verification --phase 3', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.created).toBe(true);

    const content = fs.readFileSync(
      path.join(tmpDir, '.planning', 'phases', '03-api', '03-VERIFICATION.md'),
      'utf-8'
    );
    expect(content.includes('Goal-Backward Verification')).toBeTruthy() // 'should have verification heading';
  });

  test('scaffolds phase directory', () => {
    const result = runEzTools('scaffold phase-dir --phase 5 --name User Dashboard', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.created).toBe(true);
    expect(fs.existsSync(path.join(tmpDir).toBeTruthy() // '.planning', 'phases', '05-user-dashboard'),
      'directory should be created'
    );
  });

  test('does not overwrite existing files', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '03-api');
    fs.mkdirSync(phaseDir, { recursive: true });
    fs.writeFileSync(path.join(phaseDir, '03-CONTEXT.md'), '# Existing content');

    const result = runEzTools('scaffold context --phase 3', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.created).toBe(false, 'should not overwrite');
    expect(output.reason).toBe('already_exists');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// cmdGenerateSlug tests (CMD-01)
// ─────────────────────────────────────────────────────────────────────────────

describe('generate-slug command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('converts normal text to slug', () => {
    const result = runEzTools('generate-slug "Hello World"', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.slug).toBe('hello-world');
  });

  test('strips special characters', () => {
    const result = runEzTools('generate-slug "Test@#$%^Special!!!"', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.slug).toBe('test-special');
  });

  test('preserves numbers', () => {
    const result = runEzTools('generate-slug "Phase 3 Plan"', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.slug).toBe('phase-3-plan');
  });

  test('strips leading and trailing hyphens', () => {
    const result = runEzTools('generate-slug "---leading-trailing---"', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.slug).toBe('leading-trailing');
  });

  test('fails when no text provided', () => {
    const result = runEzTools('generate-slug', tmpDir);
    expect(!result.success).toBeTruthy() // 'should fail without text';
    expect(result.error!.includes('text required')).toBeTruthy() // 'error should mention text required';
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// cmdCurrentTimestamp tests (CMD-01)
// ─────────────────────────────────────────────────────────────────────────────

describe('current-timestamp command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('date format returns YYYY-MM-DD', () => {
    const result = runEzTools('current-timestamp date', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}$/, 'should be YYYY-MM-DD format');
  });

  test('filename format returns ISO without colons or fractional seconds', () => {
    const result = runEzTools('current-timestamp filename', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/, 'should replace colons with hyphens and strip fractional seconds');
  });

  test('full format returns full ISO string', () => {
    const result = runEzTools('current-timestamp full', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, 'should be full ISO format');
  });

  test('default (no format) returns full ISO string', () => {
    const result = runEzTools('current-timestamp', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, 'default should be full ISO format');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// cmdListTodos tests (CMD-02)
// ─────────────────────────────────────────────────────────────────────────────

describe('list-todos command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('empty directory returns zero count', () => {
    const result = runEzTools('list-todos', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.count).toBe(0, 'count should be 0');
    assert.deepStrictEqual(output.todos, [], 'todos should be empty');
  });

  test('returns multiple todos with correct fields', () => {
    const pendingDir = path.join(tmpDir, '.planning', 'todos', 'pending');
    fs.mkdirSync(pendingDir, { recursive: true });

    fs.writeFileSync(path.join(pendingDir, 'add-tests.md'), 'title: Add unit tests\narea: testing\ncreated: 2026-01-15\n');
    fs.writeFileSync(path.join(pendingDir, 'fix-bug.md'), 'title: Fix login bug\narea: auth\ncreated: 2026-01-20\n');

    const result = runEzTools('list-todos', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.count).toBe(2, 'should have 2 todos');
    expect(output.todos.length).toBe(2, 'todos array should have 2 entries');

    const testTodo = output.todos.find(t => t.file === 'add-tests.md');
    expect(testTodo).toBeTruthy() // 'add-tests.md should be in results';
    expect(testTodo.title).toBe('Add unit tests');
    assert.strictEqual(testTodo.area, 'testing');
    expect(testTodo.created).toBe('2026-01-15');
  });

  test('area filter returns only matching todos', () => {
    const pendingDir = path.join(tmpDir, '.planning', 'todos', 'pending');
    fs.mkdirSync(pendingDir, { recursive: true });

    fs.writeFileSync(path.join(pendingDir, 'ui-task.md'), 'title: UI task\narea: ui\ncreated: 2026-01-01\n');
    fs.writeFileSync(path.join(pendingDir, 'api-task.md'), 'title: API task\narea: api\ncreated: 2026-01-01\n');

    const result = runEzTools('list-todos ui', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.count).toBe(1, 'should have 1 matching todo');
    expect(output.todos[0].area).toBe('ui', 'should only return ui area');
  });

  test('area filter miss returns zero count', () => {
    const pendingDir = path.join(tmpDir, '.planning', 'todos', 'pending');
    fs.mkdirSync(pendingDir, { recursive: true });

    fs.writeFileSync(path.join(pendingDir, 'task.md'), 'title: Some task\narea: backend\ncreated: 2026-01-01\n');

    const result = runEzTools('list-todos nonexistent-area', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.count).toBe(0, 'should have 0 matching todos');
  });

  test('malformed files use defaults', () => {
    const pendingDir = path.join(tmpDir, '.planning', 'todos', 'pending');
    fs.mkdirSync(pendingDir, { recursive: true });

    // File with no title or area fields
    fs.writeFileSync(path.join(pendingDir, 'malformed.md'), 'some random content\nno fields here\n');

    const result = runEzTools('list-todos', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.count).toBe(1, 'malformed file should still be counted');
    expect(output.todos[0].title).toBe('Untitled', 'missing title defaults to Untitled');
    expect(output.todos[0].area).toBe('general', 'missing area defaults to general');
    expect(output.todos[0].created).toBe('unknown', 'missing created defaults to unknown');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// cmdVerifyPathExists tests (CMD-02)
// ─────────────────────────────────────────────────────────────────────────────

describe('verify-path-exists command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('existing file returns exists=true with type=file', () => {
    fs.writeFileSync(path.join(tmpDir, 'test-file.txt'), 'hello');

    const result = runEzTools('verify-path-exists test-file.txt', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.exists).toBe(true);
    assert.strictEqual(output.type, 'file');
  });

  test('existing directory returns exists=true with type=directory', () => {
    fs.mkdirSync(path.join(tmpDir, 'test-dir'), { recursive: true });

    const result = runEzTools('verify-path-exists test-dir', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.exists).toBe(true);
    assert.strictEqual(output.type, 'directory');
  });

  test('missing path returns exists=false', () => {
    const result = runEzTools('verify-path-exists nonexistent/path', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.exists).toBe(false);
    assert.strictEqual(output.type, undefined);
  });

  test('absolute path resolves correctly', () => {
    const absFile = path.join(tmpDir, 'abs-test.txt');
    fs.writeFileSync(absFile, 'content');

    const result = runEzTools(`verify-path-exists ${absFile}`, tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.exists).toBe(true);
    assert.strictEqual(output.type, 'file');
  });

  test('fails when no path provided', () => {
    const result = runEzTools('verify-path-exists', tmpDir);
    expect(!result.success).toBeTruthy() // 'should fail without path';
    expect(result.error!.includes('path required')).toBeTruthy() // 'error should mention path required';
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// cmdResolveModel tests (CMD-03)
// ─────────────────────────────────────────────────────────────────────────────

describe('resolve-model command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('known agent returns model and profile without unknown_agent', () => {
    const result = runEzTools('resolve-model ez-planner', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.model).toBeTruthy() // 'should have model field';
    expect(output.profile).toBeTruthy() // 'should have profile field';
    expect(output.unknown_agent).toBe(undefined, 'should not have unknown_agent for known agent');
  });

  test('unknown agent returns unknown_agent=true', () => {
    const result = runEzTools('resolve-model fake-nonexistent-agent', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.unknown_agent).toBe(true, 'should flag unknown agent');
  });

  test('default profile fallback when no config exists', () => {
    // tmpDir has no config.json, so defaults to balanced profile
    const result = runEzTools('resolve-model ez-executor', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.profile).toBe('balanced', 'should default to balanced profile');
    expect(output.model).toBeTruthy() // 'should resolve a model';
  });

  test('fails when no agent-type provided', () => {
    const result = runEzTools('resolve-model', tmpDir);
    expect(!result.success).toBeTruthy() // 'should fail without agent-type';
    expect(result.error!.includes('agent-type required')).toBeTruthy() // 'error should mention agent-type required';
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// cmdCommit tests (CMD-04)
// ─────────────────────────────────────────────────────────────────────────────

describe('commit command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempGitProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('skips when commit_docs is false', () => {
    // Write config with commit_docs: false
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'config.json'),
      JSON.stringify({ commit_docs: false })
    );

    const result = runEzTools('commit "test message"', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.committed).toBe(false);
    assert.strictEqual(output.reason, 'skipped_commit_docs_false');
  });

  test('skips when .planning is gitignored', () => {
    // Add .planning/ to .gitignore and commit it so git recognizes the ignore
    fs.writeFileSync(path.join(tmpDir, '.gitignore'), '.planning/\n');
    execSync('git add .gitignore', { cwd: tmpDir, stdio: 'pipe' });
    execSync('git commit -m "add gitignore"', { cwd: tmpDir, stdio: 'pipe' });

    const result = runEzTools('commit "test message"', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.committed).toBe(false);
    assert.strictEqual(output.reason, 'skipped_gitignored');
  });

  test('handles nothing to commit', () => {
    // Don't modify any files after initial commit
    const result = runEzTools('commit "test message"', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.committed).toBe(false);
    assert.strictEqual(output.reason, 'nothing_to_commit');
  });

  test('creates real commit with correct hash', () => {
    // Create a new file in .planning/
    fs.writeFileSync(path.join(tmpDir, '.planning', 'test-file.md'), '# Test\n');

    const result = runEzTools('commit "test: add test file" --files .planning/test-file.md', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.committed).toBe(true, 'should have committed');
    expect(output.hash).toBeTruthy() // 'should have a commit hash';
    expect(output.reason).toBe('committed');

    // Verify via git log
    const gitLog = execSync('git log --oneline -1', { cwd: tmpDir, encoding: 'utf-8' }).trim();
    expect(gitLog.includes('test: add test file')).toBeTruthy() // 'git log should contain the commit message';
    expect(gitLog.includes(output.hash)).toBeTruthy() // 'git log should contain the returned hash';
  });

  test('amend mode works without crashing', () => {
    // Create a file and commit it first
    fs.writeFileSync(path.join(tmpDir, '.planning', 'amend-file.md'), '# Initial\n');
    execSync('git add .planning/amend-file.md', { cwd: tmpDir, stdio: 'pipe' });
    execSync('git commit -m "initial file"', { cwd: tmpDir, stdio: 'pipe' });

    // Modify the file and amend
    fs.writeFileSync(path.join(tmpDir, '.planning', 'amend-file.md'), '# Amended\n');

    const result = runEzTools('commit "ignored" --files .planning/amend-file.md --amend', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.committed).toBe(true, 'amend should succeed');

    // Verify only 2 commits total (initial setup + amended)
    const logCount = execSync('git log --oneline', { cwd: tmpDir, encoding: 'utf-8' }).trim().split('\n').length;
    expect(logCount).toBe(2, 'should have 2 commits (initial + amended)');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// cmdWebsearch tests (CMD-05)
// ─────────────────────────────────────────────────────────────────────────────

describe('websearch command', () => {
  let origFetch;
  let origApiKey;
  let origStdoutWrite;
  let captured;

  beforeEach(() => {
    origFetch = global.fetch;
    origApiKey = process.env.BRAVE_API_KEY;
    origStdoutWrite = process.stdout.write;
    captured = '';
    process.stdout.write = (chunk) => { captured += chunk; return true; };
  });

  afterEach(() => {
    global.fetch = origFetch;
    if (origApiKey !== undefined) {
      process.env.BRAVE_API_KEY = origApiKey;
    } else {
      delete process.env.BRAVE_API_KEY;
    }
    process.stdout.write = origStdoutWrite;
  });

  test('returns available=false when BRAVE_API_KEY is unset', async () => {
    delete process.env.BRAVE_API_KEY;

    await cmdWebsearch('test query', {}, false);

    const output = JSON.parse(captured);
    expect(output.available).toBe(false);
    expect(output.reason.includes('BRAVE_API_KEY')).toBeTruthy() // 'should mention missing API key';
  });

  test('returns error when no query provided', async () => {
    process.env.BRAVE_API_KEY = 'test-key';

    await cmdWebsearch(undefined, {}, false);

    const output = JSON.parse(captured);
    expect(output.available).toBe(false);
    expect(output.error.includes('Query required')).toBeTruthy() // 'should mention query required';
  });

  test('returns results for successful API response', async () => {
    process.env.BRAVE_API_KEY = 'test-key';

    global.fetch = async () => ({
      ok: true,
      json: async () => ({
        web: {
          results: [
            { title: 'Test Result', url: 'https://example.com', description: 'A test result', age: '1d' },
          ],
        },
      }),
    });

    await cmdWebsearch('test query', { limit: 5, freshness: 'pd' }, false);

    const output = JSON.parse(captured);
    expect(output.available).toBe(true);
    assert.strictEqual(output.query, 'test query');
    expect(output.count).toBe(1);
    assert.strictEqual(output.results[0].title, 'Test Result');
    expect(output.results[0].url).toBe('https://example.com');
    assert.strictEqual(output.results[0].age, '1d');
  });

  test('constructs correct URL parameters', async () => {
    process.env.BRAVE_API_KEY = 'test-key';
    let capturedUrl = '';

    global.fetch = async (url) => {
      capturedUrl = url;
      return {
        ok: true,
        json: async () => ({ web: { results: [] } }),
      };
    };

    await cmdWebsearch('node.js testing', { limit: 5, freshness: 'pd' }, false);

    const parsed = new URL(capturedUrl);
    expect(parsed.searchParams.get('q')).toBe('node.js testing', 'query param should decode to original string');
    expect(parsed.searchParams.get('count')).toBe('5', 'count param should be 5');
    expect(parsed.searchParams.get('freshness')).toBe('pd', 'freshness param should be pd');
  });

  test('handles API error (non-200 status)', async () => {
    process.env.BRAVE_API_KEY = 'test-key';

    global.fetch = async () => ({
      ok: false,
      status: 429,
    });

    await cmdWebsearch('test query', {}, false);

    const output = JSON.parse(captured);
    expect(output.available).toBe(false);
    expect(output.error.includes('429')).toBeTruthy() // 'error should include status code';
  });

  test('handles network failure', async () => {
    process.env.BRAVE_API_KEY = 'test-key';

    global.fetch = async () => {
      throw new Error('Network timeout');
    };

    await cmdWebsearch('test query', {}, false);

    const output = JSON.parse(captured);
    expect(output.available).toBe(false);
    assert.strictEqual(output.error, 'Network timeout');
  });
});

describe('stats command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('returns valid JSON with empty project', () => {
    const result = runEzTools('stats', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const stats = JSON.parse(result.output);
    expect(Array.isArray(stats.phases)).toBeTruthy() // 'phases should be an array';
    expect(stats.total_plans).toBe(0);
    assert.strictEqual(stats.total_summaries, 0);
    expect(stats.percent).toBe(0);
    assert.strictEqual(stats.phases_completed, 0);
    expect(stats.phases_total).toBe(0);
    assert.strictEqual(stats.requirements_total, 0);
    expect(stats.requirements_complete).toBe(0);
  });

  test('counts phases, plans, and summaries correctly', () => {
    const p1 = path.join(tmpDir, '.planning', 'phases', '01-auth');
    const p2 = path.join(tmpDir, '.planning', 'phases', '02-api');
    fs.mkdirSync(p1, { recursive: true });
    fs.mkdirSync(p2, { recursive: true });

    // Phase 1: 2 plans, 2 summaries (complete)
    fs.writeFileSync(path.join(p1, '01-01-PLAN.md'), '# Plan');
    fs.writeFileSync(path.join(p1, '01-02-PLAN.md'), '# Plan');
    fs.writeFileSync(path.join(p1, '01-01-SUMMARY.md'), '# Summary');
    fs.writeFileSync(path.join(p1, '01-02-SUMMARY.md'), '# Summary');

    // Phase 2: 1 plan, 0 summaries (planned)
    fs.writeFileSync(path.join(p2, '02-01-PLAN.md'), '# Plan');

    const result = runEzTools('stats', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const stats = JSON.parse(result.output);
    expect(stats.phases_total).toBe(2);
    assert.strictEqual(stats.phases_completed, 1);
    expect(stats.total_plans).toBe(3);
    assert.strictEqual(stats.total_summaries, 2);
    expect(stats.percent).toBe(67);
  });

  test('counts requirements from REQUIREMENTS.md', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'REQUIREMENTS.md'),
      `# Requirements

## v1 Requirements

- [x] **AUTH-01**: User can sign up
- [x] **AUTH-02**: User can log in
- [ ] **API-01**: REST endpoints
- [ ] **API-02**: GraphQL support
`
    );

    const result = runEzTools('stats', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const stats = JSON.parse(result.output);
    expect(stats.requirements_total).toBe(4);
    assert.strictEqual(stats.requirements_complete, 2);
  });

  test('reads last activity from STATE.md', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'STATE.md'),
      `# State\n\n**Current Phase:** 01\n**Status:** In progress\n**Last Activity:** 2025-06-15\n**Last Activity Description:** Working\n`
    );

    const result = runEzTools('stats', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const stats = JSON.parse(result.output);
    expect(stats.last_activity).toBe('2025-06-15');
  });

  test('table format renders readable output', () => {
    const p1 = path.join(tmpDir, '.planning', 'phases', '01-auth');
    fs.mkdirSync(p1, { recursive: true });
    fs.writeFileSync(path.join(p1, '01-01-PLAN.md'), '# Plan');
    fs.writeFileSync(path.join(p1, '01-01-SUMMARY.md'), '# Summary');

    const result = runEzTools('stats table', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const parsed = JSON.parse(result.output);
    expect(parsed.rendered).toBeTruthy() // 'table format should include rendered field';
    expect(parsed.rendered.includes('Statistics')).toBeTruthy() // 'should include Statistics header';
    expect(parsed.rendered.includes('| Phase |')).toBeTruthy() // 'should include table header';
    expect(parsed.rendered.includes('| 1 |')).toBeTruthy() // 'should include phase row';
  });
});
