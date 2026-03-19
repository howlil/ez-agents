---
name: ez:progress
description: Check project progress, show context, and route to next action (execute or plan)
argument-hint: "[--no-auto]"
allowed-tools:
  - Read
  - Bash
  - Grep
  - Glob
---
<objective>
Check project progress, summarize recent work and what's ahead, then intelligently route to the next action - either executing an existing plan or creating the next one.

Provides situational awareness before continuing work.
</objective>

<execution_context>
@~/.claude/ez-agents/workflows/progress.md
</execution_context>

<context>
Arguments: $ARGUMENTS

**Flags:**
- `--no-auto` — Disable silent health check auto-invocation.

**Smart Orchestration (auto, unless --no-auto):**
- Pre: health check (warns in report on FAIL, does not stop progress)

Health check result is silent on pass. Only shown in output if health fails.
</context>

<process>
Execute the progress workflow from @~/.claude/ez-agents/workflows/progress.md end-to-end.
Preserve all routing logic (Routes A through F) and edge case handling.
</process>
