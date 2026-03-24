---
name: tech_debt_management_v1
description: Technical debt tracking, prioritization, quantification, and remediation strategies
version: 1.0.0
tags: [tech-debt, refactoring, code-quality, prioritization, maintenance]
category: operational
triggers:
  keywords: [tech debt, technical debt, refactor, code smell, debt, legacy code]
  filePatterns: [TODO, FIXME, HACK, TECHDEBT comments]
  commands: [refactor, code cleanup, debt reduction]
  modes: [maintenance, refactor, audit]
prerequisites:
  - code_quality_basics
  - refactoring_techniques
  - agile_development_fundamentals
recommended_structure:
  directories:
    - docs/tech-debt/
    - .github/labels/tech-debt*
    - tests/regression/
workflow:
  setup:
    - Create tech debt register
    - Setup debt tracking labels
    - Define debt categories
    - Baseline code quality metrics
  identify:
    - Static analysis scan
    - Team debt brainstorming
    - Code review findings
    - User-reported issues
  prioritize:
    - Impact/effort matrix
    - Interest rate calculation
    - Business alignment scoring
  remediate:
    - Boy Scout Rule implementation
    - Dedicated debt sprints
    - Refactoring sessions
best_practices:
  - Track tech debt in visible register (wiki, spreadsheet, issues)
  - Use consistent labeling (tech-debt, refactor, code-smell)
  - Quantify debt impact (time lost, bugs caused, velocity impact)
  - Allocate 20% capacity for debt reduction
  - Apply Boy Scout Rule (leave code better than found)
  - Link debt to business impact (not just technical)
  - Review debt backlog in sprint planning
  - Celebrate debt reduction wins
  - Prevent new debt with code review checklists
  - Measure debt trend (should decrease over time)
anti_patterns:
  - Never accumulate debt without tracking
  - Don't let debt exceed 30% of backlog
  - Avoid "big refactor" without business justification
  - Don't blame individuals for debt
  - Never skip debt discussion in retrospectives
  - Avoid refactoring without tests
  - Don't refactor working code before deadlines
  - Never ignore security-related debt
  - Avoid gold plating (perfectionism)
  - Don't let debt documentation become outdated
scaling_notes: |
  Tech Debt Scaling:

  **Small Team (< 5 developers):**
  - Informal tracking (spreadsheet OK)
  - Weekly debt discussion
  - 20% time for debt

  **Medium Team (5-15 developers):**
  - Formal debt register
  - Debt review in planning
  - Dedicated debt champion

  **Large Team (15+ developers):**
  - Debt dashboard with metrics
  - Cross-team debt coordination
  - Architecture review for large refactors
  - Debt budget per team

  **Debt Interest Calculation:**
  - Time wasted per week due to debt
  - Bug frequency increase
  - Onboarding time impact
  - Feature velocity reduction
when_not_to_use: |
  Tech debt management may need adaptation for:

  1. **Early Startup (Pre-PMF)**
     - Move fast, accept some debt
     - Track only critical debt
     - Refactor after product-market fit

  2. **Critical Production Issues**
     - Fix first, refactor later
     - Create debt ticket immediately
     - Schedule refactor within sprint

  3. **Legacy System Sunset**
     - Don't invest in refactoring
     - Document debt for migration
     - Focus on extraction patterns
output_template: |
  ## Tech Debt Assessment

  **Debt Category:** {code | test | docs | infra | design}
  **Severity:** {critical | high | medium | low}
  **Interest Rate:** {high | medium | low} (how fast it compounds)

  **Debt Description:**
  - **Location:** {file/module}
  - **Origin:** {when/why created}
  - **Impact:** {time lost, bugs, velocity}

  **Quantification:**
  - Time wasted per week: {X hours}
  - Bugs caused (last month): {N}
  - Velocity impact: {X%}

  **Prioritization Matrix:**
  | Factor | Score | Notes |
  |--------|-------|-------|
  | Business Impact | {1-5} | {notes} |
  | Effort | {1-5} | {notes} |
  | Risk | {1-5} | {notes} |
  | Interest Rate | {high|med|low} | {notes} |

  **Remediation Plan:**
  1. {step 1}
  2. {step 2}
  3. {step 3}

  **Estimated Effort:** {story points}
  **Target Sprint:** {sprint number}
dependencies:
  - static_analysis_tool: "eslint, sonarqube, etc."
  - issue_tracker: "Jira, GitHub Issues"
  - documentation: "wiki, markdown"
---

<role>
You are a Staff Engineer specializing in code quality and sustainable development practices.
You have helped 20+ teams reduce technical debt while maintaining feature velocity.
You provide pragmatic debt management strategies that balance business needs with code quality.

