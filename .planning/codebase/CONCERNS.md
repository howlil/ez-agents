# Technical Concerns

## Overview

This document tracks technical debt, known issues, complexity hotspots, and improvement opportunities in the ez-agents codebase.

---

## Critical Concerns

### 1. Skipped Tests

**Files:**
- `tests/circuit-breaker.test.cjs.skip`
- `tests/verify.test.cjs.skip`

**Issue:** Tests temporarily disabled but not tracked for re-enablement.

**Impact:** Reduced test coverage for critical reliability features.

**Recommendation:**
- Create GitHub issues for each skipped test
- Set deadline for re-enablement
- Document reason for skipping in file header

---

### 2. Large Entry Point Files

**Files:**
- `bin/install.js` (3222 lines)
- `ez-agents/bin/ez-tools.cjs` (1693 lines)

**Issue:** Entry point files exceed recommended size (>1000 lines).

**Impact:**
- Harder to maintain and understand
- Higher risk of merge conflicts
- Difficult to test comprehensively

**Recommendation:**
- Extract installer runtime detection to `bin/lib/runtime-detector.cjs`
- Extract config directory resolution to `bin/lib/config-resolver.cjs`
- Extract content conversion to `bin/lib/content-converter.cjs`
- Split ez-tools commands into separate modules under `ez-agents/bin/commands/`

---

### 3. Complex State Management

**File:** `bin/lib/state.cjs` (737 lines)

**Issue:** Single module handles 10+ different state operations.

**Impact:**
- High cognitive load for maintainers
- Risk of regression when modifying
- Difficult to test all code paths

**Recommendation:**
Consider splitting into focused modules:
- `state-load.cjs` - Load operations
- `state-update.cjs` - Update/patch operations
- `state-metrics.cjs` - Metric recording
- `state-progress.cjs` - Progress tracking
- `state-session.cjs` - Session history

---

## Medium-Term Concerns

### 4. Context Manager Complexity

**File:** `bin/lib/context-manager.cjs` (~300 lines) plus 6 supporting modules

**Issue:** Context optimization pipeline has many moving parts.

**Components:**
- `context-relevance-scorer.cjs`
- `context-deduplicator.cjs`
- `context-compressor.cjs`
- `context-metadata-tracker.cjs`
- `context-cache.cjs`
- `context-errors.cjs`

**Impact:** Complex interactions between components can cause subtle bugs.

**Recommendation:**
- Add integration tests for full pipeline
- Document data flow between components
- Consider adding tracing/debug mode

---

### 5. Git Workflow Engine Size

**File:** `bin/lib/git-workflow-engine.cjs` (~300 lines)

**Issue:** Comprehensive git workflow handling in single module.

**Impact:** Git operations are critical; bugs can cause data loss.

**Recommendation:**
- Add more error recovery tests
- Document all git error scenarios
- Consider adding git operation logging for debugging

---

### 6. Model Provider Abstraction

**File:** `bin/lib/model-provider.cjs` (~150 lines)

**Issue:** Supporting 4 different AI providers with unified API.

**Impact:**
- Provider-specific bugs may slip through
- API differences may cause subtle issues
- New provider additions require careful testing

**Recommendation:**
- Add provider-specific test fixtures
- Document known provider differences
- Add integration tests for each provider

---

### 7. Dependency Versions

**Current versions in `package.json`:**

| Package | Version | Latest | Status |
|---------|---------|--------|--------|
| eslint | ^8.57.0 | 9.x | Major behind |
| vitest | ^4.1.0 | Current | OK |
| husky | ^9.1.7 | Current | OK |
| c8 | ^11.0.0 | Current | OK |

**Issue:** ESLint 8.x is behind current major version.

**Impact:**
- Missing latest linting rules
- Potential security fixes in 9.x
- Migration effort will increase over time

**Recommendation:**
- Plan ESLint 9.x migration
- Test with eslint-config updates
- Update `.eslintrc.json` format if needed

---

## Low-Priority Concerns

### 8. Documentation Coverage

**Issue:** JSDoc coverage may be incomplete.

**Impact:**
- Harder for new contributors
- API documentation may be outdated

**Recommendation:**
- Run JSDoc generation regularly
- Add JSDoc linting to CI
- Document all exported functions

---

### 9. Hook Compilation

**File:** `scripts/build-hooks.js`

**Issue:** Hooks compiled from `.js` to `.cjs` adds build step complexity.

**Impact:**
- Extra step before publishing
- Potential for stale compiled files
- Debugging requires source maps

**Recommendation:**
- Add source map generation
- Consider writing hooks in `.cjs` directly
- Add pre-publish verification for compiled hooks

---

### 10. Test Fixture Management

**Directory:** `tests/fixtures/`

**Issue:** Fixtures may become outdated as codebase evolves.

**Impact:** Tests may pass with outdated fixtures but fail in production.

**Recommendation:**
- Add fixture validation tests
- Document fixture update process
- Consider generating fixtures from templates

---

## Performance Considerations

### 11. Context Budget Management

**Issue:** Context usage can grow quickly with large codebases.

**Current thresholds:**
- 0-30%: PEAK (optimal)
- 30-50%: GOOD (target)
- 50-70%: DEGRADING
- 70%+: POOR (risk of truncation)

**Impact:** Large projects may hit context limits.

**Recommendation:**
- Monitor context usage in production
- Add context usage alerts
- Implement more aggressive compression strategies

---

### 12. File Lock Timeout

**File:** `bin/lib/file-lock.cjs` (~150 lines)

**Issue:** File locking prevents concurrent access but may cause deadlocks.

**Impact:** Agent workflows may hang if locks aren't released.

