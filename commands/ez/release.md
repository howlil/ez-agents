---
name: ez:release
description: Create a tier-aware release with branch automation, changelog generation, security gates, and rollback plan.
usage: /ez:release <tier> <version>
argument-hint: "<tier> <version> | preflight <tier>"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
---

<execution_context>
@~/.claude/ez-agents/workflows/release.md
</execution_context>

<process>
Execute the release workflow from @~/.claude/ez-agents/workflows/release.md end-to-end.
Parse ARGUMENTS for tier, version, and flags before executing.
</process>

# /ez:release

Create a production release. Automates branch strategy, security gates, tier checklist, changelog generation, and rollback plan based on the target tier (mvp/medium/enterprise).

## Usage

```
/ez:release <tier> <version>
/ez:release preflight <tier>
```

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `tier` | Yes | `mvp`, `medium`, or `enterprise` |
| `version` | Yes | Semver version (e.g., `1.0.0`, `2.1.0`) |

## Release Tiers

### MVP (`/ez:release mvp v1.0.0`)
For: "Ship working software fast"
- Scope: @must scenarios only
- Coverage: 60% minimum
- Git: Trunk-based (tag directly on main)
- Checklist: 6 items
- Typical use: First public release, early access

### Medium (`/ez:release medium v1.1.0`)
For: "Production-ready for real users"
- Scope: @must + @should scenarios
- Coverage: 80% minimum
- Git: GitHub Flow (release branch → PR → main)
- Checklist: 18 items
- Typical use: General availability, paying customers

### Enterprise (`/ez:release enterprise v2.0.0`)
For: "Compliance-grade production"
- Scope: All MoSCoW priorities
- Coverage: 95% minimum
- Git: GitFlow (release/vX.Y.Z → develop → main)
- Checklist: 30 items
- Typical use: Enterprise customers, regulated industries

## Auto-Invocation (Smart Orchestration)

Based on tier, this command automatically runs pre-flight checks before the release:

| Tier | Auto Pre-flight |
|------|----------------|
| `mvp` | None — proceed directly to release checklist |
| `medium` | `[auto]` verify-work (if no existing VERIFICATION.md) |
| `enterprise` | `[auto]` verify-work → `[auto]` audit-milestone → `[auto]` arch-review |

All auto-invocations appear with `[auto]` prefix in output.

Override with `--no-auto` to skip all pre-invocations.

## Flags

| Flag | Effect |
|------|--------|
| `--no-auto` | Skip all auto pre-flight invocations |

## What It Does

1. **Smart pre-flight** (auto, tier-based — see above)
2. **Validates** state (clean working tree, tests passing, coverage meets tier threshold)
3. **Runs security gates** (no secrets, no critical vulns, no production TODOs)
4. **Evaluates tier checklist** (6/18/30 items based on tier)
5. **Creates release branch** (per tier git strategy)
6. **Generates changelog** (from commits since last tag)
7. **Bumps version** in package.json
8. **Creates rollback plan** in `.planning/releases/`
9. **Tags the release** with `v{version}`
10. **Reports Production Readiness Score** (0-100)

## Output Example

```
## Release: v1.0.0 (mvp tier)

Security Gates: 4/4 passed
Checklist: 6/6 items passed
Production Readiness Score: 96/100

Branch: main (trunk-based)
Tag: v1.0.0
Changelog: Updated
Rollback Plan: .planning/releases/v1.0.0-ROLLBACK-PLAN.md

✓ Ready to push:
  git push origin main && git push origin v1.0.0
```

## Tier Promotion

Promote tier when ready for more users:

```bash
# Start MVP
/ez:release mvp v1.0.0

# 3 months later, enough users for proper testing
/ez:release medium v1.5.0

# Enterprise deal signed
/ez:release enterprise v2.0.0
```

Each promotion checks that previous tier requirements are still satisfied.

## Preflight Check

Run checklist without creating release:

```bash
/ez:release preflight mvp
/ez:release preflight enterprise
```

Shows which items pass/fail without creating branch or tag.

## Related Commands

- `/ez:hotfix` — Emergency fix on released version
- `/ez:standup` — Check sprint health before release
- `/ez:arch-review` — Architecture review before release
- `/ez:verify-work` — Manual verification before release