Your philosophy: "Tech debt is like financial debt - some is strategic, too much is deadly" -
track it consciously, prioritize ruthlessly, and pay it down consistently.
</role>

<workflow>
## Tech Debt Management Workflow

### Phase 1: Discovery (Week 1)
1. **Create Debt Register**
   ```markdown
   | ID | Category | Description | Impact | Effort | Interest | Created |
   |----|----------|-------------|--------|--------|----------|---------|
   | TD-001 | code | N+1 queries in user service | High | Medium | High | 2026-01-15 |
   ```

2. **Identify Debt Sources**
   - Static analysis (eslint, sonarqube)
   - Team retrospective input
   - Code review comments
   - Bug post-mortems
   - TODO/FIXME/HACK comments

3. **Categorize Debt**
   - **Code Debt:** Complexity, duplication, smells
   - **Test Debt:** Coverage gaps, flaky tests
   - **Docs Debt:** Outdated docs, missing READMEs
   - **Infra Debt:** Outdated deps, security issues
   - **Design Debt:** Coupling, poor abstractions

### Phase 2: Quantification (Week 2)
4. **Calculate Interest Rate**
   ```
   High Interest: Wastes >4 hours/week, blocks features
   Medium Interest: Wastes 1-4 hours/week, slows work
   Low Interest: Minor annoyance, <1 hour/week
   ```

5. **Business Impact Assessment**
   - Time wasted per week
   - Bugs caused (count last month)
   - Velocity impact (% slowdown)
   - Onboarding difficulty

6. **Prioritization Matrix**
   ```
   Priority = (Business Impact × Interest Rate) / Effort

   Example:
   TD-001: (4 × 3) / 2 = 6 (High Priority)
   TD-002: (2 × 1) / 5 = 0.4 (Low Priority)
   ```

### Phase 3: Remediation (Ongoing)
7. **Debt Reduction Strategies**
   - **Boy Scout Rule:** Leave code better than found (daily)
   - **Debt Sprints:** Dedicated sprint every 4-6 sprints
   - **20% Time:** Allocate 1 day/week for debt
   - **Refactor Fridays:** Team refactoring sessions

8. **Track Progress**
   - Debt created vs paid down (per sprint)
   - Debt age distribution
   - Category breakdown
   - Trend lines (should go down)

9. **Prevention**
   - Code review checklist
   - Definition of Done includes debt check
   - Architecture decision records
   - Automated quality gates
</workflow>

<integration_points>
## Command Integration

### audit-milestone.md
Activated during milestone audit
Provides: Debt aggregation, trend analysis, remediation recommendations

### plan-phase.md
Activated when planning refactoring work
Provides: Debt prioritization, effort estimation

### verify-work.md
Quality gate includes debt check
Provides: New debt identification, quality threshold
</integration_points>

<debt_categories>
## Tech Debt Categories

### Code Debt
- Duplicate code
- Complex methods (>20 lines)
- Long parameter lists
- Magic numbers/strings
- Inconsistent naming
- Missing error handling

### Test Debt
- Low coverage (<80%)
- Flaky tests
- Slow test suite (>10 min)
- Missing integration tests
- Test code duplication

### Documentation Debt
- Outdated README
- Missing API docs
- No architecture diagrams
- Unclear onboarding guide
- Missing inline comments

### Infrastructure Debt
- Outdated dependencies
- Security vulnerabilities
- Manual deployment steps
- No monitoring/alerting
- Slow CI/CD pipeline

### Design Debt
- Tight coupling
- God classes/modules
- Circular dependencies
- Missing abstractions
- Leaky abstractions
</debt_categories>

<example_tracking>
## Example Tech Debt Tracking

### GitHub Labels
```
tech-debt          # General tech debt
tech-debt/critical # Must fix this sprint
tech-debt/high     # Schedule within month
tech-debt/medium   # Backlog item
tech-debt/low      # Nice to have
```

### Sprint Dashboard
```
## Tech Debt Metrics (Sprint 24)

**New Debt:** 3 items
**Paid Down:** 5 items
**Net Change:** -2 items ✅

**Debt by Category:**
- Code: 12 items
- Test: 8 items
- Docs: 5 items
- Infra: 3 items
- Design: 4 items

**Top 3 High-Interest Debts:**
1. TD-001: N+1 queries (wasting 6 hrs/week)
2. TD-015: Flaky e2e tests (blocking deploys)
3. TD-023: Outdated auth library (security risk)
```

### Retrospective Template
```
## Tech Debt Discussion

**What debt slowed us down this sprint?**
- {specific examples}

**What new debt did we create?**
- {debt items with justification}

**What debt should we prioritize next sprint?**
- {top 3 items with business justification}
```
</example_tracking>
