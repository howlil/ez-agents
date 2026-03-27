# Quick Task 260328-6dr: Legacy Code Cleanup

**Gathered:** 2026-03-28  
**Status:** Ready for execution

---

## Plan Overview

**Task:** Scan codebase for legacy/unused files and remove them  
**Scope:** Safe deletions only (build artifacts, empty directories)  
**Boundary:** No breaking changes - review required for deprecated code

---

## Tasks

### Task 1: Delete Empty Build Directories

**Files:** `dist/`, `hooks/dist/`  
**Action:** Remove empty build output directories  
**Verify:** Directories no longer exist  
**Done:** Build artifacts cleaned

```bash
# Check if directories are truly empty
rmdir dist 2>$null && Write-Host "dist/ deleted"
rmdir hooks\dist 2>$null && Write-Host "hooks/dist/ deleted"
```

---

### Task 2: Document Deprecated Code (No Deletion)

**Files:** `bin/lib/package-manager/package-manager-executor.ts` and others  
**Action:** Create cleanup recommendations doc  
**Verify:** Documentation created  
**Done:** Deprecated code tracked for future removal

**Deprecated items found:**
- 14 locations with `@deprecated` JSDoc tags
- 112 `_v1` skill files (versioning strategy unclear)
- 8 deprecated methods in package-manager-executor.ts

**Recommendation:** Create follow-up task for deprecated code removal after migration.

---

### Task 3: Review Potential Duplicates

**Files:** 
- `skills/architecture/hexagonal/hexagonal_architecture_v1/` vs `hexagonal_architecture_skill_v1/`
- `skills/observability/tracing/distributed_tracing_v1/` vs `skills/observability/distributed-tracing/distributed_tracing_v1/`

**Action:** List duplicates for manual review  
**Verify:** Review list created  
**Done:** Duplicates documented

---

## Must Haves

**Truths:**
- Build artifacts (`dist/`) are safe to delete
- Test fixtures must NOT be deleted
- Staging tests must NOT be deleted

**Artifacts:**
- `.planning/quick/260328-6dr-coba-lihat-semua-code-base-list-semua-fi/260328-6dr-SUMMARY.md`

**Key Links:**
- `.planning/STATE.md` - Project state tracking
- `.planning/ROADMAP.md` - Current milestone

---

## Verification

- [ ] `dist/` directory deleted
- [ ] `hooks/dist/` directory deleted
- [ ] Deprecated code documented
- [ ] Duplicate skills listed for review
- [ ] No test fixtures deleted
- [ ] No staging files deleted
