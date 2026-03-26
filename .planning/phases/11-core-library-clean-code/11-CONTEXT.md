# Phase 11: Core Library Refactoring (Part 2) — Clean Code Principles - Context

**Gathered:** 2026-03-26
**Status:** Ready for research and planning

<domain>
## Phase Boundary

**What this phase delivers:** Application of clean code principles (DRY, KISS, YAGNI) to eliminate duplicate code, simplify complex functions, and remove unnecessary abstractions. Also includes proper encapsulation with private fields and validated setters.

**What this phase does NOT deliver:**
- Design patterns (Factory, Strategy, etc.) — that's Phase 10 (complete)
- Entry points refactoring — that's Phase 12 (complete)
- Test files refactoring — that's Phase 13 (in progress)
- Code quality metrics tooling — that's Phase 14
- Build system updates — that's Phase 15

**Scope anchor:** CORE-08 to CORE-10, CORE-15 (4 requirements from REQUIREMENTS.md)

**Deferred to future phases:**
- CORE-11: Improve cohesion — deferred to Phase 14 (metrics-driven)
- CORE-12: Reduce coupling — deferred to Phase 14 (metrics-driven)
- CORE-13: TSDoc comments — deferred to Phase 15 (documentation phase)
- CORE-14: Immutable data patterns — deferred to Phase 15 (documentation phase)

</domain>

<decisions>
## Implementation Decisions

### DRY Principle (CORE-08)

**Duplicate detection:**
- Use **jscpd (JavaScript Copy/Paste Detector)** for automated detection
- Threshold: **5+ lines** repeated **3+ times**
- Focus on exact code blocks first, then similar patterns

**Extraction strategy:**
- **Both approaches**: Static utility functions for pure functions, class methods for stateful operations
- Pure functions → `bin/lib/fp/` or `bin/lib/utils/`
- Stateful operations → appropriate service class methods
- Maintain backward compatibility with deprecated wrappers where needed

**Priority order:**
1. Exact code blocks 5+ lines, 3+ repetitions
2. Similar patterns with minor variations
3. Error handling patterns
4. Configuration loading patterns

### KISS Principle (CORE-09)

**Complexity limits:**
- **Cyclomatic complexity: < 10** per function (industry standard)
- **Function length: < 50 lines** per function
- **Nesting depth: Max 3 levels**

**Simplification approach:**
- **Extract methods** for sub-tasks (primary technique)
- Early returns/guard clauses where appropriate
- Clear function names that describe intent
- Break down nested conditionals into separate methods

**Refactoring workflow:**
1. Run complexity analysis (identify functions > 10)
2. Run line count analysis (identify functions > 50 lines)
3. Prioritize by impact (most-called functions first)
4. Extract helper methods with descriptive names
5. Verify tests still pass

### YAGNI Principle (CORE-10)

**What to remove:**
- **Single-use interfaces** — interfaces with only one implementation
- **Unused parameters** — parameters and options that are never used
- **Over-engineered patterns** — evaluated case-by-case

**Removal criteria:**
- **No, remove** — Don't keep interfaces "just in case" for future implementations
- **Case by case** for over-engineered patterns — evaluate if clearly over-engineered vs. proven solution
- If removal would break public API → keep with deprecation notice

**Documentation:**
- Document removal decisions in commit messages
- Add to MIGRATION-FP-TO-OOP.md (Phase 15 deliverable)
- Note any breaking changes for users

### Encapsulation (CORE-15)

**Field visibility:**
- **All internal state** should be private
- Use `private` access modifier for fields not part of public API
- Use `protected` only when inheritance requires access
- Use `public` only for explicit public API surface

**Accessors:**
- **Use getters/setters** for all field access (not public fields)
- Simple data can use auto-implemented getters
- Complex data requires explicit getters with validation

**Setter validation:**
- **Always validate** in setters (data integrity)
- Validate type, range, and business rules
- Throw descriptive errors on invalid input
- Use `@ValidateInput` decorator where appropriate (from Phase 10)

