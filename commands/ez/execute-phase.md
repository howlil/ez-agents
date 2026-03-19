---
name: ez:execute-phase
description: Execute all plans in a phase with wave-based parallelization
argument-hint: "<phase-number> [--gaps-only]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - TodoWrite
  - AskUserQuestion
---
<objective>
Execute all plans in a phase using wave-based parallel execution.

Orchestrator stays lean: discover plans, analyze dependencies, group into waves, spawn subagents, collect results. Each subagent loads the full execute-plan context and handles its own plan.

Context budget: ~15% orchestrator, 100% fresh per subagent.
</objective>

<execution_context>
@~/.claude/ez-agents/workflows/execute-phase.md
@~/.claude/ez-agents/references/ui-brand.md
</execution_context>

<context>
Phase: $ARGUMENTS

**Flags:**
- `--gaps-only` — Execute only gap closure plans (plans with `gap_closure: true` in frontmatter). Use after verify-work creates fix plans.
- `--no-auto` — Disable all smart orchestration auto-invocations (health check, discuss-phase, verify-work, add-todo). Expert mode.
- `--verbose` — Show detail for every auto-invocation step.
- `--skip-discussion` — Skip auto discuss-phase only (more granular than --no-auto).

**Smart Orchestration (auto, unless --no-auto):**
- Pre: health check (stops on FAIL)
- Pre (medium/enterprise tier, no CONTEXT.md): discuss-phase --auto
- Post: verify-work (warnings only, non-blocking)
- Post (scope creep detected in DISCUSSION.md): add-todo

All auto-invocations appear with `[auto]` prefix in output.

Context files are resolved inside the workflow via `ez-tools init execute-phase` and per-subagent `<files_to_read>` blocks.
</context>

<process>
Execute the execute-phase workflow from @~/.claude/ez-agents/workflows/execute-phase.md end-to-end.
Preserve all workflow gates (wave execution, checkpoint handling, verification, state updates, routing).
</process>
