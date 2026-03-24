# Handoff Protocol

**Version:** 1.0  
**Purpose:** Standardized handoff protocol for transferring skills and context between agents  
**Reference:** `bin/lib/skill-handoff.cjs`

---

## Handoff Record Format

```markdown
## Skill Handoff Record

**From Agent:** {agent-name}
**To Agent:** {next-agent-name}
**Phase:** {phase-number}
**Task:** {task-id}
**Timestamp:** {ISO timestamp}

### Context Transferred
- Project state: {STATE.md snapshot reference}
- Decisions made: {DECISIONS.md entries}
- Skills active: [list of skill IDs]
- Artifacts produced: [file paths]

### Continuity Requirements
- Must maintain: {specific patterns/approaches}
- Must not change: {locked decisions}
- Must validate: {specific checks}

### Handoff Checkpoint
**Type:** {checkpoint-type: sequential|parallel|interrupted}
**Status:** {ready-for-handoff|pending|blocked}
**Verification:** {self-check results}
```

---

## Handoff Types

### Sequential Handoff

**Description:** Standard flow where agents work in sequence

**Flow:** Architect → Backend → Frontend → QA → DevOps

**Use Cases:**
- Feature development from design to deployment
- Phase execution with clear stage boundaries

**Example:**
```
Architect designs authentication → Backend implements → Frontend integrates → QA tests
```

---

### Parallel Handoff

**Description:** Multiple agents work on same feature with shared context

**Flow:** Backend + Frontend work simultaneously

**Use Cases:**
- Full-stack feature development
- Independent components that can be developed in parallel

**Example:**
```
Backend creates API endpoints while Frontend builds UI components
Both agents share API contract documentation
```

---

### Interrupted Handoff

**Description:** Agent A stops at checkpoint, Agent B continues

**Flow:** Agent A → (interruption) → Agent B

**Use Cases:**
- Agent unavailable
- Priority change
- Recovery from failure

**Example:**
```
Backend Agent starts implementation but gets blocked on auth
DevOps Agent continues with CI/CD setup while waiting
```

---

## Continuity Requirements Format

### Must Maintain

Patterns and approaches that must continue:

```markdown
- Must maintain: Repository pattern for data access
- Must maintain: JWT authentication with refresh rotation
- Must maintain: Modular monolith architecture
```

### Must Not Change

Locked decisions from previous agent:

```markdown
- Must not change: Database schema (PostgreSQL with specific tables)
- Must not change: Authentication approach (JWT, not sessions)
- Must not change: API versioning strategy (URL-based)
```

### Must Validate

Checks receiving agent must perform:

```markdown
- Must validate: All API endpoints return consistent error format
- Must validate: Frontend handles all API error cases
- Must validate: Tests cover critical user flows
```

---

## Handoff Examples

### Example 1: Architect → Backend (User Authentication)

**From:** ez-architect-agent  
**To:** ez-backend-agent  
**Task:** Implement user authentication

**Context Transferred:**
- Project state: STATE.md snapshot at 2026-03-21T10:00:00Z
- Decisions: JWT auth, PostgreSQL, Redis for token blacklist
- Skills: modular_monolith, authentication_jwt, postgresql_schema
- Artifacts: ARCHITECTURE.md, API-CONTRACTS.md

**Continuity Requirements:**
- Must maintain: JWT authentication approach
- Must maintain: Modular structure
- Must implement: Token blacklist
- Must not change: Database choice (PostgreSQL)

**To Backend:** Activate skills: laravel_11, api_design_rest, authentication_jwt, redis_caching, testing_unit

---

### Example 2: Backend → Frontend (User Dashboard)

**From:** ez-backend-agent  
**To:** ez-frontend-agent  
**Task:** Build user dashboard

**Context Transferred:**
- API contracts: /api/v1/users, /api/v1/dashboard
- Data models: User, Dashboard, Metrics
- Authentication: JWT required on all endpoints

**Continuity Requirements:**
- Must use: Provided API contracts
- Must implement: Auth flow with token refresh
- Must match: Data models in frontend state

**To Frontend:** Activate skills: nextjs_app_router, state_management, api_integration, authentication_jwt, testing_component

---

### Example 3: Frontend → QA (Dashboard Testing)

**From:** ez-frontend-agent  
**To:** ez-qa-agent  
**Task:** Test dashboard functionality

**Context Transferred:**
- Components: DashboardLayout, MetricCard, Chart
- User flows: Login, View dashboard, Refresh data
- Edge cases: Empty state, Loading state, Error state

**Continuity Requirements:**
- Must test: All user flows documented
- Must verify: Accessibility compliance (WCAG 2.1 AA)
- Must validate: Error handling on all API calls

**To QA:** Activate skills: testing_playwright, accessibility_testing, api_testing, regression_testing, quality_gates

---

## Handoff Validation

### Pre-Handoff Checklist

Sending agent must verify:
- [ ] All artifacts committed
- [ ] Decision log complete
- [ ] Skills documented
- [ ] Continuity requirements clear
- [ ] Self-check passed

### Post-Handoff Checklist

Receiving agent must verify:
- [ ] All context received
- [ ] Continuity requirements understood
- [ ] Skills activated appropriately
- [ ] Ready to continue work

---

## Skill Memory

Skills used in project are tracked for consistency:

```json
{
  "projectId": "project-xyz",
  "skillMemory": [
    {
      "phase": "39",
      "task": "auth-implementation",
      "skills": ["authentication_jwt_skill", "laravel_11_structure_skill_v2"],
      "timestamp": "2026-03-21T10:00:00Z",
      "agent": "ez-backend-agent"
    }
  ]
}
```

**Purpose:** Ensure consistent skill usage across phases for coherence.
