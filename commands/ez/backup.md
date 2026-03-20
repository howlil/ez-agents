---
name: ez:backup
description: Create, list, and verify EZ Agents recovery backups
argument-hint: "[create|list|verify] [--label <name>] [--backup <id>]"
allowed-tools:
  - Bash
  - Read
  - Write
---
<objective>
Manage EZ Agents recovery backups: create new backups, list existing backups, and verify backup integrity.
</objective>

<context>
@.planning/REQUIREMENTS.md
@.planning/phases/22-disaster-recovery-and-business-continuity/22-CONTEXT.md
</context>

<process>

## 1. Parse Command

Extract subcommand and options from user input:
- `create` — Create a new backup
  - `--label <name>` — Optional label for the backup (default: "manual")
  - `--verify` — Verify backup after creation
- `list` — List all available backups
- `verify` — Verify an existing backup
  - `--backup <id>` — Backup ID or path to verify

## 2. Execute Subcommand

### Create Backup

```bash
node ez-agents/bin/ez-tools.cjs recovery backup [--label <name>] [--verify]
```

Display result:
```
✅ Backup created: backup-{timestamp}-{label}
📁 Location: .planning/recovery/backups/backup-{timestamp}-{label}/
📊 Files: {count} files backed up
🔐 Commit: {commit_sha}
```

If `--verify` was passed:
```
✅ Verification passed: {count} files checked
```

### List Backups

```bash
node ez-agents/bin/ez-tools.cjs recovery list-backups
```

Display results in table format:
```
## Available Backups

| Backup ID | Created | Files | Commit |
|-----------|---------|-------|--------|
| backup-... | 2026-03-20T... | 42 | abc1234 |
| backup-... | 2026-03-19T... | 40 | def5678 |

Total: {count} backups
```

If no backups exist:
```
No backups found. Create one with: /ez:backup create
```

### Verify Backup

```bash
node ez-agents/bin/ez-tools.cjs recovery verify-backup --backup <id>
```

Display result:
```
✅ Backup verified: {backup_id}
📊 Checked: {count} files
✅ All checksums valid
```

On failure:
```
❌ Verification failed: {backup_id}
⚠️  Issues found:
  - Missing file: {path}
  - Checksum mismatch: {path}
```

## 3. Error Handling

If backup creation fails:
```
❌ Backup failed: {error_message}

Common causes:
- .planning directory not initialized
- Insufficient disk space
- File permissions issue
```

If backup not found for verification:
```
❌ Backup not found: {backup_id}

Available backups:
{list backup IDs}
```

</process>

<examples>

## Create a manual backup

```
/ez:backup create
```

## Create a labeled backup

```
/ez:backup create --label pre-migration
```

## Create and verify backup

```
/ez:backup create --verify
```

## List all backups

```
/ez:backup list
```

## Verify a specific backup

```
/ez:backup verify --backup backup-1710950400000-manual
```

</examples>
