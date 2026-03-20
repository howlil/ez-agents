---
name: ez:restore-drill
description: Execute and record restore drill verification
argument-hint: "[--backup <id>] [--cleanup]"
allowed-tools:
  - Bash
  - Read
  - Write
---
<objective>
Execute restore drill to verify backup integrity and recovery capability.
</objective>

<context>
@.planning/REQUIREMENTS.md
@.planning/phases/22-disaster-recovery-and-business-continuity/22-CONTEXT.md
</context>

<process>

## 1. Parse Command

Extract options from user input:
- `--backup <id>` — Specific backup ID to drill (default: latest)
- `--cleanup` — Clean up temp files after drill (default: true)

## 2. Execute Drill

```bash
node ez-agents/bin/ez-tools.cjs recovery drill [--backup <id>] [--cleanup]
```

### Default Behavior (no --backup)

Uses the most recent backup for the drill.

### With --backup

Drills the specified backup ID.

### With --no-cleanup

Preserves temp restore directory for inspection.

## 3. Display Results

On success:
```
✅ Restore Drill Complete

Drill ID: drill-{timestamp}-{hash}
Backup: backup-{timestamp}-{label}
Status: SUCCESS
Checks Passed: {N}/{N}

Drill Report: .planning/recovery/drills/{timestamp}.json
```

On failure:
```
❌ Restore Drill Failed

Drill ID: drill-{timestamp}-{hash}
Backup: backup-{timestamp}-{label}
Status: FAILED

Failed Checks:
  - {check_name}: {details}

Drill Report: .planning/recovery/drills/{timestamp}.json
```

## 4. List Drills

```bash
node ez-agents/bin/ez-tools.cjs recovery list-drills
```

Display:
```
## Restore Drills

| Drill ID | Backup | Status | Completed |
|----------|--------|--------|-----------|
| drill-... | backup-... | ✅ success | 2026-03-20T... |
| drill-... | backup-... | ❌ failed | 2026-03-19T... |

Total: {count} drills
```

</process>

<examples>

## Run drill on latest backup

```
/ez:restore-drill
```

## Run drill on specific backup

```
/ez:restore-drill --backup backup-1710950400000-manual
```

## Run drill and preserve temp files

```
/ez:restore-drill --no-cleanup
```

## List all drills

```
/ez:restore-drill list
```

</examples>