**Encapsulation pattern:**
```typescript
export class Example {
  private _value: string;
  
  constructor(value: string) {
    this.value = value; // Uses setter validation
  }
  
  public get value(): string {
    return this._value;
  }
  
  public set value(newValue: string) {
    if (!newValue || newValue.trim().length === 0) {
      throw new Error('Value cannot be empty');
    }
    this._value = newValue;
  }
}
```

### Architecture Principles (preserved from Phase 10)

**OOP + FP Hybrid:**
- Classes for stateful entities and service layers
- Static methods for pure transformations (FP utilities)
- Immutable data patterns (deferred to Phase 15)
- Dependency injection for loose coupling

**Decorator usage (from Phase 10):**
- @LogExecution for method logging
- @CacheResult for caching
- @ValidateInput for input validation
- Apply to all public methods in service classes

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — CORE-08 to CORE-10, CORE-15 (Phase 11 requirements)
- `.planning/ROADMAP.md` — Phase 11 goal and success criteria

### Prior Phase Context
- `.planning/phases/10-foundation-core-library-refactoring/10-CONTEXT.md` — Phase 10 decisions (design patterns, decorators)
- `.planning/phases/10-foundation-core-library-refactoring/10-RESEARCH.md` — OOP research findings
- `.planning/phases/10-foundation-core-library-refactoring/10-SUMMARY.md` — Phase 10 completion summary

### Existing Code
- `bin/lib/decorators/` — Decorator implementations (use @ValidateInput for setters)
- `bin/lib/fp/` — FP utilities (pattern for pure function extraction)
- `bin/lib/session-manager.ts` — Example class with proper encapsulation
- `bin/lib/context-manager.ts` — Example class with decorators

### Tools
- **jscpd** — Duplicate code detection (npm install -D jscpd)
- **complexity** — Cyclomatic complexity analysis (npm install -D complexity)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Decorator infrastructure** (bin/lib/decorators/) — Use @ValidateInput for setter validation
- **FP utilities** (bin/lib/fp/) — Pattern for extracting pure functions
- **Logger** — Use for consistent logging in extracted utilities
- **ErrorCache** — Pattern for error handling utilities

### Established Patterns
- **Hybrid OOP+FP** — Classes for state, static methods for pure functions
- **ESM imports** — All imports use `.js` extension
- **TypeScript strict mode** — Already enabled
- **TSDoc comments** — Already in use on Phase 10 classes

### Integration Points
- **bin/lib/index.ts** — Main barrel export, needs to re-export new utilities
- **Existing classes** — Apply encapsulation to Phase 10 classes
- **Test files** — Update tests to work with private fields (use getters/setters)

### Potential Duplicates (to be detected by jscpd)
- Error handling patterns across service classes
- Configuration loading in multiple entry points
- Logging patterns across classes
- Validation logic in multiple setters

</code_context>

<specifics>
## Specific Ideas

**Tooling first approach:**
- Run jscpd before refactoring to identify duplicates
- Run complexity analysis to identify functions needing simplification
- Use automated tools to avoid manual guesswork

**Incremental refactoring:**
- Refactor one module at a time
- Run tests after each refactoring
- Maintain backward compatibility during refactoring

**Validation consistency:**
- All setters validate input
- Use @ValidateInput decorator for consistency
- Throw descriptive errors for debugging

**Documentation matters:**
- Document what was removed (YAGNI)
- Document why abstractions were removed
- Update MIGRATION-FP-TO-OOP.md in Phase 15

</specifics>

<deferred>
## Deferred Ideas

**Deferred to Phase 14 (Code Quality Metrics):**
- CORE-11: Improve cohesion — needs cohesion measurement tooling
- CORE-12: Reduce coupling — needs coupling measurement tooling

**Deferred to Phase 15 (Build System & Documentation):**
- CORE-13: TSDoc comments — comprehensive documentation phase
- CORE-14: Immutable data patterns — needs documentation and guidelines

**Deferred to future milestones:**
- Type hierarchy simplification — complex, needs dedicated phase
- Dependency injection framework — over-engineered for current needs

</deferred>

---
*Context gathered: 2026-03-26*
*Next: Research clean code tools → Planning implementation*
