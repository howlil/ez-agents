# Handoff Protocol Template

**Phase:** 39
**Plan:** 39-05
**Requirement:** POOL-05, ORCH-07

This template defines the standardized handoff protocol for transferring skills and context between agents.

---

## Skill Handoff Record Format

```markdown
## Skill Handoff Record

**From Agent:** {agent-name}
**To Agent:** {next-agent-name}
**Phase:** {phase-number}
**Task:** {task-id}
**Timestamp:** {ISO timestamp}

### Context Transferred
- **Project State:** {STATE.md snapshot reference}
- **Decisions Made:** {DECISIONS.md entries}
- **Skills Active:** [list of skill IDs]
- **Artifacts Produced:** [file paths]

### Continuity Requirements
- **Must Maintain:** {specific patterns/approaches}
- **Must Not Change:** {locked decisions}
- **Must Validate:** {specific checks}

### Handoff Checkpoint
**Type:** {checkpoint-type: sequential|parallel|interrupted}
**Status:** {ready-for-handoff|pending|blocked}
**Verification:** {self-check results}

### Skill Transfer
- **Inherited Skills:** [skills from previous agent]
- **Recommended Skills:** [skills for next agent]
- **Consistent Skills:** [skills used consistently in project]
```

---

## Handoff Types

### Sequential Handoff

Standard flow: Architect → Backend → Frontend → QA → DevOps

**Characteristics:**
- Clear handoff boundaries
- Complete context transfer
- Validation before handoff

**Example:**
```markdown
## Handoff: Architect Agent → Backend Agent

**Phase:** 39
**Task:** User Authentication Feature
**Type:** sequential

### From Architect Agent
**Decisions:**
1. JWT-based authentication
2. PostgreSQL for user data
3. Redis for token blacklist

**Skills Applied:**
- modular_monolith_pattern_skill_v1
- authentication_jwt_skill_v1
- postgresql_schema_design_skill_v1

**Artifacts:**
- ARCHITECTURE.md
- API-CONTRACTS.md
- DB-SCHEMA.md

### To Backend Agent
**Must Implement:**
- JWT auth endpoints (login, register, refresh, logout)
- Password hashing with bcrypt
- Token blacklist in Redis

**Skills Activated:**
- laravel_11_structure_skill_v2 (stack)
- api_design_rest_skill_v1 (architecture)
- authentication_jwt_skill_v1 (domain — inherited)
- redis_caching_pattern_skill_v1 (infrastructure)
- testing_unit_phpunit_skill_v1 (operational)

**Continuity Requirements:**
- Must follow JWT approach from Architect decision
- Must use modular structure
- Must implement token blacklist
```

### Parallel Handoff

Backend + Frontend work on same feature with shared context

**Characteristics:**
- Shared context between agents
- Coordinated implementation
- Regular sync points

**Example:**
```markdown
## Handoff: Architect Agent → Backend + Frontend Agents (Parallel)

**Phase:** 39
**Task:** Dashboard Feature
**Type:** parallel

### Shared Context
**Architecture:**
- Client-server architecture
- WebSocket for real-time updates
- Zustand for state management

**API Contracts:**
- GET /api/dashboard/metrics
- GET /api/dashboard/charts
- WebSocket: dashboard-updates

### Backend Agent Responsibilities
- Implement API endpoints
- Set up WebSocket server
- Data aggregation logic

### Frontend Agent Responsibilities
- Build dashboard components
- Set up Zustand store
- WebSocket client integration

### Coordination Points
- API contract alignment
- Data model consistency
- Error handling patterns
```

### Interrupted Handoff

Agent A stops at checkpoint, Agent B continues (recovery)

**Characteristics:**
- Recovery from interruption
- Complete state capture
- Clear resumption point

**Example:**
```markdown
## Handoff: Backend Agent → Frontend Agent (Interrupted)

**Phase:** 39
**Task:** User Profile Feature
**Type:** interrupted

### Interruption Point
**Stopped At:** API implementation complete, tests pending
**Reason:** Blocker - external API dependency

### State Captured
**Completed:**
- User model created
- API endpoints implemented
- Database migrations run

**Pending:**
- Unit tests (blocked by external API)
- Integration tests

### Resumption
**Frontend Agent Can:**
- Start UI implementation with mock data
- Use API contracts for integration
- Implement error states

**Continuity:**
- Must use implemented API endpoints
- Must handle loading/error states
- Must match data models
```

---

## Continuity Requirements Format

```markdown
### Continuity Requirements

**Must Maintain:**
- [Pattern/approach that must continue]
- [Example: JWT authentication approach]

**Must Not Change:**
- [Locked decision that cannot be changed]
- [Example: PostgreSQL as database]

**Must Validate:**
- [Specific checks receiving agent must perform]
- [Example: API contract compliance]
```

---

## Skill Memory Format

Skill memory tracks skills used across the project for consistency:

```javascript
{
  "projectId": "project-xyz",
  "skills": [
    {
      "phase": "39",
      "task": "user-auth",
      "skills": [
        {"id": "laravel_11_structure_skill_v2", "category": "Stack"},
        {"id": "authentication_jwt_skill_v1", "category": "Domain"}
      ],
      "timestamp": "2026-03-21T10:00:00Z",
      "agent": "ez-backend-agent"
    }
  ],
  "lastUpdated": "2026-03-21T10:00:00Z"
}
```

---

## Handoff Validation

Before handoff, validate:

```javascript
const validation = validateHandoff(handoff);

if (!validation.valid) {
  // Block handoff
  console.error('Handoff blocked:', validation.violations);
  return;
}

if (validation.warnings.length > 0) {
  // Log warnings
  console.warn('Handoff warnings:', validation.warnings);
}

// Proceed with handoff
```

**Validation Checks:**
- [ ] fromAgent specified
- [ ] toAgent specified
- [ ] Skills active transferred
- [ ] Artifacts listed
- [ ] Continuity requirements specified
- [ ] Checkpoint status is READY

---

## Integration with Context Manager

The Context Manager agent manages handoffs:

1. **Creates handoff records** using `createHandoff()`
2. **Tracks skill memory** using `recordSkillUsage()`
3. **Ensures continuity** by validating requirements
4. **Updates STATE.md** with handoff status

---

## Handoff Checklist

Before initiating handoff:

- [ ] All artifacts produced and committed
- [ ] Decision log complete
- [ ] Skills documented (3-7 activated)
- [ ] Verification status complete
- [ ] Continuity requirements defined
- [ ] Handoff record created
- [ ] Validation passed

After handoff complete:

- [ ] Receiving agent acknowledges receipt
- [ ] Skills transferred successfully
- [ ] Context understood
- [ ] Continuity requirements accepted
- [ ] Task execution begins
