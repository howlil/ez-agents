<div align="center">

```
  _____ _____     _    ____ _____ _   _ _____ ____ 
 | ____|__  /    / \  / ___| ____| \ | |_   _/ ___|
 |  _|   / /    / _ \| |  _|  _| |  \| | | | \___ \
 | |___ / /_   / ___ \ |_| | |___| |\  | | |  ___) |
 |_____/____| /_/   \_\____|_____|_| \_| |_| |____/

        AI Agent Orchestration System
   Build software with coordinated AI agents
```

[![npm](https://img.shields.io/npm/v/@howlil/ez-agents?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/@howlil/ez-agents)
[![npm](https://img.shields.io/npm/dm/@howlil/ez-agents.svg?style=for-the-badge&logo=npm)](https://npmjs.com/package/@howlil/ez-agents)
[![CI Pipeline](https://github.com/howlil/ez-agents/actions/workflows/ci.yml/badge.svg)](https://github.com/howlil/ez-agents/actions/workflows/ci.yml)
[![CodeQL](https://github.com/howlil/ez-agents/actions/workflows/codeql.yml/badge.svg)](https://github.com/howlil/ez-agents/actions/workflows/codeql.yml)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)

**Documentation:** [API Reference](https://howlil.github.io/ez-agents/api/) · [Architecture](docs/ARCHITECTURE.md) · [Contributing](CONTRIBUTING.md) · [Changelog](CHANGELOG.md)

```bash
npm install -g @howlil/ez-agents@5.0.0
```

**Supported Runtimes:** Claude Code · OpenCode · Gemini CLI · Codex · Copilot · Qwen Code · Kimi Code

[Quick Start](#quick-start) · [Commands](#commands) · [Architecture](#architecture) · [Phase System](#phase-system) · [Configuration](#configuration)

</div>

---

## What is EZ Agents?

EZ Agents is a **multi-agent orchestration system** for building software with AI agents. It coordinates a team of 8 core agents through a structured 10-phase SDLC workflow — from project brief to production-ready code.

**Core Value:** Workflow-based orchestration takes your project requirements, decomposes them into a dependency-aware task graph, delegates work to specialist agents in parallel, enforces quality gates, and delivers implementation-ready output: code, tests, documentation, and release artifacts.

**Works for:** Greenfield projects · Existing codebases · Rapid MVPs · Enterprise-scale products

### Key Features

- **8 Specialist AI Agents** — Planner, Executor, Verifier, Debugger, Roadmapper, and research agents
- **40+ Pre-built Workflows** — From project initialization to production release
- **Wave-Based Parallel Execution** — Independent tasks run simultaneously with fresh context
- **Type-Safe Architecture** — Full TypeScript with strict mode and 100% type coverage
- **6 Design Patterns** — Factory, Strategy, Observer, Adapter, Decorator, and Facade patterns
- **229+ Skills** — Domain-specific knowledge for frameworks, testing, DevOps, and security
- **Smart Orchestration** — Automatic helper command invocation based on context
- **6 Runtime Guards** — Safety checks for autonomy, context budget, hallucinations, and more

---

## Quick Start

### 1. Install

```bash
npm install -g @howlil/ez-agents@5.0.0
```

### 2. Configure Your AI Runtime

```bash
# For Claude Code
ez-agents --claude --global

# For OpenCode
ez-agents --opencode --global

# For Gemini CLI
ez-agents --gemini --global

# For Qwen Code
ez-agents --qwen --global

# See all options
ez-agents --help
```

### 3. Initialize a Project

```bash
# In your project directory
/ez:new-project
```

Answer questions about what you're building. EZ Agents generates requirements and a roadmap.

### 4. Product Discovery (NEW - Product Thinking)

```bash
# Validate problem, define metrics, prioritize features
/ez:product-discovery

# Output:
# - User Personas & Journey Maps
# - Validated Problem Statement
# - North Star Metric + HEART Metrics
# - RICE-scored feature prioritization
# - MVP Plan with Build-Measure-Learn
```

### 5. Execute Phases

**Fast Path (Recommended):**

```bash
/ez:run-phase 1              # 35-55 min per phase
/ez:run-phase 1 --yolo       # Fully autonomous, no pauses
```

**Manual Control:**

```bash
/ez:discuss-phase 1          # Clarify approach (15 min)
/ez:plan-phase 1             # Create task breakdown (20 min)
/ez:execute-phase 1          # Build (one commit per task) (30 min)
/ez:verify-work 1            # Test it works (10 min)
```

### 6. Complete Milestone

```bash
/ez:audit-milestone          # Verify all requirements met (10 min)
/ez:complete-milestone 1.0.0 # Archive and tag release (5 min)
```

**Total time from idea to MVP: 2-3 days**

---

## Architecture

### TypeScript & OOP Architecture (v5.0.0)

This codebase has been fully migrated to TypeScript with object-oriented patterns:

- **98 TypeScript modules** in `bin/lib/`
- **6 design patterns** implemented throughout the codebase
- **100% type coverage** with strict mode enabled
- **Zero TypeScript errors** — build passes `tsc --noEmit`

### System Overview

The EZ Agents system operates through three main layers:

**1. Workflow Layer (40 workflows)**
- `plan-phase.md` — Creates executable task breakdowns
- `execute-phase.md` — Implements features with atomic commits
- `verify-work.md` — Runs quality gates and tests
- `new-project.md` — Initializes projects with requirements

**2. Core Agents (8 specialist agents)**
- `ez-planner` — Creates executable phase plans
- `ez-executor` — Implements features with git commits
- `ez-verifier` — Validates work against requirements
- `ez-debugger` — Diagnoses and fixes issues
- `ez-roadmapper` — Creates strategic roadmaps
- `ez-phase-researcher` — Technical research for phases
- `ez-project-researcher` — Project-level discovery
- `ez-codebase-mapper` — Maps existing codebases

**3. Research & Release Agents**
- Research agents handle technical discovery and best practices
- Release agents manage versioning, changelogs, and deployment

### Complete Workflow

The EZ Agents workflow follows a structured 10-phase SDLC:

**Phase 0: Initialization**
1. User provides project idea
2. `/ez:new-project` initializes the project
3. Requirements are generated
4. Roadmap with 6-10 phases is created

**Phase Loop (For Each Phase N)**

**Step 1: Discuss (Optional)**
- Command: `/ez:discuss-phase`
- Purpose: Clarify approach and constraints
- Duration: 15 minutes

**Step 2: Plan**
- Command: `/ez:plan-phase`
- Activities: Research, task breakdown, verification criteria
- Duration: 20 minutes
- Output: `PLAN.md` with dependency-aware tasks

**Step 3: Execute**
- Command: `/ez:execute-phase`
- Method: Wave-based parallel execution
- Each task gets fresh 200K context window
- One git commit per task
- Duration: 30 minutes

**Step 4: Verify**
- Command: `/ez:verify-work`
- Activities: Run tests, manual validation
- If tests fail: Auto-diagnose with `/ez:debugger` and retry
- Duration: 10 minutes

**Milestone Completion**
- `/ez:audit-milestone` — Verify all requirements met
- `/ez:complete-milestone` — Create git tag and archive

### Wave-Based Parallel Execution

Tasks are grouped into waves based on dependencies. This ensures:

- **Fresh context per task** — AI doesn't lose context due to window limits
- **Atomic commits** — Each task equals one commit, easy to revert
- **Parallel execution** — Independent tasks run together
- **Clean git history** — Descriptive messages, clear changes

**Example: Phase 1 Foundation**

**Wave 1 (Parallel — No Dependencies)**
- Task 1.1: Database Schema (fresh 200K context) → git commit
- Task 1.2: Next.js Setup (fresh 200K context) → git commit
- Task 1.3: Project Config (fresh 200K context) → git commit

**Wave 2 (Depends on Wave 1)**
- Task 1.4: Auth Endpoints
  - Dependencies: Task 1.1 (Database Schema) + Task 1.2 (Next.js Setup)
  - Fresh 200K context → git commit

**Wave 3 (Final Tasks)**
- Task 1.5: Integration Tests
  - Dependencies: Task 1.4 (Auth Endpoints)
  - Fresh 200K context → git commit

### 8 Core Agents

| Agent | Purpose | Tools |
|-------|---------|-------|
| **ez-planner** | Creates executable phase plans with task breakdown, dependency analysis | Read, Write, Bash, Glob, Grep, WebFetch |
| **ez-executor** | Executes plans with atomic commits, deviation handling, checkpoint management | Read, Write, Edit, Bash, Grep, Glob |
| **ez-verifier** | Goal-backward verification, checks codebase delivers phase promises | Read, Write, Bash, Glob, Grep |
| **ez-phase-researcher** | Phase-level technical research, stack discovery, best practices | Read, Write, WebSearch, WebFetch, Context7 |
| **ez-project-researcher** | Project-level research, requirements analysis, user discovery | Read, Write, WebSearch, WebFetch |
| **ez-codebase-mapper** | Explores codebase structure, writes analysis documents | Read, Glob, Grep, Bash |
| **ez-debugger** | Scientific bug investigation, hypothesis-driven debugging | Read, Write, Bash, Grep |
| **ez-roadmapper** | Roadmap creation, requirement-to-phase mapping, success criteria | Read, Write |

**Note:** EZ Agents uses **workflow-centric orchestration** — intelligence is in `ez-agents/workflows/*.md` (40 workflow files), not in agent routing logic. Workflows directly spawn agents based on execution context.

---

## Commands

### Product Discovery (NEW)

| Command | Description | Time |
|---------|-------------|------|
| `/ez:product-discovery` | **NEW** — Validate problem, define metrics, prioritize features (RICE), create MVP plan | 30-60 min |

### Core Workflow

| Command | Description | Time |
|---------|-------------|------|
| `/ez:new-project` | Initialize project: answer questions, **product discovery**, generate requirements and roadmap | 10 min |
| `/ez:run-phase [N]` | **Recommended:** Run all phases iteratively with pause points. Use `--yolo` for fully autonomous | 35-55 min/phase |
| `/ez:quick` | Small task without full phase workflow (bug fixes, config changes) | 5-10 min |

### Phase Workflow (Manual Control)

| Command | Description | Time |
|---------|-------------|------|
| `/ez:discuss-phase [N]` | Optional — Clarify implementation approach before planning | 15 min |
| `/ez:plan-phase [N]` | Create task breakdown with verification criteria | 20 min |
| `/ez:execute-phase [N]` | Build the plan (parallel waves, one commit per task) | 30 min |
| `/ez:verify-work [N]` | Manual testing with auto-diagnosis of failures | 10 min |

### Milestone Management

| Command | Description | Time |
|---------|-------------|------|
| `/ez:audit-milestone` | Verify all requirements are met | 10 min |
| `/ez:complete-milestone <version>` | Archive milestone, create git tag | 5 min |
| `/ez:new-milestone` | Start next version cycle | 5 min |

### Utilities

| Command | Description |
|---------|-------------|
| `/ez:map-codebase` | Analyze existing codebase (before `/ez:new-project`) |
| `/ez:progress` | See where you are and what's next |
| `/ez:resume-work` | Restore context from last session |
| `/ez:settings` | Configure workflow, model profile, git strategy |
| `/ez:update` | Update EZ Agents (with changelog preview) |
| `/ez:help` | Show all commands |

---

## Phase System

### Phase Numbering

- **Integer phases:** `01`, `02`, `03` — Planned milestone work
- **Decimal phases:** `02.1`, `02.2` — Urgent insertions (marked `INSERTED`)
- **Letter suffixes:** `12A`, `12B` — Variant phases

### Phase Directory Structure

```
.planning/
├── config.json              # Project configuration
├── STATE.md                 # Current state, decisions, blockers
├── ROADMAP.md               # Phase breakdown with status
├── REQUIREMENTS.md          # Scoped requirements with IDs
├── PROJECT.md               # What you're building and why
└── phases/
    ├── 01-foundation/
    │   ├── 01-01-PLAN.md
    │   ├── 01-01-SUMMARY.md
    │   ├── 01-02-PLAN.md
    │   ├── 01-02-SUMMARY.md
    │   ├── 01-CONTEXT.md
    │   └── 01-RESEARCH.md
    ├── 02-api/
    │   └── ...
    └── 02.1-hotfix/
        └── ...
```

### Context Files

| File | Purpose | Max Lines |
|------|---------|-----------|
| `STATE.md` | Single source of truth: current phase, decisions, blockers, metrics | 200 |
| `ROADMAP.md` | Phase structure, requirements mapping, progress tracking | 300 |
| `REQUIREMENTS.md` | What to build (MoSCoW prioritized) | 500 |
| `SUMMARY.md` | What was built (per plan) | 50 |
| `PROJECT.md` | Project overview and context | 300 |

**Deprecated (no longer required):**
- `CONTEXT.md` → Merge decisions into `STATE.md`
- `RESEARCH.md` → Inline research in `PLAN.md`
- `VERIFICATION.md` → Inline in `SUMMARY.md`
- `UAT.md` → Merge into `SUMMARY.md`
- `DISCUSSION.md` → Removed entirely

### Summary Frontmatter (Machine-Readable)

Each `SUMMARY.md` includes structured frontmatter for dependency tracking:

```yaml
---
phase: 01-foundation
plan: 01
subsystem: auth
tags: [jwt, jose, bcrypt]
requires:
  - phase: previous
    provides: what-they-built
provides:
  - what-this-built
affects: [future-phase]
tech-stack:
  added: [jose, bcrypt]
  patterns: [httpOnly cookies]
key-files:
  created: [src/lib/auth.ts]
  modified: [prisma/schema.prisma]
key-decisions:
  - "Used jose instead of jsonwebtoken for Edge compatibility"
requirements-completed: [AUTH-01, AUTH-02]
duration: 28min
completed: 2025-01-15
---
```

---

## Configuration

### Project Config: `.planning/config.json`

```json
{
  "model_profile": "balanced",
  "commit_docs": true,
  "search_gitignored": false,
  "branching_strategy": "none",
  "phase_branch_template": "ez/phase-{phase}-{slug}",
  "milestone_branch_template": "ez/{milestone}-{slug}",
  "workflow": {
    "research": true,
    "plan_check": true,
    "verifier": true,
    "nyquist_validation": true
  },
  "parallelization": true,
  "brave_search": false,
  "recovery": {
    "enabled": true,
    "auto_backup": true
  },
  "infrastructure": {
    "enabled": false
  }
}
```

### Model Profiles

Model profiles control which AI model tier each agent uses:

| Agent | `quality` | `balanced` | `budget` |
|-------|-----------|------------|----------|
| ez-planner | Opus | Opus | Sonnet |
| ez-executor | Opus | Sonnet | Sonnet |
| ez-phase-researcher | Opus | Sonnet | Haiku |
| ez-codebase-mapper | Sonnet | Haiku | Haiku |
| ez-verifier | Sonnet | Sonnet | Haiku |
| ez-debugger | Opus | Sonnet | Sonnet |

**When to use each:**
- **quality** — Critical work, complex decisions, you have quota
- **balanced** — Day-to-day development (the default for a reason)
- **budget** — High-volume work, familiar domains, prototyping

### Multi-Provider Setup

Different providers for different tasks:

```json
{
  "provider": {
    "default": "alibaba",
    "anthropic": {
      "api_key": "env:ANTHROPIC_API_KEY"
    },
    "alibaba": {
      "api_key": "env:DASHSCOPE_API_KEY"
    }
  },
  "agent_overrides": {
    "ez-planner": { "provider": "alibaba", "model": "qwen-max" },
    "ez-executor": { "provider": "anthropic", "model": "sonnet" }
  }
}
```

---

## Skills System

EZ Agents includes **229+ skills** organized by domain:

### Stack Skills

- **Frontend:** React, Vue, Svelte, Angular, Next.js, Nuxt, Remix, Astro, Qwik, SolidJS
- **Backend:** Node.js, Express, NestJS, FastAPI, Django, Laravel, Spring Boot, Go, .NET
- **Mobile:** React Native, Flutter, Ionic
- **Database:** PostgreSQL, MongoDB, Redis
- **Other:** GraphQL, Tauri, Bun/Hono, AI/LLM Integration

### Domain Skills

- **Testing:** Unit, Integration, E2E, Security, Performance, Contract
- **DevOps:** CI/CD, Containerization, Cloud Deployment, Monitoring
- **Architecture:** System Design, Microservices, Event-Driven, Serverless
- **Security:** OWASP, Authentication, Authorization, Encryption
- **Observability:** Logging, Metrics, Tracing, Alerting
- **Operational:** Bug Triage, Code Review, Migration, Incident Response, Tech Debt

### Skill Structure

```
skills/stack/nextjs/
├── VERSIONS.md
└── nextjs_app_router_skill_v1/
    └── SKILL.md  (~130 lines - lightweight index)
```

Skills are resolved automatically based on stack detection during project initialization.

---

## Smart Orchestration

Core commands automatically invoke helper commands based on context. All auto-invocations are visible with an `[auto]` prefix.

| Command | Auto Pre | Auto Post | Conditional |
|---------|----------|-----------|-------------|
| `/ez:execute-phase` | health check | verify-work | discuss-phase (medium/enterprise, no CONTEXT.md) · add-todo (scope creep) |
| `/ez:plan-phase` | — | — | discuss-phase (phase touches auth/DB/payment/security area) |
| `/ez:release medium` | — | — | verify-work |
| `/ez:release enterprise` | — | — | verify-work → audit-milestone → arch-review |
| `/ez:progress` | health check (silent) | — | — |

**Override flags:**

| Flag | Effect |
|------|--------|
| `--no-auto` | Disable all auto-invocations for that run |
| `--verbose` | Show detail for every auto-invocation step |
| `--skip-discussion` | Skip only the auto discuss-phase trigger |

Disable globally: set `"smart_orchestration": { "enabled": false }` in `.planning/config.json`.

---

## Guards & Safety

EZ Agents includes 6 runtime guards for safety and quality:

| Guard | Purpose |
|-------|---------|
| **Autonomy Guard** | Prevents unauthorized autonomous actions |
| **Context Budget Guard** | Monitors token usage (50%/70%/80% thresholds) |
| **Hallucination Guard** | Detects AI hallucinations and fabrications |
| **Hidden State Guard** | Prevents hidden state and context loss |
| **Team Overhead Guard** | Prevents team coordination overhead |
| **Tool Sprawl Guard** | Prevents tool proliferation |

### Context Budget Thresholds

```javascript
const THRESHOLDS = {
  INFO: 50,      // Quality degradation begins
  WARNING: 70,   // Efficiency mode engaged
  ERROR: 80      // Hard stop
};
```

---

## Project Structure

### Codebase Layout

```
ez-agents/
├── bin/                          # CLI entry points
│   ├── install.ts                # Main installer (multi-runtime)
│   ├── update.ts                 # Update command
│   ├── lib/                      # 98 core library modules (.ts)
│   │   ├── core.ts               # Shared utilities, model profiles
│   │   ├── config.ts             # Config CRUD
│   │   ├── phase.ts              # Phase operations
│   │   ├── state.ts              # STATE.md operations
│   │   ├── roadmap.ts            # ROADMAP.md parsing
│   │   ├── model-provider.ts     # Multi-model API
│   │   ├── safe-exec.ts          # Command injection prevention
│   │   ├── context-manager.ts    # Context assembly
│   │   └── ...
│   └── guards/                   # 6 runtime guards
├── commands/                     # Command handlers
│   └── ez/                       # 17 agent command templates (.md)
├── ez-agents/                    # Packaged runtime
│   ├── bin/
│   │   ├── ez-tools.ts           # CLI router (160+ atomic commands)
│   │   ├── lib/                  # 81 library modules
│   │   └── guards/               # 6 guards
│   ├── templates/                # 34 templates
│   ├── workflows/                # 40 workflow definitions
│   └── references/               # Reference documentation
├── agents/                       # 10 agent definitions (.md)
├── skills/                       # 229 skill definitions
│   ├── stack/                    # Tech stack skills
│   ├── testing/                  # Testing skills
│   ├── operational/              # Operational skills
│   └── observability/            # Observability skills
├── hooks/                        # Git hooks (Husky)
├── tests/                        # Test suite (307 tests)
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   ├── e2e/                      # End-to-end tests
│   └── critical-paths/           # Critical path tests
├── docs/                         # Documentation
├── .github/                      # GitHub Actions workflows
└── .planning/                    # Project planning artifacts
```

### Key Directories

- **`bin/`** — TypeScript source code for CLI and core library
- **`ez-agents/`** — Packaged runtime installed to AI config directories
- **`agents/`** — Agent definitions with tool permissions and color coding
- **`skills/`** — Domain-specific knowledge and best practices
- **`tests/`** — Comprehensive test suite (67% passing, target 100%)
- **`docs/`** — Architecture, deployment, and troubleshooting guides

---

## Testing

### Test Structure

- **307 total tests** across the codebase
- **206 passing (67%)** — Target: 100%
- **101 failing** — Being addressed in ongoing development

### Test Categories

| Category | Count | Purpose |
|----------|-------|---------|
| **Unit Tests** | 150+ | Individual module testing |
| **Integration Tests** | 50+ | Multi-module coordination |
| **E2E Tests** | 30+ | Full workflow validation |
| **Critical Paths** | 40+ | Core functionality guarantees |
| **Property-Based** | 20+ | Invariant validation |
| **Performance** | 10+ | Benchmark and regression |
| **Specialized** | 7+ | State, context, analytics, finops, security |

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific category
npm test -- tests/unit/
npm test -- tests/integration/
npm test -- tests/e2e/
```

---

## Contributing

### Development Setup

```bash
# Clone repository
git clone https://github.com/howlil/ez-agents.git
cd ez-agents

# Install dependencies
npm install

# Build project
npm run build

# Run tests
npm test

# Link for local development
npm link
```

### Code Quality

```bash
# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix

# Format code
npm run format
```

### Pull Request Process

1. Create feature branch from `main`
2. Make changes with tests
3. Ensure all checks pass (CI, tests, linting)
4. Submit PR with clear description
5. Address review feedback
6. Merge after approval

### Documentation

- **API Reference:** Auto-generated with TypeDoc
- **Architecture:** Detailed system design in `docs/`
- **Contributing:** Guidelines in `CONTRIBUTING.md`
- **Changelog:** Follows [Keep a Changelog](https://keepachangelog.com/)

---

## Changelog

### [5.0.0] - 2026-03-28

**Major Release: Complete TypeScript & OOP Transformation**

**Highlights:**
- ✅ TypeScript migration complete (98 modules)
- ✅ OOP architecture with 6 design patterns
- ✅ Zero TypeScript errors (586 → 0)
- ✅ 100% type coverage achieved
- ✅ Product discovery workflow added
- ✅ 10x engineer metrics tracking
- ✅ 229+ skills system

**New Features:**
- Product Discovery workflow with user personas, metrics, and RICE scoring
- Template validation module for output consistency
- Skill system reference documentation
- Workflow metrics tracking system
- Workflow versioning with migrations
- Standardized argument parsing (TypeScript)
- 5 new workflows (refactor, security, rollback, dependency-audit, accessibility-audit)
- Reference indices for templates, workflows, and agents

**System Health:** 7.1/10 → 8.0/10 (+13%)

See [CHANGELOG.md](CHANGELOG.md) for complete history.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Support

- **Documentation:** [API Reference](https://howlil.github.io/ez-agents/api/)
- **Issues:** [GitHub Issues](https://github.com/howlil/ez-agents/issues)
- **Discussions:** [GitHub Discussions](https://github.com/howlil/ez-agents/discussions)
- **Email:** Support available via GitHub

---

<div align="center">

**Built with ❤️ by the EZ Agents Team**

[Top](#ez-agents)

</div>
