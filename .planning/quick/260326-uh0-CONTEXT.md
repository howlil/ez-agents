# Quick Task 260326-uh0 — Fix All Test Failures (0 Test Fail Goal)

**Created:** 2026-03-26
**Status:** In Progress
**Mode:** YOLO

---

## Task Description

Fix all remaining test failures to achieve 0 test fail.

## Current State

- **Total Tests:** 191
- **Passing:** 172 (90%)
- **Failing:** 19

## Failure Categories & Fixes

### 1. Shebang Line Issues (11 files)
**Error:** `Invalid Character '!'` at line 1
**Fix:** Remove `#!/usr/bin/env node` from test files

Files:
- tests/unit/revision-loop.test.ts
- tests/unit/skill-resolver.test.ts
- tests/unit/skill-validator.test.ts
- tests/unit/tradeoff-analyzer.test.ts
- tests/unit/url-fetch.test.ts
- (6 more)

### 2. Import Path Issues (Analytics - 4 files)
**Error:** `collector.track is not a function`
**Fix:** Apply ESM import pattern

Files:
- tests/analytics/analytics-collector.test.ts
- tests/analytics/analytics-reporter.test.ts
- tests/analytics/analytics-cli.test.ts
- tests/analytics/cohort-analyzer.test.ts

### 3. Test Logic Issues (11 tests in core.test.ts)
**Error:** Expected `undefined` but got `null`
**Fix:** Update test expectations from `toBeUndefined()` to `toBeNull()`

Tests:
- loadConfig: returns model_overrides as null when not in config
- generateSlugInternal: returns null for null input
- generateSlugInternal: returns null for empty string
- safeReadFile: returns null for missing file
- searchPhaseInDir: returns null when phase not found
- findPhaseInternal: returns null for non-existent phase
- findPhaseInternal: returns null for null phase
- getRoadmapPhaseInternal: returns null goal when Goal uses colon-outside-bold format
- getRoadmapPhaseInternal: returns null when roadmap missing
- getRoadmapPhaseInternal: returns null when phase not in roadmap
- getRoadmapPhaseInternal: returns null for null phase number

### 4. Other Import Issues (Deploy/Perf tests)
**Error:** `expected undefined to be defined`
**Fix:** Apply ESM import pattern

---

## Execution Plan

1. Remove shebang lines from 11 test files
2. Fix analytics tests (4 files) - apply ESM imports
3. Fix core.test.ts expectations (11 tests) - change to toBeNull()
4. Fix deploy/perf test imports
5. Run `npx vitest run` - verify 0 failures

---

*Quick task created: 2026-03-26*
