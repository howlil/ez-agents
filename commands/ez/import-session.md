---
name: ez:import-session
description: Import session from file
argument-hint: "<file.json> [--source-model model]"
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---

<objective>
Import a session from an exported file to continue work or switch models.

This command:
- Accepts a session file path (JSON format)
- Validates file exists and is valid JSON
- Validates session structure and chain integrity
- Calls SessionImport.import() with optional source model adapter
- Shows session summary after import
- Offers to resume imported session
</objective>

<execution_context>
@~/.claude/ez-agents/workflows/import-session.md
</execution_context>

<context>
$ARGUMENTS

Parameters:
- file_path: Required. Path to session export file (.json)
- --source-model: Optional. Source model for adapter (claude, qwen, openai, kimi)
</context>

<process>
**Follow the import-session workflow** from @~/.claude/ez-agents/workflows/import-session.md.

The workflow handles all import logic including:

1. **Validate file path:**
   - Check file exists using fs.existsSync
   - If not: error "File not found: {path}"
   - Check file ends with .json
   - If not: error "Import file must be .json format"

2. **Parse parameters:**
   - Extract file_path from args
   - Extract --source-model flag (optional)

3. **Import session:**
   - Create SessionImport instance with SessionManager
   - Call import(file_path, { sourceModel })
   - Catch SessionImportError and display:
     - Error type
     - Validation errors
     - Suggested fix

4. **Show import confirmation:**
   ```
   Session imported successfully!

   Session ID: {sessionId}
   Source: {file_path}
   Original model: {model}
   Original phase: {phase}

   Warnings: {warnings if any}
   ```

5. **Show session summary:**
   - Display key info from imported session:
     - Tasks completed
     - Tasks incomplete
     - Key decisions
     - File changes

6. **Offer follow-up actions:**
   - "Resume this session?"
   - "View session chain?"
   - "Return to current session?"
</process>
