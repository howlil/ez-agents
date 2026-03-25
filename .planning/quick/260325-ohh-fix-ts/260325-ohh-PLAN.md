# Quick Plan 260325-ohh: Fix TypeScript Errors

**Created:** 2026-03-25
**Type:** Quick Task
**Mode:** Quick (standard)

---

## Analysis

**Total errors:** 850 TypeScript errors in 111 files

### Error Categories

1. **Stale `.cjs` imports** (~3 errors)
   - `context-manager.ts` importing from `.cjs` files that are now `.ts`

2. **Module export/import issues** (~20 errors)
   - `core.ts` - `auditExec` import from `safe-exec.js`
   - Various files with incorrect import patterns

3. **Null/undefined safety** (~400 errors)
   - Missing optional chaining (`?.`)
   - Missing null checks before array access
   - `match.index` possibly undefined
   - Array access possibly undefined

4. **Type annotations** (~200 errors)
   - `unknown` types needing type guards
   - Boolean assigned to string type
   - Function parameter type mismatches

5. **Test runner types** (~200 errors)
   - `test` function not recognized
   - Missing `@types/node` test types
   - `test.skip` not available

6. **Function signature mismatches** (~50 errors)
   - Wrong number of arguments
   - Parameter type mismatches

7. **Module resolution** (~20 errors)
   - `madge` module not found
   - Private member access

---

## Tasks

### Task 1: Fix Import Paths

Fix stale `.cjs` and `.js` imports to use `.ts` extension:

- **Files:** `bin/lib/context-manager.ts`
- **Action:** Change `./file-access.cjs` → `./file-access`, `./url-fetch.cjs` → `./url-fetch`, `./content-scanner.cjs` → `./content-scanner`
- **Verify:** No more `.cjs` imports in source files
- **Done:** Import paths corrected

### Task 2: Fix Module Exports/Imports

Fix incorrect import patterns:

- **Files:** `bin/lib/core.ts`, `bin/lib/safe-exec.ts`
- **Action:** Fix `auditExec` export/import pattern
- **Verify:** No TS2614 errors
- **Done:** Module imports work correctly

### Task 3: Fix Null/Undefined Safety (High Impact)

Add optional chaining and null checks:

- **Files:** `bin/lib/core.ts`, `bin/lib/constraint-extractor.ts`, `bin/lib/dependency-graph.ts`, `bin/lib/deploy/deploy-runner.ts`
- **Action:** Add `?.` for possibly undefined, check array access
- **Verify:** TS18048, TS2532 errors resolved
- **Done:** Null safety added

### Task 4: Fix Type Annotations

Add proper type annotations and type guards:

- **Files:** `bin/lib/constraint-extractor.ts`, `bin/lib/frontmatter.ts`, `bin/lib/gates/gate-01-requirement.ts`, `bin/lib/index.ts`
- **Action:** Add type guards for `unknown`, fix boolean/string mismatches
- **Verify:** TS2322, TS2345, TS18046 errors resolved
- **Done:** Types are correct

### Task 5: Fix Test Files

Add test runner types and fix test signatures:

- **Files:** `tests/**/*.ts`
- **Action:** Import `test` from `node:test`, fix function signatures
- **Verify:** TS2593 errors resolved
- **Done:** Tests type-check correctly

### Task 6: Fix Remaining Errors

Fix remaining type errors:

- **Files:** All files with remaining errors
- **Action:** Fix function signatures, module resolution, private access
- **Verify:** `npm run typecheck` passes with 0 errors
- **Done:** All TypeScript errors fixed

---

## Must Haves

- [ ] All 850 TypeScript errors fixed
- [ ] `npm run typecheck` passes with 0 errors
- [ ] No breaking changes to public APIs
- [ ] Atomic commits per logical group
- [ ] Summary documenting fixes

---

## Output

**Summary:** `.planning/quick/260325-ohh-fix-ts/260325-ohh-SUMMARY.md`
