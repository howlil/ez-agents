# Plan 37-03 Summary: Tech Debt Hotspot Identification Engine

**Phase:** 37 — Context Engine Enhancement  
**Plan:** 03 — Tech Debt Hotspot Identification  
**Wave:** 2  
**Date:** 2026-03-21  
**Status:** ✅ COMPLETE

---

## Objective

Build the Tech Debt Hotspot Identification Engine — automated detection of TODO/FIXME/HACK markers, code complexity analysis, large file detection, duplicate code identification, and dependency risk analysis. Produces severity-scored tech debt reports.

---

## Deliverables

### Code Files Created/Modified

1. **bin/lib/tech-debt-analyzer.cjs** (and `ez-agents/bin/lib/tech-debt-analyzer.cjs`)
   - `TechDebtAnalyzer` class with:
     - `detectDebtMarkers(rootPath)` — Finds TODO/FIXME/HACK/XXX/BUG/DEPRECATED/OPTIMIZE/REFACTOR comments
     - `analyzeDependencyRisk(rootPath)` — npm audit parsing for vulnerabilities
     - `aggregateFindings(...)` — Combines all findings with severity scores
   - 8 marker patterns with severity scoring (Critical=4, High=3, Medium=2, Low=1)
   - Windows compatibility via pure JavaScript fallback (`_detectDebtMarkersJS`)

2. **bin/lib/code-complexity-analyzer.cjs** (and `ez-agents/bin/lib/code-complexity-analyzer.cjs`)
   - `CodeComplexityAnalyzer` class with:
     - `analyzeComplexity(rootPath)` — ESLint-based cyclomatic complexity analysis (async)
     - `detectLargeFiles(rootPath, thresholds)` — Files exceeding 500 lines or 100KB
     - `detectDuplicateCode(rootPath)` — Chunk-based hash comparison (10-line chunks, 5-line overlap)
   - Default thresholds: lines=500, sizeKB=100
   - Severity: lines>1000 = High, otherwise Medium

3. **tests/context/tech-debt-analyzer.test.cjs**
   - 11 test cases covering:
     - TODO comments with Low severity
     - FIXME comments with Medium severity
     - XXX comments with High severity
     - DEPRECATED comments with Critical severity
     - Results sorted by severity (Critical first)
     - File path and line number inclusion
     - npm audit JSON parsing
     - Risk objects with severity and score
     - aggregateFindings combining and sorting
     - getSummary with counts by type and severity
     - getByFile grouping findings

4. **tests/context/concerns-report.test.cjs**
   - 8 test cases covering:
     - Large files exceeding 500 lines threshold
     - High severity assignment for files >1000 lines
     - Results sorted by lines descending
     - ESLint complexity rules usage
     - High complexity function detection with fallback
     - Duplicate code detection with chunk hashing
     - Duplicate info with file count
     - Summary with counts by severity and rule

### Documentation Created

1. **`.planning/codebase/CONCERNS.md`**
   - Tech debt report output document
   - Contains:
     - Executive summary
     - Tech debt markers by severity
     - Code complexity analysis
     - Large file detection results
     - Duplicate code detection results
     - Security considerations
     - Performance bottlenecks
     - Fragile areas
     - Recommendations (Immediate, Short-Term, Medium-Term, Long-Term)

---

## Test Results

**All 19 tests passing:**
```
▶ CodeComplexityAnalyzer (67.9ms)
  ✔ detectLargeFiles (10.5ms)
  ✔ analyzeComplexity (4.7ms)
  ✔ detectDuplicateCode (48.5ms)
  ✔ getSummary (0.7ms)

▶ TechDebtAnalyzer (2421.3ms)
  ✔ detectDebtMarkers (810.2ms)
  ✔ analyzeDependencyRisk (1605.2ms)
  ✔ aggregateFindings (0.6ms)
  ✔ getSummary (0.4ms)
  ✔ getByFile (0.4ms)

ℹ tests 19
ℹ suites 11
ℹ pass 19
ℹ fail 0
```

---

## Key Implementation Details

### Severity Scoring System

| Marker     | Severity | Weight |
|------------|----------|--------|
| DEPRECATED | Critical | 4      |
| BUG        | High     | 3      |
| XXX        | High     | 3      |
| FIXME      | Medium   | 2      |
| HACK       | Medium   | 2      |
| REFACTOR   | Medium   | 2      |
| TODO       | Low      | 1      |
| OPTIMIZE   | Low      | 1      |

### Windows Compatibility

- Grep command unavailable on Windows
- Implemented `_detectDebtMarkersJS()` pure JavaScript fallback
- Recursively traverses directories
- Matches file extensions: `.ts`, `.tsx`, `.js`, `.cjs`, `.mjs`
- Searches for marker patterns in file content

### ESLint Integration

- `analyzeComplexity()` is async to support ESLint's async API
- Rules configured:
  - `complexity`: max 10
  - `max-depth`: max 4
  - `max-lines`: max 300
  - `max-params`: max 4
  - `max-statements`: max 30
- Fallback complexity analysis if ESLint not available

### Duplicate Detection Algorithm

1. Break files into 10-line chunks with 5-line overlap
2. Hash each chunk using MD5
3. Group chunks by hash
4. Identify duplicates (same hash in different files)
5. Report with file count and severity

---

## Commit Information

**Commit:** `ac2b889` (phase/36-skill-expansion branch)  
**Message:**
```
37-03: Tech Debt Hotspot Identification Engine

Implementation:
- TechDebtAnalyzer.detectDebtMarkers() with 8 marker patterns
- Severity scoring: Critical=4, High=3, Medium=2, Low=1
- Windows compatibility with pure JS fallback for grep
- CodeComplexityAnalyzer.analyzeComplexity() with ESLint integration (async)
- detectLargeFiles() with configurable thresholds (500 lines, 100KB)
- detectDuplicateCode() using chunk hashing (10-line chunks, 5-line overlap)
- aggregateFindings() combines all findings sorted by severity

Tests:
- tests/context/tech-debt-analyzer.test.cjs (11 test cases)
- tests/context/concerns-report.test.cjs (8 test cases)
- All 19 tests passing

Documentation:
- .planning/codebase/CONCERNS.md tech debt report

Fixes:
- Windows grep compatibility via _detectDebtMarkersJS() fallback
- async/await syntax in analyzeComplexity()
```

---

## Requirements Fulfilled

- ✅ CTXE-03: Tech debt hotspot identification
- ✅ Automated TODO/FIXME/HACK marker detection
- ✅ Code complexity analysis with ESLint
- ✅ Large file detection (500 lines, 100KB thresholds)
- ✅ Duplicate code detection via chunk hashing
- ✅ Dependency risk analysis via npm audit
- ✅ Severity scoring (Critical=4, High=3, Medium=2, Low=1)
- ✅ Results sorted by severity (Critical first)

---

## Next Steps

- Execute Plan 37-04 (if applicable)
- Update STATE.md with completion status
- Update ROADMAP.md with plan progress

---

*Summary generated as part of Phase 37-03 execution*
