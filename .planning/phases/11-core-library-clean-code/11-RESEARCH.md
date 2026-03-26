# Phase 11: Research

**Research Date:** 2026-03-26
**Phase:** 11 — Core Library Refactoring (Part 2) — Clean Code Principles
**Requirements:** CORE-08, CORE-09, CORE-10, CORE-15 (4 requirements)

---

## Executive Summary

This research provides actionable domain knowledge for implementing clean code principles (DRY, KISS, YAGNI) and proper encapsulation in the ez-agents TypeScript codebase. Key findings:

- **Tooling available**: jscpd (already in devDependencies), eslint-plugin-complexity (already installed), and CodeComplexityAnalyzer (existing class) provide automated detection
- **Existing infrastructure**: Decorator pattern (@ValidateInput, @LogExecution) from Phase 10 enables consistent encapsulation patterns
- **Metrics-driven approach**: Use established thresholds (complexity < 10, functions < 50 lines, nesting < 3 levels, jscpd 5+ lines/3+ times)
- **Hybrid OOP+FP architecture**: Maintain Phase 10 decisions — classes for stateful entities, static methods for pure functions

---

## Duplicate Code Detection (jscpd)

### Tool Configuration

**jscpd** is already installed as a devDependency. Recommended configuration:

```json
// .jscpd.json
{
  "threshold": 10,
  "minLines": 5,
  "minTokens": 70,
  "ignore": [
    "**/node_modules/**",
    "**/dist/**",
    "**/*.test.ts",
    "**/*.spec.ts"
  ],
  "reporters": ["console", "html"],
  "output": "./reports/jscpd"
}
```

**Detection Strategy:**
1. Run jscpd before refactoring to establish baseline
2. Focus on exact duplicates first (5+ lines, 3+ occurrences)
3. Then address semantic duplicates (same logic, different implementation)
4. Generate HTML reports for team review

### Common Duplicate Patterns in ez-agents

Based on codebase analysis, expect to find:

| Pattern | Location | Extraction Strategy |
|---------|----------|---------------------|
| Error handling | Service classes | Extract to `handleOperation()` utility |
| Configuration loading | Entry points | Extract to `ConfigLoader` class |
| Logging patterns | All classes | Already handled by @LogExecution decorator |
| Validation logic | Setters | Already handled by @ValidateInput decorator |
| File operations | Multiple modules | Use existing `FileOperations` class |

### Existing Duplicate Detection

The codebase already has `CodeComplexityAnalyzer.detectDuplicateCode()` method using chunk-based hash comparison. This can supplement jscpd for semantic duplicates.

**Usage:**
```typescript
import { CodeComplexityAnalyzer } from './code-complexity-analyzer.js';

const analyzer = new CodeComplexityAnalyzer(process.cwd());
const duplicates = await analyzer.detectDuplicateCode();
```

---

## Complexity Analysis Tools

### Available Tools

**Already installed:**
- `eslint-plugin-complexity` — ESLint rule for cyclomatic complexity
- `complexity-report` — Node.js package for programmatic analysis
- `CodeComplexityAnalyzer` class — Existing wrapper with ESLint integration

**Recommended ESLint configuration:**
```json
// .eslintrc.json
{
  "rules": {
    "complexity": ["error", { "max": 10 }],
    "max-depth": ["error", { "max": 3 }],
    "max-lines-per-function": ["warn", { "max": 50 }],
    "max-params": ["error", { "max": 4 }]
  }
}
```

### Complexity Metrics

| Metric | Threshold | Rationale |
|--------|-----------|-----------|
| Cyclomatic complexity | < 10 | Industry standard, aligns with Phase 14 METRIC-01 |
| Function length | < 50 lines | Maintainable unit size |
| Nesting depth | Max 3 levels | Cognitive load limit |
| Parameters | Max 4 | More indicates poor cohesion |

### Existing CodeComplexityAnalyzer

The `bin/lib/code-complexity-analyzer.ts` class provides:
- `analyzeComplexity()` — ESLint-based analysis with fallback
- `detectLargeFiles()` — Files exceeding line/size thresholds
- `detectDuplicateCode()` — Chunk-based duplicate detection
- `getSummary()` — Aggregated metrics

**Usage:**
```typescript
const analyzer = new CodeComplexityAnalyzer(process.cwd());
const issues = await analyzer.analyzeComplexity();
const largeFiles = analyzer.detectLargeFiles();
const duplicates = analyzer.detectDuplicateCode();
```

### Complexity Reduction Techniques

| Technique | When to Use | Example |
|-----------|-------------|---------|
| **Guard clauses** | Early returns simplify nesting | Replace `if (!x) { ... } else { ... }` with `if (!x) return;` |
| **Extract method** | Sub-tasks within functions | Extract validation, transformation, persistence |
| **Strategy pattern** | Complex conditionals | Replace switch/if-else with strategy classes |
| **Table-driven methods** | Multiple similar conditions | Use lookup tables instead of conditionals |

---

## Clean Code Patterns

### DRY Principle (CORE-08)

**Definition:** Every piece of knowledge must have a single, unambiguous, authoritative representation.

**Extraction Strategy:**

