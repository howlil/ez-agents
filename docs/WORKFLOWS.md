# EZ Agents Workflows

Complete workflow diagrams for different project scenarios. For command reference, see [USER-GUIDE.md](USER-GUIDE.md).

---

## Table of Contents

- [Complete Workflow](#complete-workflow)
- [Agent Orchestration](#agent-orchestration)
- [Wave Execution Model](#wave-execution-model)
- [Context Engineering](#context-engineering)
- [Use Cases](#use-cases)
  - [Greenfield Project](#greenfield-project-from-scratch)
  - [Brownfield Project](#brownfield-project-existing-codebase)
  - [Quick Task](#quick-task-ad-hoc)
  - [Milestone with Audit Gaps](#milestone-with-audit-gaps)
  - [Debug Session](#debug-session)

---

## Complete Workflow

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         EZ AGENTS COMPLETE WORKFLOW                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

                                            ┌─────────────────────┐
                                            │   START PROJECT     │
                                            └─────────┬───────────┘
                                                      │
                              ┌───────────────────────┴───────────────────────┐
                              │                                               │
                              ▼                                               ▼
                    ┌───────────────────┐                         ┌───────────────────┐
                    │  GREENFIELD       │                         │   BROWNFIELD      │
                    │  (No code yet)    │                         │  (Existing code)  │
                    └─────────┬─────────┘                         └─────────┬─────────┘
                              │                                             │
                              │                                             ▼
                              │                                   ┌───────────────────┐
                              │                                   │  /ez:map-codebase │
                              │                                   │                   │
                              │                                   │ Parallel mappers: │
                              │                                   │ - STACK.md        │
                              │                                   │ - ARCHITECTURE.md │
                              │                                   │ - CONVENTIONS.md  │
                              │                                   │ - STRUCTURE.md    │
                              │                                   │ - INTEGRATIONS.md │
                              │                                   │ - TESTING.md      │
                              │                                   │ - CONCERNS.md     │
                              │                                   └─────────┬─────────┘
                              │                                             │
                              └───────────────────────┬─────────────────────┘
                                                      │
                                                      ▼
                                            ┌───────────────────┐
                                            │  /ez:new-project  │
                                            │                   │
                                            │ 1. Questions      │
                                            │ 2. Research       │
                                            │ 3. Requirements   │
                                            │ 4. Roadmap        │
                                            └─────────┬─────────┘
                                                      │
                                                      ▼
                                            ┌───────────────────┐
                                            │  MILESTONE v1.0   │
                                            │  (or v1.1, v2.0)  │
                                            └─────────┬─────────┘
                                                      │
         ┌────────────────────────────────────────────┼────────────────────────────────────────────┐
         │                                            │                                            │
         ▼                                            ▼                                            ▼
┌───────────────────┐                        ┌───────────────────┐                        ┌───────────────────┐
│  PHASE 1          │                        │  PHASE 2          │                        │  PHASE N          │
│                   │                        │                   │                        │                   │
│ ┌───────────────┐ │                        │ ┌───────────────┐ │                        │ ┌───────────────┐ │
│ │/ez:discuss    │ │                        │ │/ez:discuss    │ │                        │ │/ez:discuss    │ │
│ │-phase 1       │ │                        │ │-phase 2       │ │                        │ │-phase N       │ │
│ └───────┬───────┘ │                        │ └───────┬───────┘ │                        │ └───────┬───────┘ │
│         │         │                        │         │         │                        │         │         │
│         ▼         │                        │         ▼         │                        │         ▼         │
│ ┌───────────────┐ │                        │ ┌───────────────┐ │                        │ ┌───────────────┐ │
│ │/ez:plan       │ │                        │ │/ez:plan       │ │                        │ │/ez:plan       │ │
│ │-phase 1       │ │                        │ │-phase 2       │ │                        │ │-phase N       │ │
│ └───────┬───────┘ │                        │ └───────┬───────┘ │                        │ └───────┬───────┘ │
│         │         │                        │         │         │                        │         │         │
│         ▼         │                        │         ▼         │                        │         ▼         │
│ ┌───────────────┐ │                        │ ┌───────────────┐ │                        │ ┌───────────────┐ │
│ │/ez:execute    │ │                        │ │/ez:execute    │ │                        │ │/ez:execute    │ │
│ │-phase 1       │ │                        │ │/ez:execute    │ │                        │ │-phase N       │ │
│ └───────┬───────┘ │                        │ │-phase 2       │ │                        │ └───────┬───────┘ │
│         │         │                        │ └───────┬───────┘ │                        │         │         │
│         ▼         │                        │         │         │                        │         ▼         │
│ ┌───────────────┐ │                        │         ▼         │                        │ ┌───────────────┐ │
│ │/ez:verify     │ │                        │ ┌───────────────┐ │                        │ │/ez:verify     │ │
│ │-work 1        │ │                        │ │/ez:verify     │ │                        │ │-work N        │ │
│ └───────────────┘ │                        │ │-work 2        │ │                        │ └───────────────┘ │
│                   │                        │ └───────────────┘ │                        │                   │
└───────────────────┘                        └───────────────────┘                        └───────────────────┘
         │                                            │                                            │
         └────────────────────────────────────────────┴────────────────────────────────────────────┘
                                                      │
                                                      ▼
                                            ┌───────────────────┐
                                            │ /ez:audit-        │
                                            │ milestone         │
                                            │                   │
                                            │ ✓ Requirements    │
                                            │   coverage        │
                                            │ ✓ Cross-phase     │
                                            │   integration     │
                                            │ ✓ E2E flows       │
                                            └─────────┬─────────┘
                                                      │
                              ┌───────────────────────┴───────────────────────┐
                              │                                               │
                              ▼                                               ▼
                    ┌───────────────────┐                         ┌───────────────────┐
                    │   AUDIT PASS      │                         │   AUDIT FAIL      │
                    └─────────┬─────────┘                         └─────────┬─────────┘
                              │                                             │
                              ▼                                             ▼
                    ┌───────────────────┐                         ┌───────────────────┐
                    │ /ez:complete-     │                         │ /ez:plan-milestone│
                    │ milestone         │                         │ -gaps             │
                    │                   │                         │                   │
                    │ - Archive to      │                         │ Create fix phases │
                    │   milestones/     │                         │                   │
                    │ - Git tag v1.0    │                         │ Back to phase loop│
                    │ - Collapse ROADMAP│                         │                   │
                    └─────────┬─────────┘                         └───────────────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ /ez:new-milestone │
                    │                   │
                    │ Start v1.1, v2.0  │
                    │ (back to top)     │
                    └───────────────────┘
```

---

## Agent Orchestration

EZ Agents is a thin orchestrator that spawns specialized agents, collects results, and routes to the next step. The orchestrator never does heavy lifting itself.

```
┌─────────────────────────────────────────────────────────────────┐
│                    EZ Agents Orchestrator                        │
├─────────────────────────────────────────────────────────────────┤
│  Thin coordinator that spawns specialized agents, collects       │
│  results, and routes to the next step. Never does heavy lifting. │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌─────────────────┐   ┌─────────────────┐
│ ez-planner    │   │ ez-executor     │   │ ez-verifier     │
│ ez-researcher │   │ ez-debugger     │   │ ez-auditor      │
│ ez-mapper     │   │ ez-checker      │   │ ez-roadmapper   │
└───────────────┘   └─────────────────┘   └─────────────────┘
```

**Specialized Agents:**

| Agent | Purpose |
|-------|---------|
| `ez-planner` | Breaks requirements into actionable tasks |
| `ez-executor` | Implements tasks with atomic commits |
| `ez-verifier` | Validates implementation against requirements |
| `ez-researcher` | Investigates domain, ecosystem, best practices |
| `ez-debugger` | Systematic problem diagnosis |
| `ez-auditor` | Milestone completeness audit |
| `ez-mapper` | Analyzes existing codebases (brownfield) |
| `ez-checker` | Plan quality verification |
| `ez-roadmapper` | Roadmap creation and maintenance |

---

## Wave Execution Model

Plans are grouped into waves based on dependencies. Independent plans run in parallel; dependent plans wait for prerequisites.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         PHASE EXECUTION: WAVE MODEL                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

Wave 1 (parallel)                    Wave 2 (parallel)                    Wave 3 (sequential)
┌─────────────────┐                  ┌─────────────────┐                  ┌─────────────────┐
│ ┌─────────────┐ │                  │ ┌─────────────┐ │                  │ ┌─────────────┐ │
│ │   Plan 01   │ │                  │ │   Plan 03   │ │                  │ │   Plan 05   │ │
│ │             │ │                  │ │             │ │                  │ │             │ │
│ │ User Model  │ │                  │ │ Orders API  │ │                  │ │ Checkout UI │ │
│ │ + Auth      │ │                  │ │             │ │                  │ │             │ │
│ └─────────────┘ │                  │ └─────────────┘ │                  │ └─────────────┘ │
│                 │       ┌──────────│                 │       ┌──────────│                 │
│ ┌─────────────┐ │       │          │ ┌─────────────┐ │       │          │ ┌─────────────┐ │
│ │   Plan 02   │ │       │          │ │   Plan 04   │ │       │          │ │   Plan 06   │ │
│ │             │ │       │          │ │             │ │       │          │ │             │ │
│ │ Product     │ │       │          │ │ Cart API    │ │       │          │ │ Payment     │ │
│ │ Model       │ │       │          │ │             │ │       │          │ │ Integration │ │
│ └─────────────┘ │       │          │ └─────────────┘ │       │          │ └─────────────┘ │
└─────────────────┘       │          └─────────────────┘       │          └─────────────────┘
        │                 │                    │                │                    │
        │                 │                    │                │                    │
        └─────────────────┴────────────────────┴────────────────┘                    │
        Dependencies:                                                                 │
        - Plan 03 needs Plan 01 (Orders API needs User Model)                        │
        - Plan 04 needs Plan 02 (Cart API needs Product Model)                       │
        - Plan 05 needs Plans 03 + 04 (Checkout needs Orders + Cart)                 │
        - Plan 06 needs Plan 05 (Payment needs Checkout)                             │
```

**Key Points:**

- **Wave 1:** All independent tasks execute in parallel with fresh context
- **Wave 2+:** Tasks wait for dependencies, then execute in parallel
- **Each task:** Gets fresh 200K token context window
- **Each task:** Creates atomic git commit with meaningful message

---

## Context Engineering

EZ Agents preserves decisions, requirements, and project state across sessions using a structured context system.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         CONTEXT ENGINEERING SYSTEM                                                   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  .planning/                                                                                                      │
│                                                                                                                  │
│  ├── PROJECT.md          ← What you're building and why (vision, stack, users, constraints)                      │
│  ├── REQUIREMENTS.md     ← Scoped requirements with IDs (AUTH-01, API-03, etc.)                                  │
│  ├── ROADMAP.md          ← Phase breakdown with status, progress bars                                            │
│  ├── STATE.md            ← Current decisions, blockers, next steps (project memory)                              │
│  ├── config.json         ← Workflow preferences, model profile, git strategy                                     │
│  │                                                                                                               │
│  ├── codebase/           ← Brownfield analysis (generated by /ez:map-codebase)                                   │
│  │   ├── STACK.md        ← Detected technologies, versions, dependencies                                         │
│  │   ├── ARCHITECTURE.md ← System architecture, patterns, data flow                                              │
│  │   ├── CONVENTIONS.md  ← Coding standards, naming, structure                                                   │
│  │   ├── STRUCTURE.md    ← Directory layout, module organization                                                 │
│  │   ├── INTEGRATIONS.md ← External services, APIs, third-party libs                                             │
│  │   ├── TESTING.md      ← Test frameworks, coverage, patterns                                                   │
│  │   └── CONCERNS.md     ← Technical debt, pain points, risks                                                    │
│  │                                                                                                               │
│  ├── phases/             ← Phase-specific artifacts                                                              │
│  │   ├── 01-foundation/                                                                  │
│  │   │   ├── 01-01-PLAN.md       ← Tasks to execute (wave-based, with dependencies)                              │
│  │   │   ├── 01-01-SUMMARY.md    ← What was built and why (after execution)                                      │
│  │   │   ├── CONTEXT.md          ← Implementation preferences, vision                                            │
│  │   │   ├── RESEARCH.md         ← Domain research, best practices                                               │
│  │   │   └── VERIFICATION.md     ← Test results, UAT sign-off                                                    │
│  │   │                                                                                                           │
│  │   ├── 02-auth/                                                                      │
│  │   └── 03-core-features/                                                               │
│  │                                                                                                               │
│  ├── research/           ← Domain research (generated during /ez:new-project)                                    │
│  │   ├── domain-analysis.md                                                                                    │
│  │   └── competitive-landscape.md                                                                              │
│  │                                                                                                               │
│  └── milestones/         ← Archived milestones (after /ez:complete-milestone)                                    │
│      ├── v1.0-ROADMAP.md                                                                                       │
│      └── v1.0-REQUIREMENTS.md                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Context Flow Across Phases

```
Phase N-1 Complete              Phase N Planning                Phase N Execution
┌─────────────────┐            ┌─────────────────┐            ┌─────────────────┐
│                 │            │                 │            │                 │
│  STATE.md       │───────────►│  STATE.md       │───────────►│  STATE.md       │
│  (decisions,    │  read      │  (updated       │  read      │  (updated       │
│   blockers)     │  context   │   position)     │  context   │   progress)     │
│                 │            │                 │            │                 │
│  SUMMARY.md     │───────────►│  PLAN.md        │───────────►│  SUMMARY.md     │
│  (what built)   │  informs   │  (new tasks)    │  executed  │  (new work)     │
│                 │            │                 │            │                 │
│  git commits    │───────────►│  git diff       │───────────►│  git commits    │
│  (history)      │  reviewed  │  (changes)      │  extended  │  (new history)  │
└─────────────────┘            └─────────────────┘            └─────────────────┘
```

### Context Preservation Benefits

| Problem | Without Context Engineering | With EZ Agents |
|---------|----------------------------|----------------|
| **Lost decisions** | "Why did we choose JWT again?" | STATE.md records all decisions with rationale |
| **Session discontinuity** | "What was I working on?" | STATE.md tracks current position, next steps |
| **Requirements drift** | "Did we build that?" | REQUIREMENTS.md traces features to IDs |
| **Architecture amnesia** | "How does auth work here?" | PROJECT.md + CONTEXT.md preserve vision |
| **Git archaeology** | Hunting through commit history | ROADMAP.md shows phase status at a glance |

---

## Use Cases

### Greenfield Project (From Scratch)

```
┌──────────────┐
│ User Story   │ "I want to build a task management app with team collaboration"
└──────┬───────┘
       │
       ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ MILESTONE 1: MVP (v1.0)                                                                                          │
├───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │ PHASE 1: Foundation                                                                                        │ │
│  │                                                                                                             │ │
│  │  /ez:discuss-phase 1                                                                                        │ │
│  │  ├── Clarify: Tech stack preferences? → "Next.js + PostgreSQL"                                              │ │
│  │  ├── Clarify: Auth method? → "Email + OAuth (Google, GitHub)"                                               │ │
│  │  └── Output: 1-CONTEXT.md                                                                                   │ │
│  │                                                                                                             │ │
│  │  /ez:plan-phase 1                                                                                           │ │
│  │  ├── Research: Next.js auth patterns, PostgreSQL schema design                                              │ │
│  │  ├── Plans: 1-01-user-auth.md, 1-02-database-schema.md, 1-03-project-setup.md                               │ │
│  │  └── Output: 1-RESEARCH.md, 3 PLAN files                                                                    │ │
│  │                                                                                                             │ │
│  │  /ez:execute-phase 1                                                                                        │ │
│  │  ├── Wave 1: Plan 1-02 (schema), Plan 1-03 (setup) [parallel]                                               │ │
│  │  ├── Wave 2: Plan 1-01 (auth) [depends on schema]                                                           │ │
│  │  └── Output: 3 SUMMARY.md files, 3 atomic commits                                                           │ │
│  │                                                                                                             │ │
│  │  /ez:verify-work 1                                                                                          │ │
│  │  ├── Test: Can register/login? ✓                                                                            │ │
│  │  ├── Test: Can connect to DB? ✓                                                                             │ │
│  │  └── Output: 1-VERIFICATION.md, 1-UAT.md                                                                    │ │
│  └─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │ PHASE 2: Core Features                                                                                     │ │
│  │  (Same discuss → plan → execute → verify loop)                                                              │ │
│  └─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │ PHASE 3: Team Collaboration                                                                                │ │
│  │  (Same discuss → plan → execute → verify loop)                                                              │ │
│  └─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                                   │
└───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ /ez:audit-milestone                                                                                              │
│ ✓ All requirements covered                                                                                       │
│ ✓ Cross-phase integration verified                                                                               │
│ ✓ E2E flows working                                                                                              │
└───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ /ez:complete-milestone v1.0                                                                                      │
│ ├── Archive: milestones/v1.0-ROADMAP.md, milestones/v1.0-REQUIREMENTS.md                                         │
│ ├── Git tag: v1.0                                                                                                │
│ └── Collapse: ROADMAP.md (one-line summary)                                                                      │
└───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ /ez:new-milestone v1.1 "Advanced Features"                                                                       │
│ └── Back to phase loop for new features                                                                          │
└───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Brownfield Project (Existing Codebase)

```
┌──────────────┐
│ User Story   │ "I want to add a notification system to my existing e-commerce app"
└──────┬───────┘
       │
       ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: MAP CODEBASE                                                                                             │
├───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                                   │
│  /ez:map-codebase                                                                                                 │
│                                                                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │ Parallel Mapper Agents (spawn 4 agents simultaneously):                                                     │ │
│  │                                                                                                             │ │
│  │  Agent 1: Tech Focus          Agent 2: Architecture Focus                                                   │ │
│  │  ├── STACK.md                 ├── ARCHITECTURE.md                                                           │ │
│  │  └── INTEGRATIONS.md          └── STRUCTURE.md                                                              │ │
│  │                                                                                                             │ │
│  │  Agent 3: Quality Focus       Agent 4: Concerns Focus                                                       │ │
│  │  ├── CONVENTIONS.md           └── CONCERNS.md                                                               │ │
│  │  └── TESTING.md                                                                                             │ │
│  └─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                                   │
│  Output: .planning/codebase/ (7 structured documents)                                                            │
└───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ STEP 2: INITIALIZE PROJECT (uses codebase map)                                                                   │
├───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                                   │
│  /ez:new-project                                                                                                  │
│                                                                                                                   │
│  ├── Read: .planning/codebase/*.md (understand existing stack, patterns, concerns)                                │
│  ├── Questions: "What notification types?" → "Email, SMS, push"                                                   │
│  ├── Research: Notification service providers, delivery patterns                                                  │
│  ├── Requirements: v1.1 notification features                                                                     │
│  └── Roadmap: Phases for notification implementation                                                              │
│                                                                                                                   │
│  Output: PROJECT.md (updated), REQUIREMENTS.md, ROADMAP.md, STATE.md                                              │
└───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ STEP 3: PHASE LOOP (same as greenfield)                                                                          │
│                                                                                                                   │
│  For each phase: discuss → plan → execute → verify                                                                │
│                                                                                                                   │
│  Key difference: Planner reads codebase map to ensure plans match existing patterns                               │
└───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Quick Task (Ad-hoc)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         QUICK TASK WORKFLOW                                                        │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│ User Story   │ "Add a dark mode toggle to settings page"
└──────┬───────┘
       │
       ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ /ez:quick [--full] [--discuss]                                                                                   │
├───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                                   │
│  Standard Mode (default):                                                                                         │
│  ├── Planner: Create plan (skip research, skip plan-checker)                                                      │
│  ├── Executor: Implement with atomic commits                                                                      │
│  └── Output: .planning/quick/001-dark-mode-toggle/PLAN.md, SUMMARY.md                                             │
│                                                                                                                   │
│  With --full:                                                                                                     │
│  ├── Add plan-checker verification                                                                                │
│  └── Add verifier after execution                                                                                 │
│                                                                                                                   │
│  With --discuss:                                                                                                  │
│  ├── Gather context first (preferences, implementation details)                                                   │
│  └── Pass context to planner                                                                                      │
│                                                                                                                   │
└───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

Use cases:
- Bug fixes
- Small features
- Configuration changes
- One-off tasks
```

---

### Milestone with Audit Gaps

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         MILESTONE AUDIT WITH GAPS                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

All phases completed
       │
       ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ /ez:audit-milestone v1.0                                                                                         │
├───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                                   │
│  Audit Checks:                                                                                                    │
│  ├── ✓ Requirements coverage: 45/48 requirements met                                                              │
│  ├── ✓ Cross-phase integration: All phase boundaries verified                                                     │
│  └── ✗ E2E flows: 3 flows incomplete                                                                              │
│                                                                                                                   │
│  Gaps Identified:                                                                                                 │
│  ├── REQ-023: Password reset email not implemented                                                                │
│  ├── REQ-041: Search results pagination missing                                                                   │
│  └── FLOW-003: Checkout flow fails at payment step                                                                │
│                                                                                                                   │
│  Output: v1.0-MILESTONE-AUDIT.md (status: gaps_found)                                                             │
└───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ /ez:plan-milestone-gaps                                                                                          │
├───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                                   │
│  Creates fix phases:                                                                                              │
│  ├── Phase 8: Password reset implementation                                                                       │
│  ├── Phase 9: Search pagination                                                                                   │
│  └── Phase 10: Payment flow fix                                                                                   │
│                                                                                                                   │
│  Output: Updated ROADMAP.md with new phases                                                                       │
└───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Back to Phase Loop                                                                                               │
│                                                                                                                   │
│  /ez:discuss-phase 8 → /ez:plan-phase 8 → /ez:execute-phase 8 → /ez:verify-work 8                                 │
│  /ez:discuss-phase 9 → /ez:plan-phase 9 → /ez:execute-phase 9 → /ez:verify-work 9                                 │
│  /ez:discuss-phase 10 → /ez:plan-phase 10 → /ez:execute-phase 10 → /ez:verify-work 10                             │
│                                                                                                                   │
└───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Re-run Audit                                                                                                     │
│                                                                                                                   │
│  /ez:audit-milestone v1.0 → status: passed                                                                        │
│                                                                                                                   │
└───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Complete Milestone                                                                                               │
│                                                                                                                   │
│  /ez:complete-milestone v1.0                                                                                      │
│                                                                                                                   │
└───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Debug Session

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         DEBUG SESSION WORKFLOW                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

Issue discovered during verification
       │
       ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ /ez:debug "Login fails with 500 error"                                                                           │
├───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                                   │
│  Debug Agent spawns:                                                                                              │
│  ├── 1. Reproduce: Attempt login, capture error                                                                   │
│  ├── 2. Investigate: Check logs, trace request flow                                                               │
│  ├── 3. Identify: Find root cause (e.g., missing env var, DB connection)                                          │
│  └── 4. Document: Create DEBUG.md with findings                                                                   │
│                                                                                                                   │
│  Output: .planning/debug/001-login-500-error/DEBUG.md                                                             │
└───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Fix Plan Created                                                                                                 │
│                                                                                                                   │
│  ├── Plan: Fix login endpoint (add missing JWT_SECRET env var handling)                                           │
│  └── Ready for: /ez:execute-phase (with fix plan)                                                                 │
│                                                                                                                   │
└───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Related Documentation

- [USER-GUIDE.md](USER-GUIDE.md) — Command reference and configuration
- [README.md](../README.md) — Quick start and overview
- [PROVIDER-BEHAVIORS.md](PROVIDER-BEHAVIORS.md) — Provider differences
