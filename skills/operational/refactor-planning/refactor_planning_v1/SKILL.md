---
name: Refactor Planning
description: Systematic technical debt reduction with incremental strategy and risk mitigation
version: 1.0.0
tags: [refactor, tech-debt, maintenance, code-quality]
category: operational
triggers:
  keywords: [refactor, technical debt, code quality, cleanup]
  modes: [maintenance, existing]
key_components:
  tech_debt_inventory: "Where is debt, why it exists, impact on velocity/quality"
  refactor_scope: "What's in scope, what's out of scope, boundaries"
  risk_assessment: "What could break, affected systems, user impact"
  incremental_strategy: "Strangler fig pattern, parallel run, feature flags"
  testing_strategy: "Regression test coverage, new tests for refactored code"
  rollback_plan: "How to undo if issues, revert strategy"
  success_metrics: "How to measure improvement (cyclomatic complexity, test coverage, performance)"
refactor_patterns:
  - Extract method/class
  - Rename for clarity
  - Remove duplication
  - Simplify conditionals
  - Break dependencies
when_not_to_use: "Working code with no maintenance issues, features under active development, before understanding business logic"
---

# Refactor Planning

## Purpose

Guide systematic technical debt reduction with incremental strategy and risk mitigation. Ensures refactoring is safe, measurable, and delivers clear improvement.

## Key Components

### 1. Tech Debt Inventory

Before planning a refactor, map the landscape:

- **Where is the debt?** Identify files, modules, or subsystems with the highest churn, most bugs, or slowest build times.
- **Why does it exist?** Historical context helps avoid repeating the same mistakes.
- **What is the impact?** Measure in velocity reduction, bug frequency, and onboarding difficulty.

### 2. Refactor Scope

Set clear boundaries:

- **In scope:** Specific files, functions, or modules targeted for refactoring.
- **Out of scope:** Systems that will not change, APIs that must remain stable.
- **Boundaries:** Define interfaces that must be preserved.

### 3. Risk Assessment

Before touching code:

- What could break? Trace dependencies and identify downstream consumers.
- Which systems are affected? Map integration points.
- What is the user impact if something goes wrong?

### 4. Incremental Strategy

Choose a safe approach:

- **Strangler Fig Pattern:** Build new code alongside old; redirect traffic incrementally.
- **Parallel Run:** Run old and new code simultaneously; compare outputs.
- **Feature Flags:** Gate new implementation behind a flag; roll back instantly if needed.

### 5. Testing Strategy

Protect the refactor:

- Ensure regression test coverage exists BEFORE refactoring.
- Write new tests for the refactored code.
- Run tests at each incremental step — never refactor in large batches.

### 6. Rollback Plan

Always have an exit:

- How to undo the change if issues emerge.
- Git-based revert strategy.
- Feature flag disable path.

### 7. Success Metrics

Define measurable outcomes:

- Cyclomatic complexity reduction
- Test coverage increase
- Build time improvement
- Bug frequency reduction in target area

## Refactor Patterns

| Pattern | When to Use |
|---------|-------------|
| Extract method/class | Method too long (> 20 lines), multiple responsibilities |
| Rename for clarity | Unclear variable or function names |
| Remove duplication | Same logic in 3+ places |
| Simplify conditionals | Nested if/else, complex boolean logic |
| Break dependencies | Tight coupling preventing testability |

## When NOT to Use This Skill

- Working code with no maintenance issues (don't fix what isn't broken)
- Features under active development (adds churn and conflicts)
- Before understanding the business logic (risk of breaking intent)