| Pattern | Extract To | Example |
|---------|-----------|---------|
| Pure functions | `bin/lib/fp/` utilities | `transform.ts`, `pipe.ts` |
| Stateful operations | Service class methods | `SessionManager.saveState()` |
| Cross-cutting concerns | Decorators | `@LogExecution`, `@CacheResult` |
| Error handling | Utility methods | `handleOperation()`, `wrapTryCatch()` |
| Configuration | Config classes | `ConfigLoader`, `ConfigValidator` |

**Priority Order:**
1. Exact code blocks (5+ lines, 3+ repetitions)
2. Similar patterns with minor variations
3. Error handling patterns
4. Configuration loading patterns

### KISS Principle (CORE-09)

**Definition:** Systems should be as simple as possible. Complexity should only be introduced when absolutely necessary.

**Simplification Workflow:**
1. Run complexity analysis (identify functions > 10)
2. Run line count analysis (identify functions > 50 lines)
3. Prioritize by impact (most-called functions first)
4. Extract helper methods with descriptive names
5. Verify tests still pass

**Refactoring Techniques:**

| Technique | Before | After |
|-----------|--------|-------|
| **Guard clauses** | Nested `if` with `else` | Early return, flat structure |
| **Extract method** | 100-line function | 5x 20-line focused methods |
| **Replace conditional with polymorphism** | Large switch statement | Strategy pattern classes |
| **Simplify boolean logic** | Complex `&&`/`||` chains | Extracted boolean methods |

**Example — Guard Clauses:**
```typescript
// BEFORE: Deep nesting
async function processContext(options: ContextOptions): Promise<ContextResult> {
  if (options.files) {
    if (options.enableScoring) {
      if (options.minScore) {
        // ... logic
      }
    }
  }
  return result;
}

// AFTER: Guard clauses
async function processContext(options: ContextOptions): Promise<ContextResult> {
  if (!options.files?.length) return emptyResult();
  if (!options.enableScoring) return gatherFiles(options.files);
  
  const scoredFiles = await scoreFiles(options.files, options.minScore);
  return gatherFiles(scoredFiles);
}
```

### YAGNI Principle (CORE-10)

**Definition:** Don't add functionality until it's necessary. Remove abstractions that don't serve multiple concrete purposes.

**What to Remove:**

| Target | Detection | Action |
|--------|-----------|--------|
| Single-use interfaces | Interface with 1 implementation | Remove, use concrete type |
| Unused parameters | Parameter never accessed | Remove from signature |
| Over-engineered patterns | Complexity without benefit | Simplify to direct implementation |
| Dead code | Never called/exported | Delete |

**Decision Rules:**
- **No, remove** — Don't keep interfaces "just in case" for future implementations
- **Case by case** for over-engineered patterns — evaluate if clearly over-engineered vs. proven solution
- If removal would break public API → keep with deprecation notice

**Detection Commands:**
```bash
# Find unused exports (requires ts-prune)
npx ts-prune

# Find unused parameters (ESLint rule)
# Add to .eslintrc.json: "@typescript-eslint/no-unused-vars": "error"

# Find single-implementation interfaces (manual audit)
# Search for "export interface" and count implementations
```

---

## Encapsulation Patterns

### Field Visibility

**Rules:**
- **private** — All internal state not part of public API
- **protected** — Only when inheritance requires access
- **public** — Only for explicit public API surface

**Example:**
```typescript
export class SessionManager {
  private statePath: string;        // Internal implementation
  private currentState: SessionState | null;  // Private state
  private eventBus: EventBus;       // Private dependency
  
  // Public API
  public createSession(sessionId: string): SessionState { }
  public loadState(): SessionState | null { }
}
```

### Getters/Setters

**Always use getters/setters** for field access (not public fields):

```typescript
export class ContextManager {
  private _sources: ContextSource[];
  
  // Simple getter
  public get sources(): ContextSource[] {
    return [...this._sources];  // Return copy to prevent mutation
  }
  
  // Getter with validation
  public get context(): string {
    if (!this._context) {
      throw new Error('Context not initialized');
    }
    return this._context;
  }
  
  // Setter with validation
  public set taskId(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Task ID cannot be empty');
    }
    this._taskId = value;
  }
}
```

### Setter Validation

**Always validate in setters** using @ValidateInput decorator:

```typescript
import { ValidateInput } from './decorators/index.js';

export class PhaseManager {
  private _currentPhase: string;
  
  @ValidateInput((phase: string) => {
    if (!phase || phase.trim().length === 0) {
      throw new Error('Phase cannot be empty');
    }
    const validPhases = ['planning', 'execution', 'review', 'complete'];
    if (!validPhases.includes(phase)) {
      throw new Error(`Invalid phase: ${phase}`);
    }
  })
  public set currentPhase(phase: string) {
    this._currentPhase = phase;
  }
}
```

### Encapsulation Checklist

- [ ] All fields marked `private` unless part of public API
- [ ] All field access through getters/setters
- [ ] All setters validate input
- [ ] Getters return copies of mutable data (arrays, objects)
- [ ] Use `readonly` for fields that never change after construction
- [ ] Use `@ValidateInput` decorator for consistent validation

