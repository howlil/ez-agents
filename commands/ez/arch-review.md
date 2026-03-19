---
name: ez:arch-review
description: Run a Tech Lead architecture review on phase plans. Flags drift from established patterns, technical debt, and design conflicts.
argument-hint: "<phase>"
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
  - Task
---

<execution_context>
@~/.claude/ez-agents/workflows/arch-review.md
</execution_context>

<process>
Execute the arch-review workflow from @~/.claude/ez-agents/workflows/arch-review.md end-to-end.
Parse ARGUMENTS for phase number before executing.
</process>

# /ez:arch-review

Run a Tech Lead architecture review on phase plans. The Tech Lead agent checks plans against established codebase patterns, prior design decisions, and security requirements.

## Usage

```
/ez:arch-review <phase>
```

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `phase` | Yes | Phase number to review (e.g., `5`, `5.1`) |

## What Gets Reviewed

1. **Pattern Consistency** — Plans follow established codebase conventions
2. **Technical Debt Risk** — Plans avoid shortcuts that cost more later
3. **Cross-Phase Design Conflicts** — Plans don't contradict prior decisions
4. **Security Architecture** — Auth, input validation, sensitive data handled correctly
5. **Scalability Concerns** — No N+1 queries, unbounded operations
6. **Dependency Analysis** — New packages are appropriate and vetted

## Output

```
## Tech Lead Review: Phase 5 — Authentication

Technical Risk: LOW
Blockers: 0 | Warnings: 1 | Advisory: 2

### Findings

⚠️ WARNING — Security Architecture
Plan 5-02 adds POST /api/users endpoint without auth middleware.
Recommendation: Add requireAuth() middleware to protect this route.

💡 ADVISORY — Pattern Consistency
Plan 5-01 introduces bcrypt for password hashing. Existing codebase uses
argon2 in Phase 3. Consider using argon2 for consistency.
(Both are secure — this is style, not a blocker)

### Overall: APPROVE_WITH_WARNINGS
Plans are architecturally sound. Address the auth middleware warning before executing.
```

## Severity Levels

| Level | Meaning | Effect |
|-------|---------|--------|
| BLOCKER | Irreversible change or security hole | Must fix before execution |
| WARNING | Technical debt or missing validation | Highlight and suggest fix |
| ADVISORY | Alternative worth considering | Informational only |

## Integration with Planning

Arch review fits between planning and execution:

```
/ez:plan-phase 5      → Plans created
/ez:arch-review 5     → Tech lead reviews plans
/ez:execute-phase 5   → Execute with awareness of any warnings
```

The `execute-phase` workflow automatically spawns a tech lead review when `workflow.agent_discussion` is enabled in config.

## When to Use

- After planning a phase with significant new architecture
- When introducing new dependencies
- When modifying auth, payments, or other sensitive systems
- Before a major milestone

## Related Commands

- `/ez:standup` — Sprint health standup
- `/ez:plan-phase` — Create phase plans
- `/ez:execute-phase` — Execute with pre-flight checks
- `/ez:release` — Release validation
