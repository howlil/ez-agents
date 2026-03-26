/**
 * EZ Tools - End-to-End Workflow Tests
 *
 * Comprehensive E2E tests that simulate complete user workflows:
 * - New project initialization
 * - Phase lifecycle (add, complete, remove)
 * - Milestone management
 * - State management across sessions
 *
 * These tests verify the complete user journey from project setup to milestone completion.
 */



import * as fs from 'fs';
import * as path from 'path';
import { runEzTools, createTempProject, createTempGitProject, cleanup } from '../helpers.ts';

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Initialize a minimal project structure for E2E testing
 */
function initMinimalProject(tmpDir) {
  // Create PROJECT.md
  fs.writeFileSync(
    path.join(tmpDir, '.planning', 'PROJECT.md'),
    `# Test Project

## What This Is

A test project for E2E workflow validation.

## Core Value

Provides automated testing of EZ Agents workflows.

## Requirements

- REQ-01: Project initialization
- REQ-02: Phase management
- REQ-03: Milestone tracking
`
  );

  // Create ROADMAP.md
  fs.writeFileSync(
    path.join(tmpDir, '.planning', 'ROADMAP.md'),
    `# Roadmap

## Milestone v1.0 - MVP

### Phase 1: Project Setup

**Goal**: Initialize project structure

**Requirements**: REQ-01

### Phase 2: Core Features

**Goal**: Implement core functionality

**Requirements**: REQ-02

### Phase 3: Testing

**Goal**: Add comprehensive tests

**Requirements**: REQ-03
`
  );

  // Create STATE.md
  fs.writeFileSync(
    path.join(tmpDir, '.planning', 'STATE.md'),
    `# Session State

## Current Position

**Milestone:** v1.0 MVP
**Current phase:** 1
**Status:** In Progress

## Session Log

- ${new Date().toISOString().split('T')[0]}: Project initialized
`
  );

  // Create config.json
  fs.writeFileSync(
    path.join(tmpDir, '.planning', 'config.json'),
    JSON.stringify({
      model_profile: 'balanced',
      commit_docs: true,
      workflow: {
        nyquist_validation: true
      }
    }, undefined, 2)
  );

  // Create requirements tracking
  fs.writeFileSync(
    path.join(tmpDir, '.planning', 'REQUIREMENTS.md'),
    `# Requirements Traceability

| ID | Requirement | Phase | Status | Notes |
|----|-------------|-------|--------|-------|
| REQ-01 | Project initialization | 1 | In Progress | |
| REQ-02 | Phase management | 2 | Not Started | |
| REQ-03 | Milestone tracking | 3 | Not Started | |
`
  );
}

/**
 * Create a phase directory with plan and summary
 */
function createPhaseWithPlan(tmpDir, phaseNum, phaseName, planCount = 1) {
  const phaseDir = path.join(tmpDir, '.planning', 'phases', phaseNum);
  fs.mkdirSync(phaseDir, { recursive: true });

  for (let i = 1; i <= planCount; i++) {
    const planNum = String(i).padStart(2, '0');
    fs.writeFileSync(
      path.join(phaseDir, `${planNum}-PLAN.md`),
      `---
phase: ${phaseNum}
plan: ${planNum}
type: feature
wave: 1
depends_on: []
files_modified: []
autonomous: true
must_haves: []
---

# Plan ${phaseNum}-${planNum}

<objective>Test objective</objective>

<task>
  <name>Test Task</name>
  <action>Implement feature</action>
  <verify>Verify implementation</verify>
  <done>Task completed</done>
  <files>
    - src/test.js
  </files>
</task>
`
    );

    fs.writeFileSync(
      path.join(phaseDir, `${planNum}-SUMMARY.md`),
      `# Summary ${phaseNum}-${planNum}

## Files Created

- \`src/test.js\`

## Commits

- abc1234 - Initial implementation

## Self-Check

✅ All tasks completed successfully
`
    );
  }
}

