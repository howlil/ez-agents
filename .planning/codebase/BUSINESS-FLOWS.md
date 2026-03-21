# Business Flow Analysis

**Analysis Date:** 2026-03-21

## Overview

This document provides business flow mapping and project archetype detection for the ez-agents codebase. Analysis performed using the `BusinessFlowMapper` and `ArchetypeDetector` classes.

---

## User Journey Maps

### Primary Journeys

**1. CLI Command Execution**
- **Entry Point:** `bin/cli.cjs`
- **Path:** `/execute-phase`, `/plan-phase`, `/health`, `/verify-work`
- **Components:** CLI parser, command handlers, phase executor
- **Flow:** User input → Command parsing → Phase execution → Output

**2. Phase Planning**
- **Entry Point:** `bin/commands/plan-phase.cjs`
- **Path:** `/plan-phase`
- **Components:** Phase planner, requirement mapper, task generator
- **Flow:** Phase number → Research → Plan creation → Document generation

**3. Phase Execution**
- **Entry Point:** `bin/commands/execute-phase.cjs`
- **Path:** `/execute-phase`
- **Components:** Phase executor, task runner, verification
- **Flow:** Plan loaded → Tasks executed → Verification → Commit

**4. Health Check**
- **Entry Point:** `bin/commands/health.cjs`
- **Path:** `/health`
- **Components:** Health checker, state validator, recovery
- **Flow:** Health check → State validation → Report generation

**5. Work Verification**
- **Entry Point:** `bin/commands/verify-work.cjs`
- **Path:** `/verify-work`
- **Components:** Verification engine, test runner, commit validator
- **Flow:** Verification → Test execution → Summary generation

---

## Data Flow Analysis

### Entry Points

1. **`bin/cli.cjs`** - Main CLI entry point
   - Parses command-line arguments
   - Routes to appropriate command handler
   - Handles errors and exit codes

2. **`bin/commands/*.cjs`** - Command handlers
   - Individual command implementations
   - Each exports a function for CLI routing

### Data Transformations

**Input Processing:**
- Command-line arguments parsed by `commander`
- Phase numbers extracted and validated
- Options merged with defaults from `config.json`

**State Management:**
- State read from `.planning/STATE.md` (YAML frontmatter)
- State written after each operation
- Recovery state tracked in `.planning/recovery/`

**Output Generation:**
- Markdown documents generated for plans, summaries, reports
- JSON data for configuration and state
- Log files in `.planning/logs/`

### Data Stores

**Primary:**
- `.planning/STATE.md` - Current session state
- `.planning/config.json` - Configuration settings
- `.planning/phases/*/` - Phase plans and research
- `.planning/codebase/` - Codebase analysis documents

**Secondary:**
- `.planning/sessions/` - Session history
- `.planning/logs/` - Execution logs
- `.planning/locks/` - Operation locks

---

## Integration Points

### External Services

**Git Operations:**
- **Service:** Git CLI
- **Purpose:** Version control, commits, branch management
- **Integration:** Direct shell commands via `child_process`

**Package Management:**
- **Service:** npm/yarn/pnpm
- **Purpose:** Dependency installation, script execution
- **Integration:** `PackageManagerDetector` + shell commands

**Testing:**
- **Service:** Vitest/node:test
- **Purpose:** Test execution and verification
- **Integration:** Shell commands with test patterns

### Infrastructure

**Logging:**
- **Provider:** Custom logger (`bin/lib/logger.cjs`)
- **Storage:** `.planning/logs/ez-{timestamp}.log`
- **Format:** JSON lines

**State Persistence:**
- **Provider:** File system
- **Format:** YAML frontmatter + Markdown
- **Location:** `.planning/STATE.md`

**Configuration:**
- **Provider:** JSON file
- **Format:** JSON
- **Location:** `.planning/config.json`

---

## Project Archetype

**Detected Archetype:** Internal Tools / Developer Tooling

**Confidence:** High (85/100)

**Evidence:**
- CLI command structure (`bin/commands/`)
- Phase planning system (`.planning/phases/`)
- Configuration management (`.planning/config.json`)
- State tracking (`.planning/STATE.md`)
- Test scaffolding (`tests/`)
- Documentation generation (`.planning/codebase/`)

**Characteristics:**
- **Type:** Developer productivity tooling
- **Pattern:** CLI-first automation
- **Scope:** SDLC workflow orchestration
- **Users:** Developers, AI agents

**Alternative Archetypes:**
1. **SaaS** (score: 45) - Subscription-like phase structure
2. **Dashboard** (score: 30) - State tracking and reporting
3. **CMS** (score: 25) - Document generation focus

---

## Key Observations

### Flow Patterns

**Sequential Execution:**
- Commands execute in defined order
- State transitions tracked explicitly
- Recovery points at each phase boundary

**Parallel Detection:**
- Multiple agents can run in parallel
- Lock mechanism prevents conflicts
- State synchronization via file system

**Verification-First:**
- Every operation has verification
- Tests run before commits
- Health checks validate state

### Integration Density

**High Integration:**
- Git operations (commits, branches)
- Package managers (npm, yarn, pnpm)
- Test runners (Vitest, node:test)
- File system (planning documents)

**Low External Dependencies:**
- Minimal third-party SDKs
- No cloud services required
- Self-contained operation

---

## Recommendations

### Flow Optimization

1. **Add journey tracking** - Log user command sequences for pattern analysis
2. **Implement retry logic** - Automatic recovery for failed operations
3. **Add progress indicators** - Real-time feedback during long operations

### Integration Enhancements

1. **Add CI/CD integration** - GitHub Actions, GitLab CI support
2. **Implement webhook support** - External event triggering
3. **Add metrics export** - Prometheus/OpenTelemetry integration

---

*Business flow analysis complete — 2026-03-21*
