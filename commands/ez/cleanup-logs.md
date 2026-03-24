---
name: ez:cleanup-logs
description: Delete old log files to prevent git spam
argument-hint: "[--dry-run]"
allowed-tools:
  - Bash
---

<objective>
Clean up old log files from `.planning/logs/` to prevent git spam.

**Behavior:**
- Default: Delete logs older than 7 days
- `--dry-run`: Show what would be deleted without actually deleting

**Output:** Summary of deleted files and space reclaimed
</objective>

<process>
Run log rotation utility:

```bash
# Normal mode (delete logs > 7 days old)
node ez-agents/bin/lib/log-rotation.cjs

# Dry run (preview only)
node ez-agents/bin/lib/log-rotation.cjs --dry-run
```

**Output:**
```
Deleted: ez-1774017848600.log
Deleted: ez-1774017848692.log
...

Log Rotation Complete
  Deleted: 952 files (45.3 MB)
  Kept: 23 files (last 7 days)
```
</process>

<success_criteria>
- [ ] Logs older than 7 days deleted
- [ ] Recent logs preserved
- [ ] Summary displayed to user
- [ ] No errors during deletion
</success_criteria>
