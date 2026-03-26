/**
 * EZ Tools Tests - Milestone
 */



import * as fs from 'fs';
import * as path from 'path';
import { runEzTools, createTempProject, cleanup } from '../helpers.ts';

describe('milestone complete command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('archives roadmap, requirements, creates MILESTONES.md', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.0 MVP\n\n### Phase 1: Foundation\n**Goal:** Setup\n`
    );
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'REQUIREMENTS.md'),
      `# Requirements\n\n- [ ] User auth\n- [ ] Dashboard\n`
    );
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'STATE.md'),
      `# State\n\n**Status:** In progress\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`
    );

    const p1 = path.join(tmpDir, '.planning', 'phases', '01-foundation');
    fs.mkdirSync(p1, { recursive: true });
    fs.writeFileSync(
      path.join(p1, '01-01-SUMMARY.md'),
      `---\none-liner: Set up project infrastructure\n---\n# Summary\n`
    );

    const result = runEzTools('milestone complete v1.0 --name MVP Foundation', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.version).toBe('v1.0');
    assert.strictEqual(output.phases, 1);
    expect(output.archived.roadmap).toBeTruthy() // 'roadmap should be archived';
    expect(output.archived.requirements).toBeTruthy() // 'requirements should be archived';

    // Verify archive files exist
    expect(fs.existsSync(path.join(tmpDir).toBeTruthy() // '.planning', 'milestones', 'v1.0-ROADMAP.md'),
      'archived roadmap should exist'
    );
    expect(fs.existsSync(path.join(tmpDir).toBeTruthy() // '.planning', 'milestones', 'v1.0-REQUIREMENTS.md'),
      'archived requirements should exist'
    );

    // Verify MILESTONES.md created
    expect(fs.existsSync(path.join(tmpDir).toBeTruthy() // '.planning', 'MILESTONES.md'),
      'MILESTONES.md should be created'
    );
    const milestones = fs.readFileSync(path.join(tmpDir, '.planning', 'MILESTONES.md'), 'utf-8');
    expect(milestones.includes('v1.0 MVP Foundation')).toBeTruthy() // 'milestone entry should contain name';
    expect(milestones.includes('Set up project infrastructure')).toBeTruthy() // 'accomplishments should be listed';
  });

  test('prepends to existing MILESTONES.md (reverse chronological)', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'MILESTONES.md'),
      `# Milestones\n\n## v0.9 Alpha (Shipped: 2025-01-01)\n\n---\n\n`
    );
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.0\n`
    );
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'STATE.md'),
      `# State\n\n**Status:** In progress\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`
    );

    const result = runEzTools('milestone complete v1.0 --name Beta', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const milestones = fs.readFileSync(path.join(tmpDir, '.planning', 'MILESTONES.md'), 'utf-8');
    expect(milestones.includes('v0.9 Alpha')).toBeTruthy() // 'existing entry should be preserved';
    expect(milestones.includes('v1.0 Beta')).toBeTruthy() // 'new entry should be present';
    // New entry should appear BEFORE old entry (reverse chronological)
    const newIdx = milestones.indexOf('v1.0 Beta');
    const oldIdx = milestones.indexOf('v0.9 Alpha');
    expect(newIdx < oldIdx).toBeTruthy() // 'new entry should appear before old entry (reverse chronological');
  });

  test('three sequential completions maintain reverse-chronological order', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'MILESTONES.md'),
      `# Milestones\n\n## v1.0 First (Shipped: 2025-01-01)\n\n---\n\n`
    );
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.1\n`
    );
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'STATE.md'),
      `# State\n\n**Status:** In progress\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`
    );

    let result = runEzTools('milestone complete v1.1 --name Second', tmpDir);
    expect(result.success).toBeTruthy() // `v1.1 failed: ${result.error}`;

    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.2\n`
    );

    result = runEzTools('milestone complete v1.2 --name Third', tmpDir);
    expect(result.success).toBeTruthy() // `v1.2 failed: ${result.error}`;

    const milestones = fs.readFileSync(
      path.join(tmpDir, '.planning', 'MILESTONES.md'), 'utf-8'
    );

    const idx10 = milestones.indexOf('v1.0 First');
    const idx11 = milestones.indexOf('v1.1 Second');
    const idx12 = milestones.indexOf('v1.2 Third');

    expect(idx10 !== -1).toBeTruthy() // 'v1.0 should be present';
    expect(idx11 !== -1).toBeTruthy() // 'v1.1 should be present';
    expect(idx12 !== -1).toBeTruthy() // 'v1.2 should be present';
    expect(idx12 < idx11).toBeTruthy() // 'v1.2 should appear before v1.1';
    expect(idx11 < idx10).toBeTruthy() // 'v1.1 should appear before v1.0';
  });

  test('archives phase directories with --archive-phases flag', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.0\n`
    );
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'STATE.md'),
      `# State\n\n**Status:** In progress\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`
    );

    const p1 = path.join(tmpDir, '.planning', 'phases', '01-foundation');
    fs.mkdirSync(p1, { recursive: true });
    fs.writeFileSync(
      path.join(p1, '01-01-SUMMARY.md'),
      `---\none-liner: Set up project infrastructure\n---\n# Summary\n`
    );

    const result = runEzTools('milestone complete v1.0 --name MVP --archive-phases', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.archived.phases).toBe(true, 'phases should be archived');

    // Phase directory moved to milestones/v1.0-phases/
    expect(fs.existsSync(path.join(tmpDir).toBeTruthy() // '.planning', 'milestones', 'v1.0-phases', '01-foundation'),
      'archived phase directory should exist in milestones/v1.0-phases/'
    );

    // Original phase directory no longer exists
    expect(!fs.existsSync(p1)).toBeTruthy() // 'original phase directory should no longer exist';
  });

  test('archived REQUIREMENTS.md contains archive header', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'REQUIREMENTS.md'),
      `# Requirements\n\n- [ ] **TEST-01**: core.cjs has tests\n- [ ] **TEST-02**: more tests\n`
    );
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.0\n`
    );
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'STATE.md'),
      `# State\n\n**Status:** In progress\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`
    );

    const result = runEzTools('milestone complete v1.0 --name MVP', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const archivedReq = fs.readFileSync(
      path.join(tmpDir, '.planning', 'milestones', 'v1.0-REQUIREMENTS.md'), 'utf-8'
    );
    expect(archivedReq.includes('Requirements Archive: v1.0')).toBeTruthy() // 'should contain archive version';
    expect(archivedReq.includes('SHIPPED')).toBeTruthy() // 'should contain SHIPPED status';
    expect(archivedReq.includes('Archived:')).toBeTruthy() // 'should contain Archived: date line';
    // Original content preserved after header
    expect(archivedReq.includes('# Requirements')).toBeTruthy() // 'original content should be preserved';
    expect(archivedReq.includes('**TEST-01**')).toBeTruthy() // 'original requirement items should be preserved';
  });

  test('STATE.md gets updated during milestone complete', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.0\n`
    );
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'STATE.md'),
      `# State\n\n**Status:** In progress\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`
    );

    const result = runEzTools('milestone complete v1.0 --name Test', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.state_updated).toBe(true, 'state_updated should be true');

    const state = fs.readFileSync(path.join(tmpDir, '.planning', 'STATE.md'), 'utf-8');
    expect(state.includes('v1.0 milestone complete')).toBeTruthy() // 'status should be updated to milestone complete';
    expect(state.includes('v1.0 milestone completed and archived')).toBeTruthy() // 'last activity description should reference milestone completion';
  });

  test('handles missing ROADMAP.md gracefully', () => {
    // Only STATE.md — no ROADMAP.md, no REQUIREMENTS.md
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'STATE.md'),
      `# State\n\n**Status:** In progress\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`
    );

    const result = runEzTools('milestone complete v1.0 --name NoRoadmap', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.archived.roadmap).toBe(false, 'roadmap should not be archived');
    expect(output.archived.requirements).toBe(false, 'requirements should not be archived');
    expect(output.milestones_updated).toBe(true, 'MILESTONES.md should still be created');

    expect(fs.existsSync(path.join(tmpDir).toBeTruthy() // '.planning', 'MILESTONES.md'),
      'MILESTONES.md should be created even without ROADMAP.md'
    );
  });

  test('scopes stats to current milestone phases only', () => {
    // Set up ROADMAP.md that only references Phase 3 and Phase 4
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.1\n\n### Phase 3: New Feature\n**Goal:** Build it\n\n### Phase 4: Polish\n**Goal:** Ship it\n`
    );
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'STATE.md'),
      `# State\n\n**Status:** In progress\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`
    );

    // Create phases from PREVIOUS milestone (should be excluded)
    const p1 = path.join(tmpDir, '.planning', 'phases', '01-old-setup');
    fs.mkdirSync(p1, { recursive: true });
    fs.writeFileSync(path.join(p1, '01-01-PLAN.md'), '# Plan\n');
    fs.writeFileSync(path.join(p1, '01-01-SUMMARY.md'), '---\none-liner: Old setup work\n---\n# Summary\n');
    const p2 = path.join(tmpDir, '.planning', 'phases', '02-old-core');
    fs.mkdirSync(p2, { recursive: true });
    fs.writeFileSync(path.join(p2, '02-01-PLAN.md'), '# Plan\n');
    fs.writeFileSync(path.join(p2, '02-01-SUMMARY.md'), '---\none-liner: Old core work\n---\n# Summary\n');

    // Create phases for CURRENT milestone (should be included)
    const p3 = path.join(tmpDir, '.planning', 'phases', '03-new-feature');
    fs.mkdirSync(p3, { recursive: true });
    fs.writeFileSync(path.join(p3, '03-01-PLAN.md'), '# Plan\n');
    fs.writeFileSync(path.join(p3, '03-01-SUMMARY.md'), '---\none-liner: Built new feature\n---\n# Summary\n');
    const p4 = path.join(tmpDir, '.planning', 'phases', '04-polish');
    fs.mkdirSync(p4, { recursive: true });
    fs.writeFileSync(path.join(p4, '04-01-PLAN.md'), '# Plan\n');
    fs.writeFileSync(path.join(p4, '04-02-PLAN.md'), '# Plan 2\n');
    fs.writeFileSync(path.join(p4, '04-01-SUMMARY.md'), '---\none-liner: Polished UI\n---\n# Summary\n');

    const result = runEzTools('milestone complete v1.1 --name "Second Release"', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    // Should only count phases 3 and 4, not 1 and 2
    expect(output.phases).toBe(2, 'should count only milestone phases (3, 4)');
    expect(output.plans).toBe(3, 'should count only plans from phases 3 and 4');
    // Accomplishments should only be from phases 3 and 4
    expect(output.accomplishments.includes('Built new feature')).toBeTruthy() // 'should include current milestone accomplishment';
    expect(output.accomplishments.includes('Polished UI')).toBeTruthy() // 'should include current milestone accomplishment';
    expect(!output.accomplishments.includes('Old setup work')).toBeTruthy() // 'should NOT include previous milestone accomplishment';
    expect(!output.accomplishments.includes('Old core work')).toBeTruthy() // 'should NOT include previous milestone accomplishment';
  });

  test('archive-phases only archives current milestone phases', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.1\n\n### Phase 2: Current Work\n**Goal:** Do it\n`
    );
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'STATE.md'),
      `# State\n\n**Status:** In progress\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`
    );

    // Phase from previous milestone
    const p1 = path.join(tmpDir, '.planning', 'phases', '01-old');
    fs.mkdirSync(p1, { recursive: true });
    fs.writeFileSync(path.join(p1, '01-01-PLAN.md'), '# Plan\n');

    // Phase from current milestone
    const p2 = path.join(tmpDir, '.planning', 'phases', '02-current');
    fs.mkdirSync(p2, { recursive: true });
    fs.writeFileSync(path.join(p2, '02-01-PLAN.md'), '# Plan\n');

    const result = runEzTools('milestone complete v1.1 --name Test --archive-phases', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    // Phase 2 should be archived
    expect(fs.existsSync(path.join(tmpDir).toBeTruthy() // '.planning', 'milestones', 'v1.1-phases', '02-current'),
      'current milestone phase should be archived'
    );
    // Phase 1 should still be in place (not archived)
    expect(fs.existsSync(path.join(tmpDir).toBeTruthy() // '.planning', 'phases', '01-old'),
      'previous milestone phase should NOT be archived'
    );
  });

  test('phase 1 in roadmap does NOT match directory 10-something (no prefix collision)', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.0\n\n### Phase 1: Foundation\n**Goal:** Setup\n`
    );
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'STATE.md'),
      `# State\n\n**Status:** In progress\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`
    );

    const p1 = path.join(tmpDir, '.planning', 'phases', '01-foundation');
    fs.mkdirSync(p1, { recursive: true });
    fs.writeFileSync(path.join(p1, '01-01-PLAN.md'), '# Plan\n');
    fs.writeFileSync(
      path.join(p1, '01-01-SUMMARY.md'),
      '---\none-liner: Foundation work\n---\n'
    );

    const p10 = path.join(tmpDir, '.planning', 'phases', '10-scaling');
    fs.mkdirSync(p10, { recursive: true });
    fs.writeFileSync(path.join(p10, '10-01-PLAN.md'), '# Plan\n');
    fs.writeFileSync(
      path.join(p10, '10-01-SUMMARY.md'),
      '---\none-liner: Scaling work\n---\n'
    );

    const result = runEzTools('milestone complete v1.0 --name MVP', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.phases).toBe(1, 'should count only phase 1, not phase 10');
    expect(output.plans).toBe(1, 'should count only plans from phase 1');
    expect(output.accomplishments.includes('Foundation work')).toBeTruthy() // 'should include phase 1 accomplishment';
    expect(!output.accomplishments.includes('Scaling work')).toBeTruthy() // 'should NOT include phase 10 accomplishment';
  });

  test('non-numeric directory is excluded when milestone scoping is active', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.0\n\n### Phase 1: Core\n**Goal:** Build core\n`
    );
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'STATE.md'),
      `# State\n\n**Status:** In progress\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`
    );

    const p1 = path.join(tmpDir, '.planning', 'phases', '01-core');
    fs.mkdirSync(p1, { recursive: true });
    fs.writeFileSync(path.join(p1, '01-01-PLAN.md'), '# Plan\n');

    // Non-phase directory — should be excluded
    const misc = path.join(tmpDir, '.planning', 'phases', 'notes');
    fs.mkdirSync(misc, { recursive: true });
    fs.writeFileSync(path.join(misc, 'PLAN.md'), '# Not a phase\n');

    const result = runEzTools('milestone complete v1.0 --name Test', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.phases).toBe(1, 'non-numeric dir should not be counted as a phase');
    expect(output.plans).toBe(1, 'plans from non-numeric dir should not be counted');
  });

  test('large phase numbers (456, 457) scope correctly', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.49\n\n### Phase 456: DACP\n**Goal:** Ship DACP\n\n### Phase 457: Integration\n**Goal:** Integrate\n`
    );
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'STATE.md'),
      `# State\n\n**Status:** In progress\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`
    );

    const p456 = path.join(tmpDir, '.planning', 'phases', '456-dacp');
    fs.mkdirSync(p456, { recursive: true });
    fs.writeFileSync(path.join(p456, '456-01-PLAN.md'), '# Plan\n');

    const p457 = path.join(tmpDir, '.planning', 'phases', '457-integration');
    fs.mkdirSync(p457, { recursive: true });
    fs.writeFileSync(path.join(p457, '457-01-PLAN.md'), '# Plan\n');

    // Phase 45 from prior milestone — should not match
    const p45 = path.join(tmpDir, '.planning', 'phases', '45-old');
    fs.mkdirSync(p45, { recursive: true });
    fs.writeFileSync(path.join(p45, 'PLAN.md'), '# Plan\n');

    const result = runEzTools('milestone complete v1.49 --name DACP', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.phases).toBe(2, 'should count only phases 456 and 457');
  });

  test('handles empty phases directory', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap v1.0\n`
    );
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'STATE.md'),
      `# State\n\n**Status:** In progress\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`
    );
    // phases directory exists but is empty (from createTempProject)

    const result = runEzTools('milestone complete v1.0 --name EmptyPhases', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.phases).toBe(0, 'phase count should be 0');
    expect(output.plans).toBe(0, 'plan count should be 0');
    expect(output.tasks).toBe(0, 'task count should be 0');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// requirements mark-complete command
