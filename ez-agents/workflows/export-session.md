# Workflow: export-session

**Purpose:** Export session data for model handoff or archival

**Related Commands:** `/ez:export-session`

---

## Workflow Steps

### 1. Parameters

```
session_id: string (default: 'last')
format: 'markdown' | 'json' (default: 'markdown')
output_path: string (default: auto-generated)
```

### 2. Resolve Session

```
SessionManager mgr = new SessionManager();

if (session_id === 'last') {
  session = mgr.getLastSession();
  if (!session) {
    throw error("No sessions found");
  }
  session_id = session.metadata.session_id;
} else {
  session = mgr.loadSession(session_id);
  if (!session) {
    throw error(`Session not found: ${session_id}`);
  }
}

logger.info('Exporting session', { session_id });
```

### 3. Validate Format

```
if (!['markdown', 'json'].includes(format)) {
  throw error("Format must be 'markdown' or 'json'");
}
```

### 4. Generate Output Path

```
if (!output_path) {
  ext = format === 'markdown' ? 'md' : 'json';
  output_path = `.planning/sessions/export-${session_id}.${ext}`;
}
```

### 5. Export

```
SessionExport exporter = new SessionExport(mgr);

try {
  result = exporter.exportToFile(session_id, format, output_path);
} catch (SessionExportError err) {
  logger.error('Export failed', { session_id, format, error: err.message });
  throw error(`Export failed: ${err.message}`);
}
```

### 6. Verify Output

```
if (!fs.existsSync(output_path)) {
  throw error("Export verification failed: File not created");
}

const stats = fs.statSync(output_path);
if (stats.size === 0) {
  throw error("Export verification failed: File is empty");
}

logger.info('Export verified', { path: output_path, size: stats.size });
```

### 7. Log Success

```
logger.info('Session exported', { 
  session_id, 
  format, 
  output_path,
  size: stats.size 
});
```

### 8. Return Result

```
return {
  success: true,
  path: output_path,
  format: format,
  size: stats.size
};
```

---

## Output Format Examples

### Markdown Export
```markdown
# Session Export: session-20260319-143052

**Exported:** 2026-03-19T15:45:00.000Z
**Model:** qwen
**Phase:** 18
**Plan:** 18
**Duration:** 1h 15m

---

## Session Summary

**Objective:** Implement session memory and model continuity

**Completed:**
- Task 1: Create session error classes
- Task 2: Create session manager

**Incomplete:**
- Task 3: Create session export module

---

## Key Decisions

1. **Use timestamp-based session IDs**
   - Rationale: Easy to sort and identify
   - Status: Implemented

---

## File Changes

| File | Action | Reason |
|------|--------|--------|
| ez-agents/bin/lib/session-errors.cjs | created | Error classes |
| ez-agents/bin/lib/session-manager.cjs | created | Core module |

---

## Open Questions

None

---

## Blockers/Concerns

None

---

## Recommended Next Actions

- Complete session export module implementation

---

## Session Chain

- Previous: session-20260319-120000
- Current: session-20260319-143052
- Next: none
```

### JSON Export
```json
{
  "export_version": "1.0",
  "exported_at": "2026-03-19T15:45:00.000Z",
  "export_format": "json",
  "session": {
    "metadata": {
      "session_id": "session-20260319-143052",
      "session_version": "1.0",
      "started_at": "2026-03-19T14:30:52.000Z",
      "ended_at": "2026-03-19T15:45:00.000Z",
      "model": "qwen",
      "phase": 18,
      "plan": 18,
      "status": "completed",
      "session_chain": ["session-20260319-120000"],
      "token_usage": {
        "input": 50000,
        "output": 30000,
        "total": 80000
      }
    },
    "context": {
      "transcript": "...",
      "tasks": [],
      "decisions": [],
      "file_changes": [],
      "open_questions": [],
      "blockers": []
    },
    "state": {
      "current_phase": 18,
      "current_plan": 18,
      "incomplete_tasks": [],
      "last_action": "Task 2 complete",
      "next_recommended_action": "Continue with Task 3"
    }
  }
}
```

---

## Error Handling

### Session Not Found
```
if (!session) {
  throw error(`Session not found: ${session_id}`);
}
```

### Invalid Format
```
if (!['markdown', 'json'].includes(format)) {
  throw error(`Unsupported export format: ${format}`);
}
```

### Write Failure
```
try {
  safePlanningWriteSync(output_path, content);
} catch (err) {
  logger.error('Write failed', { path: output_path, error: err.message });
  throw error(`Failed to write export file: ${err.message}`);
}
```

---

## Related Files

- `ez-agents/bin/lib/session-manager.cjs` - Session loading
- `ez-agents/bin/lib/session-export.cjs` - Export logic
- `ez-agents/bin/lib/planning-write.cjs` - Safe file writes
- `.planning/sessions/` - Output directory
