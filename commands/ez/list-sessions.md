---
name: ez:list-sessions
description: List all sessions
argument-hint: "[--limit N] [--json]"
allowed-tools:
  - Read
  - Bash
---

<objective>
List all sessions with metadata and disk usage summary.

This command:
- Lists sessions with: session_id, started_at, ended_at, model, phase, plan, status
- Sorts by date (newest first)
- Shows disk usage summary
- Supports --limit N parameter to restrict output
- Supports --json flag for machine-readable output
</objective>

<execution_context>
None - Direct command implementation
</execution_context>

<context>
$ARGUMENTS

Parameters:
- --limit: Optional. Maximum sessions to display (default: 20)
- --json: Optional. Output as JSON instead of table
</context>

<process>
Execute the following workflow:

1. **Parse parameters:**
   - Extract --limit flag (default: 20)
   - Extract --json flag (default: false)

2. **List sessions:**
   - Create SessionManager instance
   - Call listSessions()
   - Slice to limit

3. **Calculate disk usage:**
   - Read all session files from .planning/sessions/
   - Sum file sizes
   - Format as KB/MB

4. **Display table (non-JSON mode):**
   ```
   Sessions (showing {N} of {total}):

   | Session ID | Started | Ended | Model | Phase | Plan | Status |
   |------------|---------|-------|-------|-------|------|--------|
   {rows}

   Disk usage: {size} ({file_count} sessions)
   ```

   Example output:
   ```
   Sessions (showing 5 of 12):

   | Session ID              | Started           | Ended             | Model  | Phase | Plan | Status    |
   |-------------------------|-------------------|-------------------|--------|-------|------|-----------|
   | session-20260319-143052 | 2026-03-19T14:30  | 2026-03-19T15:45  | qwen   | 18    | 18   | completed |
   | session-20260319-120000 | 2026-03-19T12:00  | 2026-03-19T13:15  | claude | 17    | 16   | completed |
   | session-20260319-090000 | 2026-03-19T09:00  | 2026-03-19T10:30  | qwen   | 17    | 15   | completed |

   Disk usage: 2.4 MB (12 sessions)
   ```

5. **JSON mode:**
   - Output: { sessions: [...], disk_usage: bytes, total: count }
   ```json
   {
     "sessions": [
       {
         "session_id": "session-20260319-143052",
         "started_at": "2026-03-19T14:30:52.000Z",
         "ended_at": "2026-03-19T15:45:00.000Z",
         "model": "qwen",
         "phase": 18,
         "plan": 18,
         "status": "completed"
       }
     ],
     "disk_usage": 2516582,
     "total": 12
   }
   ```

6. **Handle empty state:**
   - If no sessions: output "No sessions found. Start working to create your first session."
</process>