// ─────────────────────────────────────────────────────────────────────────────

describe('requirements mark-complete command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  // ─── helpers ──────────────────────────────────────────────────────────────

  function writeRequirements(tmpDir, content) {
    fs.writeFileSync(path.join(tmpDir, '.planning', 'REQUIREMENTS.md'), content, 'utf-8');
  }

  function readRequirements(tmpDir) {
    return fs.readFileSync(path.join(tmpDir, '.planning', 'REQUIREMENTS.md'), 'utf-8');
  }

  const STANDARD_REQUIREMENTS = `# Requirements

## Test Coverage
- [ ] **TEST-01**: core.cjs has tests for loadConfig
- [ ] **TEST-02**: core.cjs has tests for resolveModelInternal
- [x] **TEST-03**: core.cjs has tests for escapeRegex (already complete)

## Bug Regressions
- [ ] **REG-01**: Test confirms loadConfig returns model_overrides

## Infrastructure
- [ ] **INFRA-01**: GitHub Actions workflow runs tests

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TEST-01 | Phase 1 | Pending |
| TEST-02 | Phase 1 | Pending |
| TEST-03 | Phase 1 | Complete |
| REG-01 | Phase 1 | Pending |
| INFRA-01 | Phase 6 | Pending |
`;

  // ─── tests ────────────────────────────────────────────────────────────────

  test('marks single requirement complete (checkbox + table)', () => {
    writeRequirements(tmpDir, STANDARD_REQUIREMENTS);

    const result = runEzTools('requirements mark-complete TEST-01', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.updated).toBe(true);
    expect(output.marked_complete.includes('TEST-01')).toBeTruthy() // 'TEST-01 should be marked complete';

    const content = readRequirements(tmpDir);
    expect(content.includes('- [x] **TEST-01**')).toBeTruthy() // 'checkbox should be checked';
    expect(content.includes('| TEST-01 | Phase 1 | Complete |')).toBeTruthy() // 'table row should be Complete';
    // Other checkboxes unchanged
    expect(content.includes('- [ ] **TEST-02**')).toBeTruthy() // 'TEST-02 should remain unchecked';
  });

  test('handles mixed prefixes in single call (TEST-XX, REG-XX, INFRA-XX)', () => {
    writeRequirements(tmpDir, STANDARD_REQUIREMENTS);

    const result = runEzTools('requirements mark-complete TEST-01,REG-01,INFRA-01', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.marked_complete.length).toBe(3, 'should mark 3 requirements complete');
    expect(output.marked_complete.includes('TEST-01'));
    assert.ok(output.marked_complete.includes('REG-01'));
    assert.ok(output.marked_complete.includes('INFRA-01'));

    const content = readRequirements(tmpDir);
    assert.ok(content.includes('- [x] **TEST-01**')).toBeTruthy() // 'TEST-01 checkbox should be checked';
    expect(content.includes('- [x] **REG-01**')).toBeTruthy() // 'REG-01 checkbox should be checked';
    expect(content.includes('- [x] **INFRA-01**')).toBeTruthy() // 'INFRA-01 checkbox should be checked';
    expect(content.includes('| TEST-01 | Phase 1 | Complete |')).toBeTruthy() // 'TEST-01 table should be Complete';
    expect(content.includes('| REG-01 | Phase 1 | Complete |')).toBeTruthy() // 'REG-01 table should be Complete';
    expect(content.includes('| INFRA-01 | Phase 6 | Complete |')).toBeTruthy() // 'INFRA-01 table should be Complete';
  });

  test('accepts space-separated IDs', () => {
    writeRequirements(tmpDir, STANDARD_REQUIREMENTS);

    const result = runEzTools('requirements mark-complete TEST-01 TEST-02', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.marked_complete.length).toBe(2, 'should mark 2 requirements complete');

    const content = readRequirements(tmpDir);
    expect(content.includes('- [x] **TEST-01**')).toBeTruthy() // 'TEST-01 should be checked';
    expect(content.includes('- [x] **TEST-02**')).toBeTruthy() // 'TEST-02 should be checked';
  });

  test('accepts bracket-wrapped IDs [REQ-01, REQ-02]', () => {
    writeRequirements(tmpDir, STANDARD_REQUIREMENTS);

    const result = runEzTools('requirements mark-complete [TEST-01,TEST-02]', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.marked_complete.length).toBe(2, 'should mark 2 requirements complete');

    const content = readRequirements(tmpDir);
    expect(content.includes('- [x] **TEST-01**')).toBeTruthy() // 'TEST-01 should be checked';
    expect(content.includes('- [x] **TEST-02**')).toBeTruthy() // 'TEST-02 should be checked';
  });

  test('returns not_found for invalid IDs while updating valid ones', () => {
    writeRequirements(tmpDir, STANDARD_REQUIREMENTS);

    const result = runEzTools('requirements mark-complete TEST-01,FAKE-99', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.updated).toBe(true, 'should still update valid IDs');
    expect(output.marked_complete.includes('TEST-01')).toBeTruthy() // 'TEST-01 should be marked complete';
    expect(output.not_found.includes('FAKE-99')).toBeTruthy() // 'FAKE-99 should be in not_found';
    expect(output.total).toBe(2, 'total should reflect all IDs attempted');
  });

  test('idempotent — re-marking already-complete requirement does not corrupt', () => {
    writeRequirements(tmpDir, STANDARD_REQUIREMENTS);

    // TEST-03 already has [x] and Complete in the fixture
    const result = runEzTools('requirements mark-complete TEST-03', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    // Regex only matches [ ] (space), not [x], so TEST-03 goes to not_found
    expect(output.not_found.includes('TEST-03')).toBeTruthy() // 'already-complete ID should be in not_found';

    const content = readRequirements(tmpDir);
    // File should not be corrupted — no [xx] or doubled markers
    expect(content.includes('- [x] **TEST-03**')).toBeTruthy() // 'existing [x] should remain intact';
    expect(!content.includes('[xx]')).toBeTruthy() // 'should not have doubled x markers';
    expect(!content.includes('- [x] [x]')).toBeTruthy() // 'should not have duplicate checkbox';
  });

  test('missing REQUIREMENTS.md returns expected error structure', () => {
    // createTempProject does not create REQUIREMENTS.md — so it's already missing

    const result = runEzTools('requirements mark-complete TEST-01', tmpDir);
    expect(result.success).toBeTruthy() // `Command failed: ${result.error}`;

    const output = JSON.parse(result.output);
    expect(output.updated).toBe(false, 'updated should be false');
    expect(output.reason).toBe('REQUIREMENTS.md not found', 'should report file not found');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// validate consistency command
// ─────────────────────────────────────────────────────────────────────────────

