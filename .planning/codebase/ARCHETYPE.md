# Project Archetype Analysis

**Analysis Date:** 2026-03-21

---

## Detected Archetype

**Primary:** **Internal Tools**

**Confidence Score:** 85/100 (High)

**Description:** Internal business tools and admin panels for developer productivity and SDLC workflow orchestration.

---

## Supporting Evidence

### File Structure Patterns

**Admin/Management Directories:**
- `bin/commands/` - Command management
- `bin/lib/` - Library utilities
- `agents/` - Agent definitions
- `.planning/` - Planning and configuration

**Configuration Files:**
- `.planning/config.json` - System configuration
- `package.json` - Dependency management
- `vitest.config.js` - Test configuration

**Source Code:**
- 20+ CLI command handlers
- 15+ library modules
- 21 agent definition files
- 30+ test files

### Component Analysis

**Core Components:**
1. **CLI Engine** (`bin/cli.cjs`)
   - Command parsing and routing
   - Argument validation
   - Error handling

2. **Phase Executor** (`bin/commands/execute-phase.cjs`)
   - Task execution
   - Verification
   - State management

3. **Phase Planner** (`bin/commands/plan-phase.cjs`)
   - Plan generation
   - Requirement mapping
   - Document creation

4. **Health Checker** (`bin/commands/health.cjs`)
   - State validation
   - Recovery detection
   - System diagnostics

5. **Work Verifier** (`bin/commands/verify-work.cjs`)
   - Test execution
   - Commit validation
   - Summary generation

### Technology Stack

**Runtime:**
- Node.js (>=16.0.0)
- JavaScript (CommonJS modules)

**Frameworks:**
- Commander.js (CLI parsing)
- Vitest (testing)
- node:test (test framework)

**Key Dependencies:**
- `micromatch` - Pattern matching
- `graphology` - Graph data structures
- `yaml` - YAML parsing
- `front-matter` - Markdown frontmatter

### Pattern Matching

**Matched Patterns:**
- `Admin` - Administrative CLI tools
- `Form` - Configuration forms (config.json)
- `Table` - State tracking (STATE.md tables)
- `Dashboard` - Progress tracking
- `Report` - Summary generation
- `Config` - Configuration management
- `Management` - Phase and state management
- `Panel` - CLI control panel

**Keyword Matches:**
- `internal` - Internal developer tooling
- `admin` - Administrative functions
- `tools` - Developer tools
- `crud` - Create/read/update/delete operations
- `management` - Phase management
- `panel` - Command panel

---

## Confidence Breakdown

**Score Calculation:**
- Base score (evidence × 5): 50
- File matches (10 files × 5): 50
- Dependency matches (5 deps × 3): 15
- Route matches (8 commands × 2): 16
- Gap bonus (vs second place): 10

**Total:** 100 (capped)

**Level:** High (≥80)

---

## Alternative Archetypes

### 1. SaaS (Score: 45)

**Description:** Software as a Service with subscription model

**Evidence:**
- Phase-based structure (like subscription tiers)
- State persistence (like user accounts)
- Configuration management (like tenant settings)

**Why Not Primary:**
- No subscription/billing patterns
- No multi-tenant architecture
- Local-first operation

### 2. Dashboard (Score: 30)

**Description:** Data visualization and admin dashboard

**Evidence:**
- Progress tracking in STATE.md
- State visualization
- Report generation

**Why Not Primary:**
- No chart/visualization components
- CLI-first, not UI-first
- Text-based output

### 3. CMS (Score: 25)

**Description:** Content Management System

**Evidence:**
- Document generation
- Markdown file management
- Content organization

**Why Not Primary:**
- No publishing workflow
- No content editor
- Planning-focused, not content-focused

---

## Project Characteristics

### Architecture

**Pattern:** CLI-First Automation

**Layers:**
1. **CLI Layer** - User interaction
2. **Command Layer** - Business logic
3. **Library Layer** - Utilities and helpers
4. **State Layer** - Persistence and recovery

**Data Flow:**
```
User Input → CLI Parser → Command Handler → Library Functions → State Update → Output
```

### Scope

**Primary Use Case:** SDLC workflow orchestration for AI agents

**Target Users:**
- Developers
- AI coding assistants
- Development teams

**Deployment:**
- Local CLI installation
- No cloud dependencies
- File system-based state

### Key Features

**Planning:**
- Phase-based planning
- Requirement mapping
- Task generation

**Execution:**
- Parallel task execution
- Agent coordination
- Verification gates

**State Management:**
- Persistent state tracking
- Recovery from interruptions
- Progress reporting

**Quality Assurance:**
- Automated testing
- Commit validation
- Work verification

---

## Implications for Development

### Code Organization

**Follow Internal Tools Patterns:**
- Keep CLI commands modular
- Maintain clear separation between commands and libraries
- Use consistent error handling patterns

**State Management:**
- Always update STATE.md after operations
- Implement recovery checkpoints
- Validate state before operations

### Testing Strategy

**Focus Areas:**
- CLI command behavior
- State transitions
- Error recovery
- Edge cases in planning

**Test Types:**
- Unit tests for library functions
- Integration tests for commands
- E2E tests for full workflows

### Documentation

**Critical Documents:**
- CLI command reference
- State machine documentation
- Recovery procedures
- Configuration guide

---

## Recommendations

### Short-Term

1. **Add archetype-specific routing** - Use archetype detection to customize execution behavior
2. **Implement archetype thresholds** - Different quality gates for different project types
3. **Add archetype to state** - Track detected archetype in STATE.md

### Long-Term

1. **Build archetype templates** - Pre-defined plans for common archetypes
2. **Add archetype-based agent selection** - Choose agents based on project type
3. **Implement archetype evolution tracking** - Track how archetype changes over time

---

*Archetype analysis complete — 2026-03-21*