// ─── E2E Workflow Tests ──────────────────────────────────────────────────────

describe('E2E: Complete Project Lifecycle', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempGitProject();
    initMinimalProject(tmpDir);
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('complete workflow: health check → phase management → milestone complete', () => {
    // Step 1: Initial health check - should be at least not broken
    const healthResult = runEzTools(['validate', 'health'], tmpDir);
    expect(healthResult.success).toBe(true, 'Health check should succeed');
    const healthOutput = JSON.parse(healthResult.output);
    expect(['healthy').toBeTruthy() // 'degraded'].includes(healthOutput.status, `Initial health should be healthy or degraded, got ${healthOutput.status}`);

    // Step 2: Analyze roadmap (phases info)
    const roadmapResult = runEzTools(['roadmap', 'analyze'], tmpDir);
    expect(roadmapResult.success).toBe(true, 'Roadmap analyze should succeed');

    // Step 3: Create phase 1 with plans
    createPhaseWithPlan(tmpDir, '01-setup', 'Project Setup', 2);

    // Step 4: Verify phase completeness
    const verifyPhaseResult = runEzTools(['verify', 'phase-completeness', '1'], tmpDir);
    expect(verifyPhaseResult.success).toBe(true, 'Phase verification should succeed');
    const verifyOutput = JSON.parse(verifyPhaseResult.output);
    expect(verifyOutput.complete).toBe(true, 'Phase should be complete');

    // Step 5: Get state snapshot
    const stateResult = runEzTools(['state', 'load'], tmpDir);
    expect(stateResult.success).toBe(true, 'State load should succeed');
    const stateOutput = JSON.parse(stateResult.output);
    expect(stateOutput.state_exists !== undefined).toBeTruthy() // 'Should have state info';

    // Step 6: Health check should still work with phase data
    const healthResult2 = runEzTools(['validate', 'health'], tmpDir);
    expect(healthResult2.success).toBe(true, 'Health check should succeed');
    const healthOutput2 = JSON.parse(healthResult2.output);
    expect(['healthy').toBeTruthy() // 'degraded'].includes(healthOutput2.status, 'Health should be healthy or degraded');
  });

  test('phase lifecycle: create → verify → complete', () => {
    // Create phase 1
    const phase1Dir = path.join(tmpDir, '.planning', 'phases', '01-setup');
    fs.mkdirSync(phase1Dir, { recursive: true });

    // Add a plan
    fs.writeFileSync(
      path.join(phase1Dir, '01-PLAN.md'),
      `---
phase: 01
plan: 01
type: feature
wave: 1
depends_on: []
files_modified: []
autonomous: true
must_haves: []
---

# Plan

<objective>Setup project</objective>

<task>
  <name>Initialize</name>
  <action>Run init</action>
  <verify>Check files</verify>
  <done>Done</done>
  <files>
    - package.json
  </files>
</task>
`
    );

    // Verify phase is incomplete (no summary yet)
    const verifyIncomplete = runEzTools(['verify', 'phase-completeness', '1'], tmpDir);
    expect(verifyIncomplete.success).toBe(true);
    const verifyIncompleteOutput = JSON.parse(verifyIncomplete.output);
    assert.strictEqual(verifyIncompleteOutput.complete, false, 'Phase should be incomplete without summary');

    // Add summary
    fs.writeFileSync(
      path.join(phase1Dir, '01-SUMMARY.md'),
      `# Summary

## Files Created

- \`package.json\`

## Commits

- def5678 - Project setup

## Self-Check

✅ All tasks complete
`
    );

    // Verify phase is now complete
    const verifyComplete = runEzTools(['verify', 'phase-completeness', '1'], tmpDir);
    expect(verifyComplete.success).toBe(true);
    const verifyCompleteOutput = JSON.parse(verifyComplete.output);
    assert.strictEqual(verifyCompleteOutput.complete, true, 'Phase should be complete with summary');
  });

  test('state management: load → update → verify persistence', () => {
    // Load initial state
    const loadResult = runEzTools(['state', 'load'], tmpDir);
    expect(loadResult.success).toBe(true, 'State load should succeed');

    // Update state field
    const updateResult = runEzTools(['state', 'update', 'current_phase', '2'], tmpDir);
    expect(updateResult.success).toBe(true, 'State update should succeed');

    // Load state again to verify persistence
    const loadResult2 = runEzTools(['state', 'load'], tmpDir);
    expect(loadResult2.success).toBe(true, 'State reload should succeed');

    // Verify the update persisted (check STATE.md file directly)
    const stateContent = fs.readFileSync(path.join(tmpDir, '.planning', 'STATE.md'), 'utf-8');
    expect(stateContent.includes('2')).toBeTruthy() // 'State should contain updated phase number';
  });

  test('roadmap analyze with disk status', () => {
    // Create phase directory
    createPhaseWithPlan(tmpDir, '01-setup', 'Setup');

    // Analyze roadmap
    const analyzeResult = runEzTools(['roadmap', 'analyze'], tmpDir);
    expect(analyzeResult.success).toBe(true, 'Roadmap analyze should succeed');
    const analyzeOutput = JSON.parse(analyzeResult.output);

    expect(analyzeOutput.phases).toBeTruthy() // 'Should have phases array';
    expect(analyzeOutput.phases.length > 0).toBeTruthy() // 'Should have at least one phase';

    // Check that disk status is included
    const phase1 = analyzeOutput.phases.find(p => p.phase === '1' || p.phase === '01');
    if (phase1) {
      expect('disk_status' in phase1 || 'status' in phase1).toBeTruthy() // 'Phase should have disk status';
    }
  });
});

describe('E2E: Error Handling and Edge Cases', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('health check with missing critical files', () => {
    // Only create .planning directory, no files inside
    const healthResult = runEzTools(['validate', 'health'], tmpDir);
    expect(healthResult.success).toBe(true, 'Health check should succeed');
    const healthOutput = JSON.parse(healthResult.output);
    expect(healthOutput.status).toBe('broken', 'Status should be broken');
    expect(healthOutput.errors.length > 0).toBeTruthy() // 'Should have errors';
  });

  test('phase operations with invalid phase numbers', () => {
    // Try to verify nonexistent phase
    const verifyResult = runEzTools(['verify', 'phase-completeness', '999'], tmpDir);
    expect(verifyResult.success).toBe(true, 'Command should succeed');
    const verifyOutput = JSON.parse(verifyResult.output);
    expect(verifyOutput.error).toBeTruthy() // 'Should have error for nonexistent phase';

    // Try to get nonexistent phase from roadmap
    const getPhaseResult = runEzTools(['roadmap', 'get-phase', '999'], tmpDir);
    expect(getPhaseResult.success).toBe(true);
    const getPhaseOutput = JSON.parse(getPhaseResult.output);
    expect(getPhaseOutput.error || !getPhaseOutput.content).toBeTruthy() // 'Should indicate phase not found';
  });

  test('state operations with missing STATE.md', () => {
    // Don't create STATE.md
    const stateResult = runEzTools(['state', 'load'], tmpDir);
    expect(stateResult.success).toBe(true, 'State load should succeed');
    const stateOutput = JSON.parse(stateResult.output);
    expect(stateOutput.state_exists).toBe(false, 'STATE.md should not exist');
  });

  test('config operations with invalid JSON', () => {
    // Create invalid config.json
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'config.json'),
      '{invalid json'
    );

    const healthResult = runEzTools(['validate', 'health'], tmpDir);
    expect(healthResult.success).toBe(true);
    const healthOutput = JSON.parse(healthResult.output);
    expect(healthOutput.errors.some(e => e.code === 'E005')).toBeTruthy() // 'Should have E005 error for invalid JSON';
  });
});

