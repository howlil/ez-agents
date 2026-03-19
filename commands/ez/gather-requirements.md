---
name: gather-requirements
description: Gather BDD/Gherkin requirements for a phase via user interview. Produces .feature files with MoSCoW tagging and INVEST validation.
usage: /ez:gather-requirements [phase] [--auto]
---

# /ez:gather-requirements

Gather machine-verifiable BDD requirements for a phase. Spawns the `ez-requirements-agent` to interview you and produce Gherkin `.feature` files with MoSCoW priorities.

## Usage

```
/ez:gather-requirements [phase] [--auto]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `phase` | Phase number (e.g., `5`, `5.1`). Defaults to next unplanned phase. |
| `--auto` | Skip interview — derive requirements from ROADMAP.md and CONTEXT.md automatically. |

## What It Does

1. **Reads** existing REQUIREMENTS.md and phase CONTEXT.md to understand scope
2. **Interviews** you about user stories, acceptance criteria, and edge cases (unless `--auto`)
3. **Writes** `.feature` files to `specs/features/{domain}/` in your project
4. **Validates** INVEST criteria for each user story
5. **Tags** every scenario with MoSCoW (`@must/@should/@could/@wont`) and tier (`@mvp/@medium/@enterprise`)
6. **Creates** `.planning/phases/XX-name/XX-ACCEPTANCE-CRITERIA.md` — phase gate document
7. **Updates** `.planning/REQUIREMENTS-BDD.md` — traceability matrix

## Output Structure

```
specs/
  features/
    {domain}/
      {feature}.feature     ← Gherkin scenarios with MoSCoW tags
.planning/
  phases/
    XX-name/
      XX-ACCEPTANCE-CRITERIA.md  ← Phase gate: @must scenarios
  REQUIREMENTS-BDD.md            ← Traceability matrix
```

## Workflow

```
/ez:gather-requirements 5
  → ez-requirements-agent interviews you
  → Creates specs/features/...
  → Creates ACCEPTANCE-CRITERIA.md
  → Updates REQUIREMENTS-BDD.md

/ez:plan-phase 5
  → Planner reads .feature files
  → Plans address @must scenarios
  → BDD cross-check in plan
```

## Flags

### --auto

Skip the interactive interview. Requirements agent derives scenarios from:
- ROADMAP.md phase description and goal
- Phase CONTEXT.md (if from `/ez:discuss-phase`)
- Existing REQUIREMENTS.md

Use when you have detailed context already captured and want fast requirements generation.

```
/ez:gather-requirements 5 --auto
```

## Examples

```bash
# Interactive — gather requirements for phase 5
/ez:gather-requirements 5

# Auto-derive from existing context
/ez:gather-requirements 5 --auto

# Gather for decimal gap-closure phase
/ez:gather-requirements 5.1
```

## Integration with Planning

Requirements gathered here feed directly into:

- **`/ez:plan-phase`** — Planner cross-checks plans against `.feature` files, ensures @must scenarios are addressed
- **`/ez:verify-work`** — Verifier checks BDD pass rate in VERIFICATION.md
- **`/ez:release`** — Release gate checks @must scenario coverage before promoting tier

## INVEST Quick Guide

Every user story (Feature + scenarios) must be:

| Letter | Criterion | Check |
|--------|-----------|-------|
| I | Independent | Can develop without other features |
| N | Negotiable | Implementation details not locked in Then clauses |
| V | Valuable | Feature statement explains user benefit |
| E | Estimable | Steps are detailed enough to estimate |
| S | Small | ≤8 @must scenarios fit in one phase |
| T | Testable | All Then clauses are automatable |

## Related Commands

- `/ez:discuss-phase` — Capture design decisions (run before gather-requirements)
- `/ez:plan-phase` — Create implementation plans (run after gather-requirements)
- `/ez:verify-work` — Verify BDD scenarios pass after implementation
- `/ez:release` — Release with BDD coverage gate
