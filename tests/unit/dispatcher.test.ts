/**
 * EZ Tools Tests - Dispatcher
 *
 * Tests for ez-tools.cjs dispatch routing and error paths.
 * Covers: no-command, unknown command, unknown subcommands for every command group,
 * --cwd parsing, and previously untouched routing branches.
 *
 * Requirements: DISP-01, DISP-02
 */



import * as fs from 'fs';
import * as path from 'path';
import { runEzTools, createTempProject, cleanup } from '../helpers.ts';

// ─── Dispatcher Error Paths ──────────────────────────────────────────────────

describe('dispatcher error paths', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  // No command
  test('no-command invocation prints usage and exits non-zero', () => {
    const result = runEzTools('', tmpDir);
    expect(result?.success).toBe(false, 'Should exit non-zero');
    expect(result.error!.includes('Usage:')).toBeTruthy() // `Expected "Usage:" in stderr, got: ${result.error}`;
  });

  // Unknown command
  test('unknown command produces clear error and exits non-zero', () => {
    const result = runEzTools('nonexistent-cmd', tmpDir);
    expect(result?.success).toBe(false, 'Should exit non-zero');
    expect(result.error!.includes('Unknown command')).toBeTruthy() // `Expected "Unknown command" in stderr, got: ${result.error}`;
  });

  // --cwd= form with valid directory
  test('--cwd= form overrides working directory', () => {
    // Create STATE.md in tmpDir so state load can find it
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'STATE.md'),
      '# Project State\n\n## Current Position\n\nPhase: 1 of 1 (Test)\n'
    );
    const result = runEzTools(`--cwd=${tmpDir} state load`, process.cwd());
    expect(result?.success).toBe(true, `Should succeed with --cwd=, got: ${result.error}`);
  });

  // --cwd= with empty value
  test('--cwd= with empty value produces error', () => {
    const result = runEzTools('--cwd= state load', tmpDir);
    expect(result?.success).toBe(false, 'Should exit non-zero');
    expect(result.error!.includes('Missing value for --cwd')).toBeTruthy() // `Expected "Missing value for --cwd" in stderr, got: ${result.error}`;
  });

  // --cwd with nonexistent path
  test('--cwd with invalid path produces error', () => {
    const result = runEzTools('--cwd /nonexistent/path/xyz state load', tmpDir);
    expect(result?.success).toBe(false, 'Should exit non-zero');
    expect(result.error!.includes('Invalid --cwd')).toBeTruthy() // `Expected "Invalid --cwd" in stderr, got: ${result.error}`;
  });

  // Unknown subcommand: template
  test('template unknown subcommand errors', () => {
    const result = runEzTools('template bogus', tmpDir);
    expect(result?.success).toBe(false, 'Should exit non-zero');
    expect(result.error!.includes('Unknown template subcommand')).toBeTruthy() // `Expected "Unknown template subcommand" in stderr, got: ${result.error}`;
  });

  // Unknown subcommand: frontmatter
  test('frontmatter unknown subcommand errors', () => {
    const result = runEzTools('frontmatter bogus file.md', tmpDir);
    expect(result?.success).toBe(false, 'Should exit non-zero');
    expect(result.error!.includes('Unknown frontmatter subcommand')).toBeTruthy() // `Expected "Unknown frontmatter subcommand" in stderr, got: ${result.error}`;
  });

  // Unknown subcommand: verify
  test('verify unknown subcommand errors', () => {
    const result = runEzTools('verify bogus', tmpDir);
    expect(result?.success).toBe(false, 'Should exit non-zero');
    expect(result.error!.includes('Unknown verify subcommand')).toBeTruthy() // `Expected "Unknown verify subcommand" in stderr, got: ${result.error}`;
  });

  // Unknown subcommand: phases
  test('phases unknown subcommand errors', () => {
    const result = runEzTools('phases bogus', tmpDir);
    expect(result?.success).toBe(false, 'Should exit non-zero');
    expect(result.error!.includes('Unknown phases subcommand')).toBeTruthy() // `Expected "Unknown phases subcommand" in stderr, got: ${result.error}`;
  });

  // Unknown subcommand: roadmap
  test('roadmap unknown subcommand errors', () => {
    const result = runEzTools('roadmap bogus', tmpDir);
    expect(result?.success).toBe(false, 'Should exit non-zero');
    expect(result.error!.includes('Unknown roadmap subcommand')).toBeTruthy() // `Expected "Unknown roadmap subcommand" in stderr, got: ${result.error}`;
  });

  // Unknown subcommand: requirements
  test('requirements unknown subcommand errors', () => {
    const result = runEzTools('requirements bogus', tmpDir);
    expect(result?.success).toBe(false, 'Should exit non-zero');
    expect(result.error!.includes('Unknown requirements subcommand')).toBeTruthy() // `Expected "Unknown requirements subcommand" in stderr, got: ${result.error}`;
  });

  // Unknown subcommand: phase
  test('phase unknown subcommand errors', () => {
    const result = runEzTools('phase bogus', tmpDir);
    expect(result?.success).toBe(false, 'Should exit non-zero');
    expect(result.error!.includes('Unknown phase subcommand')).toBeTruthy() // `Expected "Unknown phase subcommand" in stderr, got: ${result.error}`;
  });

  // Unknown subcommand: milestone
  test('milestone unknown subcommand errors', () => {
    const result = runEzTools('milestone bogus', tmpDir);
    expect(result?.success).toBe(false, 'Should exit non-zero');
    expect(result.error!.includes('Unknown milestone subcommand')).toBeTruthy() // `Expected "Unknown milestone subcommand" in stderr, got: ${result.error}`;
  });

  // Unknown subcommand: validate
  test('validate unknown subcommand errors', () => {
    const result = runEzTools('validate bogus', tmpDir);
    expect(result?.success).toBe(false, 'Should exit non-zero');
    expect(result.error!.includes('Unknown validate subcommand')).toBeTruthy() // `Expected "Unknown validate subcommand" in stderr, got: ${result.error}`;
  });

  // Unknown subcommand: todo
  test('todo unknown subcommand errors', () => {
    const result = runEzTools('todo bogus', tmpDir);
    expect(result?.success).toBe(false, 'Should exit non-zero');
    expect(result.error!.includes('Unknown todo subcommand')).toBeTruthy() // `Expected "Unknown todo subcommand" in stderr, got: ${result.error}`;
  });

  // Unknown subcommand: init
  test('init unknown workflow errors', () => {
    const result = runEzTools('init bogus', tmpDir);
    expect(result?.success).toBe(false, 'Should exit non-zero');
    expect(result.error!.includes('Unknown init workflow')).toBeTruthy() // `Expected "Unknown init workflow" in stderr, got: ${result.error}`;
  });
});

