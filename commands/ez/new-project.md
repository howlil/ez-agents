---
name: ez:new-project
description: Initialize a new project with deep context gathering and PROJECT.md
argument-hint: "[--auto]"
allowed-tools:
  - Read
  - Bash
  - Write
  - Task
  - AskUserQuestion
---
<context>
**Flags:**
- `--auto` — Automatic mode. After config questions, runs research → requirements → roadmap without further interaction. Expects idea document via @ reference.
</context>

<objective>
Initialize a new project through unified flow: questioning → research (optional) → requirements → roadmap.

**Creates:**
- `.planning/PROJECT.md` — project context
- `.planning/config.json` — workflow preferences
- `.planning/research/` — domain research (optional)
- `.planning/REQUIREMENTS.md` — scoped requirements
- `.planning/ROADMAP.md` — phase structure
- `.planning/STATE.md` — project memory
- `.planning/ADR/` — Architecture Decision Records (optional)

**Architecture Decision:**
Uses `principal_engineer_decision_v1` skill to recommend:
- Architecture pattern (monolith, modular monolith, microservices)
- Tech stack (backend, frontend, database)
- Infrastructure (deployment, scaling strategy)
Based on team size, timeline, budget, and complexity.

**After this command:** Run `/ez:plan-phase 1` to start execution.
</objective>

<execution_context>
@~/.claude/ez-agents/workflows/new-project.md
@~/.claude/ez-agents/references/questioning.md
@~/.claude/ez-agents/references/ui-brand.md
@~/.claude/ez-agents/templates/project.md
@~/.claude/ez-agents/templates/requirements.md
@skills/architecture/principal-engineer-decision/principal_engineer_decision_v1/SKILL.md
</execution_context>

<process>
Execute the new-project workflow from @~/.claude/ez-agents/workflows/new-project.md end-to-end.
Preserve all workflow gates (validation, approvals, commits, routing).
</process>
