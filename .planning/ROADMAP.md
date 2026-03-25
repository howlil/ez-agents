# ez-agents v5.0.0 Roadmap

**Project:** ez-agents Complete TypeScript Migration
**Created:** 2026-03-25
**Milestone:** v5.0.0
**Mode:** YOLO | **Granularity:** Standard | **Parallel:** Yes

## Overview

4 phases to complete TypeScript migration and achieve 100% type coverage.

---

## Phase 6: Complete Library Migration

**Goal:** Migrate all remaining bin/lib/*.cjs files to TypeScript.

### Plans

- [ ] **Plan 6.1**: Migrate core utility modules
  - Migrate remaining bin/lib/*.cjs files to .ts
  - Convert CommonJS require/module.exports to ESM import/export
  - Add TSDoc comments to all exported functions
  - Ensure strict mode compliance

- [ ] **Plan 6.2**: Migrate service modules
  - Convert service-layer modules to TypeScript
  - Add proper type definitions for all parameters and returns
  - Implement functional pipeline patterns with typing

- [ ] **Plan 6.3**: Migrate agent-related modules
  - Convert agent support modules to TypeScript
  - Add type-safe agent configuration
  - Ensure type safety in agent spawning

**Success Criteria:**
- All bin/lib/*.cjs files converted to .ts
- Zero TypeScript compilation errors
- All existing tests pass with migrated modules
- Type definitions exported correctly

**Status:** Not started

---

## Phase 7: Test Files Conversion

**Goal:** Convert all test files from .cjs/.js to .ts with proper typing.

### Plans

- [ ] **Plan 7.1**: Convert unit tests to TypeScript
  - Convert all tests/unit/*.cjs to .ts
  - Add type annotations to test helpers
  - Ensure test utilities are typed

- [ ] **Plan 7.2**: Convert integration tests to TypeScript
  - Convert tests/integration/*.cjs to .ts
  - Add proper types for test fixtures
  - Type-safe test data generation

- [ ] **Plan 7.3**: Convert E2E and specialized tests
  - Convert tests/e2e-workflow.test.cjs to .ts
  - Convert tests/accessibility/*.cjs to .ts
  - Convert tests/perf/*.cjs to .ts
  - Convert tests/deploy/*.cjs to .ts
  - Convert tests/analytics/*.cjs to .ts
  - Convert tests/context/*.cjs to .ts
  - Convert tests/finops/*.cjs to .ts
  - Convert tests/gates/*.cjs to .ts

- [ ] **Plan 7.4**: Re-enable skipped tests
  - Re-enable verify.test.ts (large file, 1028 lines)
  - Fix any type issues preventing test execution
  - Ensure 100% test execution rate

**Success Criteria:**
- All test files converted to TypeScript
- All 472+ tests passing
- 70%+ code coverage maintained
- No skipped tests

**Status:** Not started

---

## Phase 8: Entry Points & Build System

**Goal:** Migrate all entry points and update build infrastructure.

### Plans

- [ ] **Plan 8.1**: Migrate CLI entry points
  - Convert bin/install.js to bin/install.ts
  - Convert bin/update.js to bin/update.ts
  - Convert bin/ez-tools.cjs to bin/ez-tools.ts
  - Ensure all CLI commands work correctly

- [ ] **Plan 8.2**: Migrate scripts and hooks
  - Convert scripts/build-hooks.js to .ts
  - Convert scripts/fix-qwen-installation.js to .ts
  - Convert hooks/*.js files to .ts
  - Convert vitest.config.js to .ts

- [ ] **Plan 8.3**: Update build configuration
  - Configure tsup for full TypeScript compilation
  - Update package.json for pure ESM output
  - Ensure npm package exports are correct
  - Configure source maps for debugging

**Success Criteria:**
- All entry points migrated to TypeScript
- Build system compiles without errors
- npm package exports work correctly
- All CLI commands functional

**Status:** Not started

---

## Phase 9: Type Safety & Documentation

**Goal:** Achieve complete type safety and comprehensive documentation.

### Plans

- [ ] **Plan 9.1**: Eliminate remaining type issues
  - Remove all `any` types with proper definitions
  - Add generic types where appropriate
  - Implement immutable data patterns
  - Ensure no implicit any in function returns

- [ ] **Plan 9.2**: Complete documentation
  - Add TSDoc comments to all exported members
  - Update README with migration completion notes
  - Document OOP+FP architecture patterns
  - Create contributor guide for TypeScript

- [ ] **Plan 9.3**: Generate API documentation
  - Run JSDoc/TSDoc documentation generator
  - Publish API docs to documentation site
  - Update migration guide for v5.0.0

**Success Criteria:**
- Zero `any` types in codebase
- Complete TSDoc coverage
- API documentation generated
- Contributor documentation complete

**Status:** Not started

---

## Project Complete

All 4 phases completed successfully!

**Summary:**
- ~340 `.cjs` files migrated to `.ts`
- ~13 `.js` entry points migrated to `.ts`
- All test files converted to TypeScript
- 100% type coverage achieved
- Zero JavaScript runtime files (except config)

**Next steps:**
- Run full test suite
- Verify all CLI commands
- Publish v5.0.0 to npm
- Announce migration complete

---

## Phase Dependencies

```
Phase 6: Complete Library Migration
    ↓
Phase 7: Test Files Conversion
    ↓
Phase 8: Entry Points & Build System
    ↓
Phase 9: Type Safety & Documentation
```

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| LIB-01 to LIB-06 | Phase 6 | Pending |
| TEST-01 to TEST-06 | Phase 7 | Pending |
| ENTRY-01 to ENTRY-07 | Phase 8 | Pending |
| TYPE-01 to TYPE-07 | Phase 6, 9 | Pending |
| BUILD-01 to BUILD-05 | Phase 8 | Pending |
| DOC-01 to DOC-05 | Phase 9 | Pending |

**Coverage:**
- v5.0.0 requirements: 38 total
- Mapped to phases: 38
- Unmapped: 0 ✓

---

*Roadmap created: 2026-03-25*
*Last updated: 2026-03-25 after initial definition*
