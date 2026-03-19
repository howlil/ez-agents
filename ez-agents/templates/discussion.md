---
phase: {phase-number}-{phase-slug}
status: open
participants: [ez-requirements-agent, ez-tech-lead-agent, ez-observer-agent, ez-scrum-master-agent]
opened: {timestamp}
consensus: pending
---

# Phase {X}: {Name} — Pre-Execution Discussion

**Purpose:** Parallel agent perspectives before phase execution. Orchestrator reads consensus before spawning executors.

---

## Requirements Perspective (ez-requirements-agent)

> *Populated by ez-requirements-agent during phase kickoff*

{Populated during gather-requirements or plan-phase kickoff}

---

## Tech Lead Perspective (ez-tech-lead-agent)

> *Populated by ez-tech-lead-agent during plan-phase review*

{Populated during arch-review after plan creation}

---

## Observer Perspective (ez-observer-agent)

> *Populated by ez-observer-agent during execute-phase pre-flight*

{Populated during execute-phase pre-flight}

---

## Scrum Master Perspective (ez-scrum-master-agent)

> *Populated by ez-scrum-master-agent during phase kickoff*

{Populated during standup or phase kickoff}

---

## Consensus

> *Synthesized by orchestrator from above perspectives*

**Status:** {open | consensus-reached | needs-human}

### Blockers
{List any hard blockers from any agent, or "None"}

### Key Warnings
{List significant warnings, or "None"}

### Go / No-Go
{GO — proceed to execution | NO-GO — resolve blockers first | HUMAN-NEEDED — requires user input}

### Rationale
{1-2 sentences explaining the consensus decision}

---

*Discussion opened: {timestamp}*
*Last updated: {timestamp}*