---

## Implementation Strategy

### Phase 11 Workflow

**Prerequisites:**
- Phase 10 complete (design patterns infrastructure)
- Tests passing (baseline verification)
- jscpd configured

**Step-by-step:**

1. **Baseline Analysis** (Day 1)
   - Run jscpd to detect duplicates
   - Run complexity analysis to identify complex functions
   - Document baseline metrics

2. **DRY Refactoring** (Days 2-5)
   - Extract duplicate code to utilities
   - Apply template method pattern for similar algorithms
   - Use decorators for cross-cutting concerns
   - Run tests after each extraction

3. **KISS Refactoring** (Days 6-9)
   - Simplify top 10 most complex functions
   - Apply guard clauses
   - Extract helper methods
   - Reduce nesting depth
   - Run tests after each simplification

4. **YAGNI Audit** (Days 10-11)
   - Identify single-use interfaces
   - Remove unused parameters
   - Document removal decisions
   - Run tests to verify no breakage

5. **Encapsulation** (Days 12-14)
   - Convert public fields to private
   - Add getters/setters with validation
   - Apply @ValidateInput decorator
   - Update tests to use accessors

6. **Validation** (Day 15)
   - Run full test suite
   - Verify jscpd threshold met
   - Verify complexity thresholds met
   - Document results

### Integration with Existing Infrastructure

**Use Phase 10 patterns:**
- `@LogExecution` decorator for logging in extracted methods
- `@CacheResult` decorator for expensive operations
- `@ValidateInput` decorator for setter validation
- FP utilities pattern from `bin/lib/fp/` for pure functions

**Maintain ESM imports:**
```typescript
// All imports use .js extension
import { ValidateInput } from './decorators/index.js';
import { CodeComplexityAnalyzer } from './code-complexity-analyzer.js';
```

### Testing Strategy

**During refactoring:**
1. Run tests after each refactoring step
2. Maintain 70%+ coverage threshold
3. Update tests to work with private fields (use getters/setters)
4. Add type-level tests for public APIs

**Commands:**
```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Type check
npm run typecheck
```

---

## Recommendations

### Tooling Setup

1. **Add jscpd configuration file:**
   ```bash
   # Create .jscpd.json in project root
   ```

2. **Update ESLint configuration:**
   ```json
   // Add to .eslintrc.json
   {
     "rules": {
       "complexity": ["error", { "max": 10 }],
       "max-depth": ["error", { "max": 3 }],
       "max-lines-per-function": ["warn", { "max": 50 }],
       "@typescript-eslint/no-unused-vars": "error"
     }
   }
   ```

3. **Add npm scripts:**
   ```json
   // Add to package.json
   {
     "scripts": {
       "analyze:duplicates": "jscpd --config .jscpd.json",
       "analyze:complexity": "eslint --rule 'complexity: error' bin/lib/"
     }
   }
   ```

### Refactoring Priorities

**High Priority (Week 1):**
- Duplicate error handling patterns across service classes
- Configuration loading duplication in entry points
- Functions with complexity > 15

**Medium Priority (Week 2):**
- Similar patterns with minor variations
- Functions with complexity 10-15
- Single-use interfaces in internal modules

**Low Priority (Week 3):**
- Functions with complexity 8-10 (near threshold)
- Minor code smells
- Documentation updates

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking changes to public API | Keep with deprecation, document in MIGRATION.md |
| Tests failing after refactoring | Small incremental changes, run tests frequently |
| Over-refactoring | Focus on measured violations, not subjective improvements |
| Loss of functionality | Comprehensive test coverage before starting |

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Duplicate blocks > 5 lines | 0 | jscpd report |
| Duplicated lines % | < 1% | jscpd report |
| Functions with complexity > 10 | 0 | ESLint report |
| Single-use interfaces | 0 | Manual audit |
| All tests passing | 100% | Test suite |
| Coverage threshold | ≥ 70% | Coverage report |

---

## References

### Internal Documents
- `.planning/REQUIREMENTS.md` — CORE-08 to CORE-15 requirements
- `.planning/ROADMAP.md` — Phase 11 goal and success criteria
- `.planning/phases/10-foundation-core-library-refactoring/10-CONTEXT.md` — Phase 10 decisions
- `.planning/research/PITFALLS.md` — OOP refactoring pitfalls

### Existing Code
- `bin/lib/decorators/` — Decorator implementations
- `bin/lib/fp/` — FP utilities (pattern for pure function extraction)
- `bin/lib/session-manager.ts` — Example class with proper encapsulation
- `bin/lib/context-manager.ts` — Example class with decorators
- `bin/lib/code-complexity-analyzer.ts` — Existing complexity analysis tool

### External Resources
- **"Clean Code"** by Robert C. Martin — DRY, KISS, YAGNI principles
- **"Refactoring"** by Martin Fowler — Refactoring techniques catalog
- **ESLint Complexity Rules** — https://eslint.org/docs/rules/complexity
- **jscpd Documentation** — https://github.com/kucherenko/jscpd

---

*Research gathered: 2026-03-26*
*Next: Planning implementation → 11-PLAN.md*