// ─── Dispatcher Routing Branches ─────────────────────────────────────────────

describe('dispatcher routing branches', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  // find-phase
  test('find-phase locates phase directory by number', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '01-test-phase');
    fs.mkdirSync(phaseDir, { recursive: true });

    const result = runEzTools('find-phase 01', tmpDir);
    expect(result?.success).toBe(true, `find-phase failed: ${result.error}`);
    expect(result.output.includes('01-test-phase')).toBeTruthy() // `Expected output to contain "01-test-phase", got: ${result.output}`;
  });

  // init resume
  test('init resume returns valid JSON', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'STATE.md'),
      '# Project State\n\n## Current Position\n\nPhase: 1 of 1 (Test)\nPlan: 01-01 complete\nStatus: Ready\nLast activity: 2026-01-01\n\nProgress: [##########] 100%\n\n## Session Continuity\n\nLast session: 2026-01-01\nStopped at: Test\nResume file: None\n'
    );

    const result = runEzTools('init resume', tmpDir);
    expect(result?.success).toBe(true, `init resume failed: ${result.error}`);
    const parsed = JSON.parse(result.output);
    expect(typeof parsed === 'object').toBeTruthy() // 'Output should be valid JSON object';
  });

  // init verify-work
  test('init verify-work returns valid JSON', () => {
    // Create STATE.md
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'STATE.md'),
      '# Project State\n\n## Current Position\n\nPhase: 1 of 1 (Test)\nPlan: 01-01 complete\nStatus: Ready\nLast activity: 2026-01-01\n\nProgress: [##########] 100%\n\n## Session Continuity\n\nLast session: 2026-01-01\nStopped at: Test\nResume file: None\n'
    );

    // Create ROADMAP.md with phase section
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      '# Roadmap\n\n## Milestone: v1.0 Test\n\n### Phase 1: Test Phase\n**Goal**: Test goal\n**Depends on**: None\n**Requirements**: TEST-01\n**Success Criteria**:\n  1. Tests pass\n**Plans**: 1 plan\nPlans:\n- [x] 01-01-PLAN.md\n\n## Progress\n\n| Phase | Plans | Status | Date |\n|-------|-------|--------|------|\n| 1 | 1/1 | Complete | 2026-01-01 |\n'
    );

    // Create phase dir
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '01-test');
    fs.mkdirSync(phaseDir, { recursive: true });

    const result = runEzTools('init verify-work 01', tmpDir);
    expect(result?.success).toBe(true, `init verify-work failed: ${result.error}`);
    const parsed = JSON.parse(result.output);
    expect(typeof parsed === 'object').toBeTruthy() // 'Output should be valid JSON object';
  });

  // roadmap update-plan-progress
  test('roadmap update-plan-progress updates phase progress', () => {
    // Create ROADMAP.md with progress table
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      '# Roadmap\n\n## Milestone: v1.0 Test\n\n### Phase 1: Test Phase\n**Goal**: Test goal\n**Depends on**: None\n**Requirements**: TEST-01\n**Success Criteria**:\n  1. Tests pass\n**Plans**: 1 plan\nPlans:\n- [ ] 01-01-PLAN.md\n\n## Progress\n\n| Phase | Plans | Status | Date |\n|-------|-------|--------|------|\n| 1 | 0/1 | Not Started | - |\n'
    );

    // Create phase dir with PLAN and SUMMARY
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '01-test-phase');
    fs.mkdirSync(phaseDir, { recursive: true });
    fs.writeFileSync(
      path.join(phaseDir, '01-01-PLAN.md'),
      '---\nphase: 01-test-phase\nplan: "01"\n---\n\n# Plan\n'
    );
    fs.writeFileSync(
      path.join(phaseDir, '01-01-SUMMARY.md'),
      '---\nphase: 01-test-phase\nplan: "01"\n---\n\n# Summary\n'
    );

    const result = runEzTools('roadmap update-plan-progress 1', tmpDir);
    expect(result?.success).toBe(true, `roadmap update-plan-progress failed: ${result.error}`);
  });

  // state (no subcommand) — default load
  test('state with no subcommand calls cmdStateLoad', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'STATE.md'),
      '# Project State\n\n## Current Position\n\nPhase: 1 of 1 (Test)\nPlan: 01-01 complete\nStatus: Ready\nLast activity: 2026-01-01\n\nProgress: [##########] 100%\n\n## Session Continuity\n\nLast session: 2026-01-01\nStopped at: Test\nResume file: None\n'
    );

    const result = runEzTools('state', tmpDir);
    expect(result?.success).toBe(true, `state load failed: ${result.error}`);
    const parsed = JSON.parse(result.output);
    expect(typeof parsed === 'object').toBeTruthy() // 'Output should be valid JSON object';
  });

  // summary-extract
  test('summary-extract parses SUMMARY.md frontmatter', () => {
    const phaseDir = path.join(tmpDir, '.planning', 'phases', '01-test');
    fs.mkdirSync(phaseDir, { recursive: true });

    const summaryContent = `---
phase: 01-test
plan: "01"
subsystem: testing
tags: [node, test]
duration: 5min
completed: "2026-01-01"
key-decisions:
  - "Used node:test"
requirements-completed: [TEST-01]
---

# Phase 1 Plan 01: Test Summary

**Tests added for core module**
`;

    const summaryPath = path.join(phaseDir, '01-01-SUMMARY.md');
    fs.writeFileSync(summaryPath, summaryContent);

    // Use relative path from tmpDir
    const result = runEzTools(`summary-extract .planning/phases/01-test/01-01-SUMMARY.md`, tmpDir);
    expect(result?.success).toBe(true, `summary-extract failed: ${result.error}`);
    const parsed = JSON.parse(result.output);
    expect(typeof parsed === 'object').toBeTruthy() // 'Output should be valid JSON object';
    expect(parsed.path).toBe('.planning/phases/01-test/01-01-SUMMARY.md', 'Path should match input');
    assert.deepStrictEqual(parsed.requirements_completed, ['TEST-01'], 'requirements_completed should contain TEST-01');
  });
});