describe('E2E: Multi-Phase Workflow', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempGitProject();
    initMinimalProject(tmpDir);
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('multiple phases with dependencies', () => {
    // Create ROADMAP.md first
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      `# Roadmap

## Milestone v1.0

### Phase 1: Setup

**Goal**: Initialize project structure

### Phase 2: Development

**Goal**: Implement core features

### Phase 3: Testing

**Goal**: Add comprehensive tests
`
    );

    // Create multiple phases
    createPhaseWithPlan(tmpDir, '01-setup', 'Setup', 1);
    createPhaseWithPlan(tmpDir, '02-development', 'Development', 2);
    createPhaseWithPlan(tmpDir, '03-testing', 'Testing', 1);

    // Analyze roadmap to see all phases
    const roadmapResult = runEzTools(['roadmap', 'analyze'], tmpDir);
    expect(roadmapResult.success).toBe(true, 'Roadmap analyze should succeed');
    const roadmapOutput = JSON.parse(roadmapResult.output);
    expect(roadmapOutput.phases !== undefined).toBeTruthy() // 'Should have phases array';

    // Get each phase using roadmap get-phase
    for (const phaseNum of ['1', '2', '3']) {
      const getPhaseResult = runEzTools(['roadmap', 'get-phase', phaseNum], tmpDir);
      expect(getPhaseResult.success).toBe(true, `Get phase ${phaseNum} should succeed`);
      // Response may have 'found: false' if phase not in ROADMAP.md, but command succeeds
      const phaseOutput = JSON.parse(getPhaseResult.output);
      // Just verify command succeeded (output is valid JSON)
      expect(phaseOutput !== null).toBeTruthy() // `Phase ${phaseNum} should return valid JSON`;
    }

    // Health check should work
    const healthResult = runEzTools(['validate', 'health'], tmpDir);
    expect(healthResult.success).toBe(true);
    const healthOutput = JSON.parse(healthResult.output);
    expect(['healthy').toBeTruthy() // 'degraded'].includes(healthOutput.status, 'Should be healthy with all phases');
  });

  test('phase numbering with decimal phases', () => {
    // Create base phase
    createPhaseWithPlan(tmpDir, '01-setup', 'Setup', 1);

    // Create decimal phase
    const decimalPhaseDir = path.join(tmpDir, '.planning', 'phases', '01.1-extension');
    fs.mkdirSync(decimalPhaseDir, { recursive: true });
    fs.writeFileSync(
      path.join(decimalPhaseDir, '01-PLAN.md'),
      `---
phase: 01.1
plan: 01
type: extension
wave: 1
depends_on: []
files_modified: []
autonomous: true
must_haves: []
---

# Decimal Phase Plan

<objective>Extend base phase</objective>

<task>
  <name>Extension Task</name>
  <action>Extend functionality</action>
  <verify>Verify extension</verify>
  <done>Extension complete</done>
  <files>
    - src/extension.js
  </files>
</task>
`
    );
    fs.writeFileSync(
      path.join(decimalPhaseDir, '01-SUMMARY.md'),
      `# Decimal Phase Summary

## Files Created

- \`src/extension.js\`

## Commits

- fedcba9 - Extension implemented

## Self-Check

✅ Extension complete
`
    );

    // Analyze roadmap should work with decimal phases
    const roadmapResult = runEzTools(['roadmap', 'analyze'], tmpDir);
    expect(roadmapResult.success).toBe(true, 'Roadmap analyze should handle decimal phases');
    const roadmapOutput = JSON.parse(roadmapResult.output);
    expect(roadmapOutput.phases !== undefined).toBeTruthy() // 'Should have phases array';

    // Health check should work
    const healthResult = runEzTools(['validate', 'health'], tmpDir);
    expect(healthResult.success).toBe(true);
    const healthOutput = JSON.parse(healthResult.output);
    expect(['healthy').toBeTruthy() // 'degraded'].includes(healthOutput.status, 'Should handle decimal phases correctly');
  });
});