**Recommendation:**
- Add lock timeout monitoring
- Log lock acquisition/release
- Add deadlock detection

---

## Security Considerations

### 13. Secret Detection

**File:** `.gitleaks.toml`

**Issue:** Secret scanning relies on pattern matching.

**Impact:** New secret formats may not be detected.

**Recommendation:**
- Regularly update gitleaks patterns
- Add custom patterns for project-specific secrets
- Consider pre-commit secret scanning

---

### 14. Command Injection Prevention

**Files:** `bin/lib/safe-exec.cjs`, `bin/lib/audit-exec.cjs`

**Issue:** Command execution wrappers must be kept up-to-date.

**Impact:** Vulnerable to injection if not properly maintained.

**Recommendation:**
- Regular security audits
- Add command injection tests
- Document safe execution patterns

---

### 15. Path Traversal Prevention

**File:** `bin/lib/safe-path.cjs`

**Issue:** Path validation must handle all edge cases.

**Impact:** Potential unauthorized file access.

**Recommendation:**
- Add path traversal test cases
- Test on Windows, Linux, macOS
- Document path validation rules

---

## Scalability Considerations

### 16. Agent Spawn Overhead

**Issue:** Each agent spawn has context gathering overhead.

**Impact:** Large projects may have slow agent startup.

**Recommendation:**
- Profile context gathering time
- Cache context where safe
- Consider lazy context loading

---

### 17. State File Size

**File:** `.planning/STATE.md`

**Issue:** State file grows with session history.

**Impact:** Slower state loading over time.

**Recommendation:**
- Implement state rotation
- Archive old session history
- Compress state data

---

### 18. Phase Directory Growth

**Directory:** `.planning/phases/`

**Issue:** Many phases create many directories.

**Impact:** File system performance may degrade.

**Recommendation:**
- Archive completed phases
- Implement phase cleanup
- Consider hierarchical phase organization

---

## Improvement Opportunities

### 19. Enhanced Error Reporting

**Opportunity:** Add structured error reporting with error codes.

**Benefits:**
- Easier debugging
- Better user error messages
- Searchable error documentation

**Implementation:**
```javascript
// Example error format
{
  code: 'EZ_STATE_001',
  message: 'STATE.md not found',
  context: { planningDir: '/path/to/.planning' },
  suggestion: 'Run /ez:new-project to initialize'
}
```

---

### 20. Performance Metrics Dashboard

**Opportunity:** Add performance metrics collection and visualization.

**Metrics to track:**
- Agent spawn time
- Context gathering duration
- Plan execution time
- File operation latency

**Benefits:**
- Identify performance bottlenecks
- Track performance over time
- Set performance budgets

---

### 21. Enhanced Logging

**Opportunity:** Add structured logging with log levels.

**Benefits:**
- Better debugging
- Production observability
- Log aggregation compatible

**Implementation:**
```javascript
logger.info('Agent spawned', {
  agent: 'ez-planner',
  model: 'claude-sonnet',
  phase: '01-foundation',
  plan: '03'
});
```

---

### 22. Configuration Validation

**Opportunity:** Add schema validation for configuration files.

**Files to validate:**
- `.planning/config.json`
- AI tool configuration files

**Benefits:**
- Catch configuration errors early
- Better error messages
- Documentation of valid config

---

### 23. Migration Scripts

**Opportunity:** Add migration scripts for breaking changes.

**Use cases:**
- STATE.md format changes
- ROADMAP.md format changes
- Configuration updates

**Benefits:**
- Smoother upgrades
- Backward compatibility
- Clear migration path

---

### 24. Plugin System

**Opportunity:** Allow custom skills and workflows.

**Benefits:**
- Community contributions
- Custom workflows per team
- Extensibility without core changes

**Considerations:**
- Security model for plugins
- Plugin discovery mechanism
- Version compatibility

---

## Known Limitations

### 25. Windows Path Handling

**Issue:** Some path operations may have edge cases on Windows.

**Impact:** Occasional path conversion issues.

**Workaround:** Use WSL or ensure forward slashes.

**Fix:** Comprehensive Windows path testing.

---

### 26. Large File Context

**Issue:** Very large files (>10k lines) may cause context issues.

**Impact:** Context budget exhaustion.

**Workaround:** Use context compression or exclude large files.

**Fix:** Implement streaming context for large files.

---

### 27. Concurrent Agent Execution

**Issue:** Limited support for truly parallel agent execution.

**Impact:** Wave-based execution is sequential within waves.

**Fix:** Implement true parallel execution with proper locking.

---

## Action Items

### Immediate (Next Sprint)

- [ ] Create issues for skipped tests
- [ ] Document reason for test skips
- [ ] Review ESLint 9.x migration path

### Short-term (Next Month)

- [ ] Split large entry point files
- [ ] Add source maps for hook compilation
- [ ] Update gitleaks patterns

### Medium-term (Next Quarter)

- [ ] Refactor state management module
- [ ] Add structured error reporting
- [ ] Implement performance metrics

### Long-term (Next 6 Months)

- [ ] Consider plugin system design
- [ ] Evaluate true parallel execution
- [ ] Plan major version with breaking changes

---

## Debt Tracking

| ID | Concern | Priority | Status | Owner |
|----|---------|----------|--------|-------|
| 1 | Skipped tests | Critical | Open | - |
| 2 | Large entry files | Critical | Open | - |
| 3 | Complex state mgmt | Critical | Open | - |
| 4 | Context complexity | Medium | Open | - |
| 5 | Git workflow size | Medium | Open | - |
| 6 | Model provider abstraction | Medium | Open | - |
| 7 | ESLint version | Medium | Open | - |

---

*Last updated: March 2026*
*Next review: After v4.1.0 release*
