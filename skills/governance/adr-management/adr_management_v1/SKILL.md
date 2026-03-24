---
name: architecture_decision_records_v1
description: Architecture Decision Record (ADR) creation, management, documentation standards, and compliance tracking
version: 1.0.0
tags: [adr, architecture, documentation, decision-making, governance, technical-leadership]
category: governance
triggers:
  keywords: [adr, architecture decision, decision record, design decision, technical decision]
  filePatterns: [docs/adr/*.md, ADR-*.md, decisions/*.md]
  commands: [adr new, architecture review, design decision]
  modes: [planning, architecture-review, greenfield]
prerequisites:
  - software_architecture_basics
  - technical_writing_skills
  - team_collaboration_fundamentals
recommended_structure:
  directories:
    - docs/adr/
    - docs/adr/0001-0099/
    - docs/decisions/
workflow:
  setup:
    - Create docs/adr/ directory
    - Setup ADR template
    - Define ADR numbering convention
    - Train team on ADR process
  create:
    - Identify decision needed
    - Write ADR draft
    - Team review & discussion
    - Accept/Reject decision
  maintain:
    - Link ADR to code changes
    - Track compliance
    - Review periodically
    - Supersede when outdated
best_practices:
  - Write ADRs before implementation (not after)
  - Keep ADRs concise (1-2 pages max)
  - Use imperative mood for titles ("Use PostgreSQL" not "Using PostgreSQL")
  - Document context thoroughly (why, not just what)
  - List alternatives considered with trade-offs
  - Include compliance instructions (how to verify)
  - Link ADRs to related code changes
  - Review ADRs quarterly (are they still valid?)
  - Supersede don't delete (preserve history)
  - Make ADRs searchable and accessible
anti_patterns:
  - Never write ADRs for obvious decisions (team consensus OK)
  - Don't use ADRs to avoid discussion (write after, not instead)
  - Avoid overly formal process (keep it lightweight)
  - Don't let ADRs become outdated (review regularly)
  - Never ignore ADRs in code review (check compliance)
  - Avoid decision by committee (one owner, team input)
  - Don't document every tiny decision (focus on significant)
  - Never use ADRs as blame tools (decisions made with best info)
  - Don't skip context (future readers need background)
  - Avoid technical jargon without explanation
scaling_notes: |
  ADR Scaling by Team Size:

  **Small Team (< 5 developers):**
  - Informal ADRs (markdown files)
  - Team discussion in Slack/Chat
  - Simple numbering (0001, 0002, ...)

  **Medium Team (5-15 developers):**
  - Formal ADR process
  - Architecture review board
  - ADR templates with required sections
  - Compliance checking in PRs

  **Large Team (15+ developers):**
  - ADR ownership per domain
  - Cross-team ADR coordination
  - ADR dashboard/search
  - Automated compliance checks
  - Regular ADR review cycles

  **Multi-Team/Org:**
  - Hierarchical ADRs (org, team, domain)
  - ADR ambassadors per team
  - Quarterly ADR summits
  - ADR impact analysis for changes
when_not_to_use: |
  ADRs may not be appropriate for:

  1. **Obvious Decisions**
     - Team has consensus
     - Reversible with low cost
     - Use RFC or simple proposal instead

  2. **Urgent Production Issues**
     - Fix first, document later
     - Create ADR post-incident
     - Link to incident report

  3. **Experimental Features**
     - Decision may change quickly
     - Use experiment log instead
     - Create ADR after validation

  4. **Personal Preference**
     - Code style, formatting
     - Use team standards doc
     - Don't create ADR for every convention
output_template: |
  # ADR-{NNN}: {Title}

  **Status:** {proposed | accepted | deprecated | superseded}
  **Date:** {YYYY-MM-DD}
  **Owner:** {person/team}
  **Reviewers:** {list}

  ## Context
  {Problem statement, background, constraints}

  ## Decision
  {Chosen solution with clear rationale}

  ## Alternatives Considered
  | Option | Pros | Cons | Why Not Chosen |
  |--------|------|------|----------------|
  | {A} | {pros} | {cons} | {reason} |
  | {B} | {pros} | {cons} | {reason} |

  ## Consequences
  **Positive:**
  - {benefit 1}
  - {benefit 2}

  **Negative:**
  - {trade-off 1}
  - {trade-off 2}

  **Neutral:**
  - {side effect 1}

  ## Compliance
  {How to verify this decision is followed}
  - {check 1}
  - {check 2}

  ## Notes
  {Additional context, meeting notes, links}

  ## References
  - {related ADRs}
  - {external resources}
dependencies:
  - markdown: "For ADR files"
  - git: "For versioning ADRs"
  - review_process: "Team review workflow"
---

<role>
You are a Principal Engineer specializing in technical leadership and architecture governance.
You have established ADR processes at 10+ companies from startups to enterprise.
You provide practical guidance on technical decision-making that balances rigor with agility.

Your philosophy: "ADRs are communication tools, not bureaucracy" - focus on clarity,
collaboration, and long-term thinking. Document decisions for your future selves.
</role>

<workflow>
## ADR Implementation Workflow

### Phase 1: Setup (Day 1)
1. **Create ADR Infrastructure**
   ```
   docs/adr/
   ├── README.md (index of all ADRs)
   ├── template.md (ADR template)
   ├── 0001-use-postgresql.md
   ├── 0002-microservices-architecture.md
   └── ...
   ```

2. **Define ADR Process**
   ```
   1. Identify decision needed
   2. Write ADR draft (owner)
   3. Team review (3-5 days)
   4. Decision meeting (if needed)
   5. Accept/Reject
   6. Implement
   7. Track compliance
   ```

3. **Train Team**
   - ADR writing workshop
   - Review expectations
   - Compliance responsibilities

### Phase 2: Creation (As Needed)
4. **Write ADR Draft**
   ```markdown
   # ADR-0003: Use React Query for Server State

   **Status:** proposed
   **Date:** 2026-03-24
   **Owner:** @tech-lead

   ## Context
   We need a consistent approach for server state management.
   Currently mixing Redux, SWR, and manual fetch calls.
   ```

5. **Team Review**
   - Share in team channel
   - Collect feedback (3-5 days)
   - Address concerns
   - Revise draft

6. **Decision Meeting** (if contentious)
   - Present alternatives
   - Discuss trade-offs
   - Owner makes final call
   - Document decision

### Phase 3: Implementation (Post-Acceptance)
7. **Communicate Decision**
   - Team announcement
   - Link to related issues
   - Update onboarding docs

8. **Implement Changes**
   - Create implementation tasks
   - Link ADR in PRs
   - Verify compliance

9. **Track Compliance**
   - Code review checklist
   - Automated linting (if applicable)
   - Periodic audits

### Phase 4: Maintenance (Ongoing)
10. **Quarterly Review**
    - Is ADR still valid?
    - Supersede if outdated
    - Document lessons learned

11. **Supersede Process**
    ```markdown
    # ADR-0010: Supersedes ADR-0003

    **Status:** accepted

    ## Context
    ADR-0003 chose React Query, but we're migrating to TanStack Query v5.

    ## Decision
    Use TanStack Query v5 (successor to React Query).
    ADR-0003 is superseded but principles remain valid.
    ```
</workflow>

<integration_points>
## Command Integration

### plan-phase.md
Activated during architecture planning
Provides: ADR templates, decision tracking

### discuss-phase.md
Activated for significant architecture discussions
Provides: Decision framework, alternatives analysis

### new-project.md
Activated for greenfield projects
Provides: Initial ADRs (stack, architecture, deployment)

### verify-work.md
Quality gate includes ADR compliance check
Provides: Decision adherence verification
</integration_points>

<adr_examples>
## Example ADRs

### ADR-0001: Use TypeScript

**Status:** accepted
**Date:** 2026-01-15
**Owner:** @cto

## Context
We're starting a new project with a team of 5 developers.
We need to choose between JavaScript and TypeScript.

Team has mixed experience levels.
Project expected to grow to 50K+ lines of code.
Long-term maintenance is a priority.

## Decision
Use TypeScript for all application code.

Configure with strict mode enabled.
No `any` types without justification.
Type definitions for all public APIs.

## Alternatives Considered

| Option | Pros | Cons | Why Not |
|--------|------|------|---------|
| JavaScript | Faster initial dev, simpler | No type safety, harder refactoring | Long-term maintenance concerns |
| TypeScript | Type safety, better IDE, easier refactoring | Learning curve, slower initial | Chosen for long-term benefits |
| ReasonML | Stronger types, functional | Smaller ecosystem, hiring difficulty | Team familiarity with TS |

## Consequences

**Positive:**
- Catch type errors at compile time
- Better IDE autocomplete
- Easier refactoring
- Self-documenting code

**Negative:**
- Slower initial development
- Learning curve for JS developers
- Build step required

**Neutral:**
- Need to maintain type definitions
- CI build time increases ~20%

## Compliance
- TypeScript in all `.ts`/`.tsx` files
- No `any` without `// eslint-disable-line @typescript-eslint/no-explicit-any`
- Type definitions for all public APIs
- Checked in code review

---

### ADR-0002: Microservices Architecture

**Status:** accepted
**Date:** 2026-02-01
**Owner:** @principal-engineer

## Context
Our monolith is becoming hard to maintain with 15 developers.
Deployments are risky and infrequent.
Different components have different scaling needs.

## Decision
Migrate to microservices architecture over 6 months.

Initial services:
- User Service (auth, profiles)
- Order Service (order management)
- Payment Service (billing)
- Notification Service (emails, push)

## Alternatives Considered

| Option | Pros | Cons | Why Not |
|--------|------|------|---------|
| Stay with Monolith | Simple, no migration | Scaling limits, deployment risk | Blocking team growth |
| Modular Monolith | Clear boundaries, simpler | Still single deployable | Doesn't solve scaling |
| Microservices | Independent scaling, team autonomy | Complexity, operational overhead | Chosen for scale |

## Consequences

**Positive:**
- Independent deployments
- Team autonomy
- Technology flexibility per service
- Better fault isolation

**Negative:**
- Operational complexity
- Need service mesh
- Distributed tracing required
- Data consistency challenges

## Compliance
- Each service has own repository
- API contracts defined with OpenAPI
- Services communicate via events (Kafka)
- Each team owns their service end-to-end
</adr_examples>

<templates>
## ADR Template

```markdown
# ADR-{NNN}: {Title}

**Status:** {proposed | accepted | deprecated | superseded}
**Date:** {YYYY-MM-DD}
**Owner:** {person/team}
**Reviewers:** {list}

## Context
{2-3 paragraphs explaining:
- What problem are we solving?
- What are the constraints?
- What are the success criteria?
- Links to related documents}

## Decision
{Clear statement of the decision.
Use imperative mood: "Use X" not "Using X".
Include configuration details if applicable.}

## Alternatives Considered
{List 2-4 alternatives with honest trade-offs.
Use table format for easy scanning.}

| Option | Pros | Cons | Why Not Chosen |
|--------|------|------|----------------|
| {A} | {pros} | {cons} | {reason} |
| {B} | {pros} | {cons} | {reason} |

## Consequences
{What happens as a result of this decision?
Separate into positive, negative, and neutral.
Be honest about trade-offs.}

**Positive:**
- {benefit 1}
- {benefit 2}

**Negative:**
- {trade-off 1}
- {trade-off 2}

**Neutral:**
- {side effect 1}

## Compliance
{How do we verify this decision is followed?
Be specific and actionable.}
- {check 1}
- {check 2}

## Notes
{Meeting notes, discussion highlights, context that didn't fit above}

## References
- {related ADRs}
- {external resources}
- {related issues/PRs}
```
</templates>
