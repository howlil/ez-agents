---
name: ez:export-session
description: Export session for model handoff
argument-hint: "[session_id] [--format markdown|json] [--output path]"
allowed-tools:
  - Read
  - Write
  - Bash
---

<objective>
Export a session summary for handoff to a different model or for archival.

This command:
- Accepts optional session ID (default: last session)
- Supports markdown and JSON export formats
- Writes output to specified path or default location
- Shows confirmation message with export details
- Enables seamless model transitions (Claude ↔ Qwen ↔ OpenAI ↔ Kimi)
</objective>

<execution_context>
@~/.claude/ez-agents/workflows/export-session.md
</execution_context>

<context>
$ARGUMENTS

Parameters:
- session_id: Optional. Session ID to export (default: last session)
- --format: Optional. Export format: 'markdown' or 'json' (default: markdown)
- --output: Optional. Output file path (default: .planning/sessions/export-{session_id}.{ext})
</context>

<process>
**Follow the export-session workflow** from @~/.claude/ez-agents/workflows/export-session.md.

The workflow handles all export logic including:

1. **Parse parameters:**
   - Extract session_id from args (or use "last")
   - Extract --format flag (default: 'markdown')
   - Extract --output flag (default: auto-generated)

2. **Resolve session ID:**
   - If session_id === 'last':
     - Call SessionManager.getLastSession()
     - Use session.metadata.session_id
   - Else: use provided session_id

3. **Validate format:**
   - Must be 'markdown' or 'json'
   - If invalid: error "Format must be 'markdown' or 'json'"

4. **Generate output path if not specified:**
   - For markdown: `.planning/sessions/export-{session_id}.md`
   - For JSON: `.planning/sessions/export-{session_id}.json`

5. **Export session:**
   - Create SessionExport instance with SessionManager
   - Call exportToFile(sessionId, format, outputPath)
   - Catch SessionExportError and display user-friendly message

6. **Show confirmation:**
   ```
   Session exported successfully!

   Session: {session_id}
   Format: {format}
   Output: {outputPath}

   You can now share this file with another model or import it later.
   ```

7. **Offer follow-up actions:**
   - "Open file?"
   - "Export another session?"
   - "Return to work?"
</process>
