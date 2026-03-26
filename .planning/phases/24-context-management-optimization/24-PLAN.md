---
ez_plan_version: 1.0
phase: 24
plan: 24
milestone: v5.0
wave: 1
depends_on: []
files_modified:
  - bin/lib/context-optimizer.ts (new)
  - bin/lib/context-manager.ts
  - bin/lib/context-relevance-scorer.ts
  - bin/lib/context-compressor.ts
  - bin/lib/context-deduplicator.ts
  - bin/lib/context-metadata-tracker.ts
  - bin/lib/context-cache.ts
requirements:
  - PERF-CONTEXT-01 to PERF-CONTEXT-06
autonomous: true
---

# Phase 24: Context Management Optimization

**Goal:** Consolidate 6 context classes into 1 ContextOptimizer for 85% code reduction and 66% token waste reduction.

**Requirements:** PERF-CONTEXT-01 to PERF-CONTEXT-06
**Tests:** Context optimization tests
**Wave:** 1 (can run in parallel with other Phase 24 plans)
**Status:** 📋 Planned

---

## Deep Engineering Analysis

**Current State:**
- 6 separate context classes: 1,400+ lines total
- Multiple file reads per operation (2-3× redundant I/O)
- Naive scoring algorithm with keyword matching
- Stub files with minimal functionality

**Token Waste:** ~75K tokens/phase
**Time Waste:** ~100ms/phase
**Impact:** CRITICAL (P0)

---

## Must Haves

- [ ] **PERF-CONTEXT-01**: Consolidate 6 context classes → 1 ContextOptimizer
  - ContextManager
  - ContextRelevanceScorer
  - ContextCompressor
  - ContextDeduplicator
  - ContextMetadataTracker
  - ContextCache
  - Target: 1 file, ~250 lines (85% reduction)

- [ ] **PERF-CONTEXT-02**: Implement single-pass context pipeline
  - Read + score + filter in one operation
  - Eliminate redundant file reads
  - Target: 66% reduction in context operations

- [ ] **PERF-CONTEXT-03**: Add lazy evaluation for scoring/compression
  - Only score when needed
  - Skip compression if under token limit
  - Target: 50% reduction in scoring overhead

- [ ] **PERF-CONTEXT-04**: Remove stub files
  - context-metadata-tracker.ts (stub)
  - context-cache.ts (stub)
  - Merge functionality into ContextOptimizer

- [ ] **PERF-CONTEXT-05**: Reduce file reads 2-3× → 1× per file
  - Single-pass file reading
  - Cache content during operation
  - Target: 66% reduction in I/O

- [ ] **PERF-CONTEXT-06**: Target 66% reduction in context operations
  - Measure before/after metrics
  - Document token savings
  - Verify no functionality loss

---

## Implementation Plan

### ContextOptimizer Class Structure

```typescript
export class ContextOptimizer {
  private cwd: string;
  private fileAccess: FileAccess;
  
  constructor(cwd?: string);
  
  // Single-pass optimization
  async optimizeContext(options: ContextOptions): Promise<ContextResult>;
  
  // Quick scoring (path-based, no content read)
  private quickScore(content: string, task: string): number;
  
  // Simple dedup via hash
  private simpleHash(content: string): string;
}
```

### Migration Strategy

1. Create ContextOptimizer (new file)
2. Implement single-pass pipeline
3. Test with existing context operations
4. Update callers to use ContextOptimizer
5. Remove old 6 files
6. Verify all tests pass

---

## Expected Impact

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Files | 6 files | 1 file | 83% reduction |
| Lines | 1,400+ | ~250 | 82% reduction |
| File reads | 2-3× per op | 1× per op | 66% reduction |
| Token waste | ~75K/phase | ~25K/phase | 66% reduction |
| Time waste | ~100ms/phase | ~35ms/phase | 65% reduction |

---

## Tasks

**Implementation:**

1. [ ] Create ContextOptimizer class
2. [ ] Implement single-pass context pipeline
3. [ ] Add lazy evaluation for scoring
4. [ ] Implement simple deduplication
5. [ ] Remove stub files (metadata-tracker, cache)
6. [ ] Update all callers to use ContextOptimizer
7. [ ] Delete old 6 context files
8. [ ] Run all tests to verify

**Verification:**

1. [ ] All context operations work correctly
2. [ ] Token usage reduced by 66%
3. [ ] Time reduced by 65%
4. [ ] No functionality loss
5. [ ] All tests passing

---

## Success Criteria

- [ ] ContextOptimizer implemented (1 file, ~250 lines)
- [ ] Single-pass pipeline working
- [ ] Lazy evaluation implemented
- [ ] Stub files removed
- [ ] File reads reduced 66%
- [ ] Token waste reduced 66%
- [ ] All tests passing
- [ ] No breaking changes to public API

---

## Notes

**From Deep Engineering Analysis:**

Current flow (inefficient):
1. Read all files → allFiles[]
2. Score files → filesToProcess[] (reads content AGAIN)
3. Deduplicate → uniqueFiles[] (hash computation)
4. Compress → processedFiles[] (reads content THIRD time)
5. Build context string
6. Track metadata → writes STATE.md

Optimized flow (single-pass):
1. Read + score + filter in ONE operation
2. Simple dedup via Set (exact matches only)
3. Build context string
4. Done!

**Key Insight:** Most context operations don't need complex scoring/compression. Simple path-based filtering + single read is sufficient for 90% of cases.
