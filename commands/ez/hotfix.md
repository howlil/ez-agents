---
name: ez:hotfix
description: Create and complete a hotfix branch. Branches from production tag, fixes, then merges to main (and develop for enterprise).
argument-hint: "start <name> | complete <name> <version>"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

<execution_context>
@~/.claude/ez-agents/workflows/hotfix.md
</execution_context>

<process>
Execute the hotfix workflow from @~/.claude/ez-agents/workflows/hotfix.md end-to-end.
Parse ARGUMENTS for subcommand (start|complete), name, and version before executing.
</process>

# /ez:hotfix

Create and complete a hotfix for a critical production bug. Hotfix branches from the production tag (or main), applies the fix, then merges atomically to both main and develop (if using GitFlow).

## Usage

```
/ez:hotfix start <name>
/ez:hotfix complete <name> <version>
```

## Commands

### start

Create a hotfix branch from main:

```bash
/ez:hotfix start critical-bug
# Creates: hotfix/critical-bug from main
# Prints: current version + how to complete
```

### complete

Finish and release the hotfix:

```bash
/ez:hotfix complete critical-bug 1.0.1
# 1. Runs security gates
# 2. Runs tests
# 3. Merges hotfix/critical-bug → main
# 4. Tags: v1.0.1
# 5. If GitFlow: syncs to develop
# 6. Creates rollback plan
# 7. Updates CHANGELOG.md
```

## Why Hotfix?

A hotfix keeps the main branch clean while you're fixing bugs:

```
Without hotfix:                  With hotfix:
main:  A──B──C──D──[broken]      main:  A──B──C──D──fix──tag
              ↑                              ↑
         You committed                  hotfix/bug branches
         incomplete work                here, merges when done
         to main
```

No incomplete work on main. No risk of accidentally shipping in-progress features.

## Tier Behavior

The hotfix workflow adapts to your release tier:

| Tier | Hotfix From | Hotfix To | Sync To |
|------|-------------|-----------|---------|
| MVP | main | main | — |
| Medium | main | main (PR) | — |
| Enterprise | main | main | develop |

In enterprise mode, after merging to main the hotfix is also merged to develop so no work is lost.

## Example Session

```bash
# Production bug reported: login broken for @gmail.com users
/ez:hotfix start gmail-login-fix

# Now on hotfix/gmail-login-fix branch
# ... make the fix ...
# git add src/auth/login.ts
# git commit -m "fix(auth): handle + character in email addresses"

# Release the fix
/ez:hotfix complete gmail-login-fix 1.0.1
# Tests run, security gates pass
# Merged to main, tagged v1.0.1
# Changelog updated
# Rollback plan created
#
# Ready to push:
#   git push origin main && git push origin v1.0.1
```

## Rollback Plan

Every hotfix creates a rollback plan in case the fix itself breaks something:
```
.planning/releases/v1.0.1-ROLLBACK-PLAN.md
```

## Related Commands

- `/ez:release` — Full release workflow
- `/ez:verify-work` — Verify fix before completing
