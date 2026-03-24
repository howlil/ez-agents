# Phase 45: Dynamic Wave Execution - Research

**Gathered:** 2026-03-24
**Status:** Ready for planning
**Researcher:** ez-phase-researcher

---

## RESEARCH COMPLETE

### 1. Current Wave Assignment Implementation

**Location:** `bin/lib/task-graph.cjs`

The system **already uses dynamic wave computation** via `topologicalGenerations()` from `graphology-dag` (Kahn's algorithm):

```javascript
computeWaves() {
  try {
    return topologicalGenerations(this._graph);
  } catch (error) {
    throw new Error('Unable to compute waves - graph may contain cycles');
  }
}
```

**Current behavior:**
- Wave 0: Tasks with no dependencies
- Wave 1: Tasks depending only on Wave 0 tasks
- Wave N: Tasks depending on Wave N-1 tasks

**Key insight:** The "static wave assignment" mentioned in the phase goal likely refers to **how plans specify their wave in frontmatter**, not the underlying computation engine.

### 2. Current Plan Frontmatter Wave Assignment

**Problem:** Plans currently specify `wave: N` statically in frontmatter:

```yaml
phase: "45"
plan: "01"
wave: 2  # ← Static assignment
depends_on: ["45-02"]
```

**Issue:** This requires the planner to manually compute waves, which is error-prone and doesn't adapt to changes in dependencies.

### 3. Dependency Tracking Between Plans

**Current mechanism:**
- Plans specify `depends_on` in frontmatter (array of plan IDs)
- `bin/lib/phase.cjs` - `cmdPhasePlanIndex()` groups plans by wave
- `TaskGraph` class builds DAG from plan dependencies

**Validation:** `bin/lib/verify.cjs` checks wave/dependency consistency:
```javascript
if (fm.wave && parseInt(fm.wave) > 1 && (!fm.depends_on || fm.depends_on.length === 0)) {
  warnings.push('Wave > 1 but depends_on is empty');
}
```

### 4. Resource-Aware Parallelism

**Current configuration:** `.planning/config.json`
```json
{
  "parallelization": true
}
```

**Current execution:** `execute-phase.md` workflow spawns all agents in a wave in parallel via `Task` tool.

**Gap:** No `maxParallel` config to limit concurrent agents for resource-constrained environments.

### 5. Failure Handling in Wave Execution

**Current behavior** (from `execute-phase.md`):
- Each wave executes all plans in parallel
- If one plan fails, the wave continues
- After wave completes, failures are reported
- User decides how to proceed

**Gap:** No automatic retry, no graceful degradation, no dependency-aware failure propagation.

### 6. Executor-Agent Implementation

**Main workflow:** `ez-agents/workflows/execute-phase.md`

**Execution flow:**
1. Load phase context via `ez-tools init`
2. Parse PLAN.md files, extract `wave` from frontmatter
3. Group by wave number
4. Execute waves sequentially
5. Within each wave: spawn `ez-executor` agents in parallel
6. Verify phase goal with `ez-verifier`
7. Update roadmap

### 7. Best Practices for Dynamic Task Scheduling

**Key patterns from codebase:**

1. **DAG-based scheduling** (already implemented):
   - Use `graphology-dag` for topological sorting
   - `topologicalGenerations()` for wave computation

2. **Dependency-first execution**:
   - Tasks with no dependencies execute first
   - Each wave only depends on completed waves

3. **Parallel within waves**:
   - All tasks in a wave can execute simultaneously
   - No inter-dependencies within a wave

### 8. Potential Pitfalls and Edge Cases

**Identified risks:**

1. **Circular dependencies:**
   - Already handled by `TaskGraph.detectCycles()`
   - Throws error with cycle path

2. **Orphaned tasks:**
   - Tasks referencing non-existent dependencies
   - Currently handled by adding phantom nodes in `buildDAG()`

3. **Wave computation with missing plans:**
   - If Plan A depends on Plan B, but Plan B doesn't exist
   - Current code adds phantom node, but wave computation may be incorrect

4. **Resource exhaustion:**
   - Large waves (10+ plans) may exhaust API rate limits or system resources
   - No current `maxParallel` limit

5. **Failure cascades:**
   - If Wave 1 fails, Wave 2 dependents will fail
   - No automatic retry or fallback

### 9. Implementation Recommendations for Phase 45

**WAVE-01: Dynamic Wave Computation**

1. **Remove static `wave` from plan frontmatter** (or make it optional)
2. **Compute waves at execution time** based on `depends_on`:
   ```javascript
   // In execute-phase or phase.cjs
   const planGraph = new TaskGraph();
   planGraph.buildDAG(plans.map(p => ({ id: p.id, dependencies: p.depends_on })));
   const waves = planGraph.computeWaves();
   // waves = [['45-01', '45-03'], ['45-02'], ['45-04']]
   ```
3. **Update plan frontmatter validation** to not require `wave` field

**WAVE-02: Resource-Aware Parallelism**

1. **Add `maxParallel` config:**
   ```json
   {
     "parallelization": true,
     "maxParallel": 3  // Limit concurrent agents
   }
   ```
2. **Modify execute-phase to batch wave execution:**
   - If wave has 5 plans and `maxParallel: 3`:
   - Batch 1: Plans 1, 2, 3
   - Batch 2: Plans 4, 5

**WAVE-03: Failure Handling**

1. **Classify failures by type:**
   - Transient (API error, timeout) → Retry
   - Permanent (logic error, missing file) → Stop

2. **Dependency-aware failure propagation:**
   - If Plan A fails, mark dependent plans as "blocked"
   - Continue with independent plans in same wave

3. **Partial wave success:**
   - Track which plans succeeded in wave
   - Only unblock dependents of successful plans

### 10. Files to Modify

| File | Change |
|------|--------|
| `bin/lib/phase.cjs` | Add dynamic wave computation in `cmdPhasePlanIndex()` |
| `bin/lib/frontmatter.cjs` | Make `wave` field optional in validation |
| `ez-agents/workflows/execute-phase.md` | Add `maxParallel` batching, failure handling |
| `agents/ez-planner.md` | Update to not assign static waves |
| `agents/ez-plan-checker.md` | Update to validate dynamic waves |
| `.planning/config.json` | Add `maxParallel` config option |

### 11. Validation Architecture

**Dimension 8 (Nyquist) Requirements:**

1. **Pre-computation validation:**
   - Verify all `depends_on` references exist
   - Detect cycles before wave computation

2. **Post-computation validation:**
   - Verify wave count matches expected complexity
   - Verify no wave is empty (indicates orphaned plans)

3. **Execution validation:**
   - Track wave completion status
   - Verify dependent plans only start after dependencies complete

### 12. Key Requirement IDs

- **WAVE-01:** Replace static wave assignment with dynamic computation
- **WAVE-02:** Add resource-aware parallelism (configurable maxParallel)
- **WAVE-03:** Implement failure handling in wave execution

---

*Research complete. Ready for planning.*
