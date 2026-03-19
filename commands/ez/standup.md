---
name: ez:standup
description: Run a sprint standup simulation. Scrum Master agent reports velocity, blockers, and sprint health score.
argument-hint: "[phase]"
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
---

<execution_context>
@~/.claude/ez-agents/workflows/standup.md
</execution_context>

<process>
Execute the standup workflow from @~/.claude/ez-agents/workflows/standup.md end-to-end.
Parse ARGUMENTS for optional phase number before executing.
</process>

# /ez:standup

Run a sprint standup simulation. The Scrum Master agent analyzes project state and reports velocity trends, active blockers, and sprint health score.

## Usage

```
/ez:standup [phase]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `phase` | Optional phase number for phase-specific standup. Defaults to current phase. |

## What It Produces

```
## Daily Standup — 2026-03-19

### Yesterday
- Completed: Phase 17 — Package Manager Flexibility (3 plans)
- Verified: Phase 17 passed verification (score 4/5)

### Today (Planned)
- Phase 18: Session Memory — 3 plans ready
- Next: Execute Phase 18

### Blockers
None

### Velocity Trend
↑ IMPROVING — avg 2.3 plans/session (up from 1.8 last 5 sessions)

Sprint Health: 78/100 — SOME FRICTION
Recommendation: Coverage at 71% — target 80% for medium tier release
```

## Sprint Health Score

The standup includes a 0-100 sprint health score:

| Score | Status | Meaning |
|-------|--------|---------|
| 80-100 | HEALTHY | Continue at pace |
| 60-79 | SOME FRICTION | Address specific warnings |
| 40-59 | STRUGGLING | Consider scope reduction |
| <40 | AT RISK | Pause and address blockers |

Dimensions tracked: velocity trend, active blockers, deviation rate, requirements coverage, plan completion rate, BDD pass rate.

## When to Use

- Before starting a new phase to check team health
- After a phase completes to see trend
- When things feel slow — get an objective measure
- Before a release to check if ready

## Related Commands

- `/ez:arch-review` — Technical architecture review
- `/ez:progress` — Project progress overview
- `/ez:stats` — Enhanced metrics dashboard
- `/ez:release` — Release with readiness validation
