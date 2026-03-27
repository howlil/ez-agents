# Quick Task 260328-72l: Fix All Test Failures (Iterative Loop)

**Gathered:** 2026-03-28  
**Status:** Ready for execution

---

## Plan Overview

**Task:** Fix all test failures iteratively until 0 errors  
**Scope:** All failing tests (currently 101 from v5.0)  
**Boundary:** Max 4 iterations, then document remaining issues  
**Strategy:** Run → Analyze → Fix → Repeat

---

## Tasks

### Iteration Loop (Max 4 cycles)

**Each Iteration:**
1. Run `npm run test` and capture failures
2. Analyze top 5-10 failures
3. Fix root causes (not symptoms)
4. Re-run tests
5. Count remaining failures

**Exit Conditions:**
- ✅ 0 failures → Success
- ⚠️ No progress (same count) → Document & stop
- ⚠️ Max iterations (4) → Document remaining

---

### Task 1: Baseline Test Run

**Command:** `npm run test`  
**Action:** Get current failure count  
**Verify:** Failure count documented  
**Done:** Baseline established

---

### Task 2-5: Fix Iterations (1-4)

**Each iteration:**
- Analyze failure patterns
- Fix common root causes first
- Update test expectations if needed
- Re-run and count

---

## Must Haves

**Truths:**
- 101 failures from v5.0 (documented)
- Some may need test expectation updates
- Some may need code fixes
- Some may need to be skipped/removed

**Artifacts:**
- `.planning/quick/260328-72l-*/260328-72l-SUMMARY.md`
- `.planning/quick/260328-72l-*/iteration-*.log`

**Key Links:**
- `.planning/STATE.md` - Project state tracking

---

## Verification

- [ ] Baseline failure count captured
- [ ] Iteration 1 complete
- [ ] Iteration 2 complete (if needed)
- [ ] Iteration 3 complete (if needed)
- [ ] Iteration 4 complete (if needed)
- [ ] Final count: 0 or documented remaining
- [ ] All fixes committed
