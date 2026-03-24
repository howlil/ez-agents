# Agent Output Format Template

**Version:** 1.0
**Phase:** 39
**Requirement:** POOL-02

All specialist agents must produce output following this standardized format to ensure consistency, enable cross-agent understanding, and provide audit trails for decisions made during execution.

---

## Required Sections

Every agent output must include these 5 sections:

1. **Decision Log** — All architectural and implementation decisions with rationale
2. **Trade-off Analysis** — Options considered, pros/cons, why chosen option selected
3. **Artifacts Produced** — Files created/modified with purpose
4. **Skills Applied** — Which skills guided the work
5. **Verification Status** — Self-check results before handoff

---

## Section 1: Decision Log

### Purpose

Document all significant decisions made during task execution with full context and rationale.

### Format

```markdown
## Decisions Made

### Decision {N}: [Decision Name]

**Context:** [Situation requiring decision]

**Options Considered:**
1. [Option A]
2. [Option B]
3. [Option C]

**Decision:** [Chosen option]

**Rationale:**
- [Reason 1]
- [Reason 2]
- [Reason 3]

**Trade-offs:**
- ✅ Pros: [Advantages]
- ❌ Cons: [Disadvantages]

**Skills Applied:** `[skill_id_1]`, `[skill_id_2]`

**Impact:** [What this decision affects]
```

### Required Fields

| Field | Required | Description |
|-------|----------|-------------|
| Context | Yes | Situation requiring decision |
| Options Considered | Yes | At least 2-3 options evaluated |
| Decision | Yes | Clear statement of chosen option |
| Rationale | Yes | Why this option was selected |
| Trade-offs | Yes | Pros and cons |
| Skills Applied | Yes | Skill IDs that guided decision |
| Impact | Yes | What this decision affects |

### Example

```markdown
## Decisions Made

### Decision 1: JWT-based Authentication

**Context:** User authentication for SaaS platform requiring stateless API access

**Options Considered:**
1. JWT-based authentication with refresh rotation
2. Session-based authentication with Redis store
3. OAuth2 with external provider (Auth0, Okta)

**Decision:** JWT-based authentication with refresh rotation

**Rationale:**
- Stateless design matches microservices architecture
- Easier horizontal scaling for SaaS multi-tenant
- Mobile-friendly (no cookie dependencies)
- Full control over auth logic (vs external provider)

**Trade-offs:**
- ✅ Pros: Scalable, industry standard, mobile-friendly, full control
- ❌ Cons: Token revocation complexity, larger payload, storage for blacklist

**Skills Applied:** `authentication_jwt_skill_v1`, `security_architecture_skill_v1`, `saas_multi_tenant_skill_v1`

**Impact:** All API endpoints will require JWT validation middleware, refresh token rotation endpoint needed
```

---

## Section 2: Trade-off Analysis

### Purpose

Provide detailed comparison of options considered for significant decisions, enabling future agents to understand why specific approaches were chosen.

### Format

```markdown
## Trade-off Analysis

**Decision Point:** [Brief description of decision]

| Option | Pros | Cons | Best For |
|--------|------|------|----------|
| [Option A] | - [Pro 1]<br>- [Pro 2] | - [Con 1]<br>- [Con 2] | [Use case] |
| [Option B] | - [Pro 1]<br>- [Pro 2] | - [Con 1]<br>- [Con 2] | [Use case] |
| [Option C] | - [Pro 1]<br>- [Pro 2] | - [Con 1]<br>- [Con 2] | [Use case] |

**Recommendation:** [Option X]

**Why:** [Detailed explanation of why this option was chosen]

**Confidence:** [High | Medium | Low] ([context for confidence level])
```

### Example

```markdown
## Trade-off Analysis

**Decision Point:** Database selection for analytics module

| Option | Pros | Cons | Best For |
|--------|------|------|----------|
| PostgreSQL | - ACID compliance<br>- Complex queries<br>- Mature ecosystem | - Slower for time-series<br>- Vertical scaling limits | Transactional data |
| TimescaleDB | - Optimized for time-series<br>- PostgreSQL compatible<br>- Automatic partitioning | - Newer, smaller community<br>- Additional complexity | Time-series analytics |
| ClickHouse | - Extremely fast analytics<br>- Column-oriented<br>- Compression | - Limited transactional support<br>- Steep learning curve | Pure analytics |

**Recommendation:** TimescaleDB

**Why:** Matches requirement for time-series analytics while maintaining PostgreSQL compatibility for existing data. Team already has PostgreSQL expertise, reducing learning curve.

**Confidence:** High (used in 3 similar SaaS projects with positive results)
```

---

## Section 3: Artifacts Produced

### Purpose

List all files created or modified during task execution with their purpose and skill alignment.

### Format

```markdown
## Artifacts Produced

### Files Created
| File | Purpose | Skill Alignment |
|------|---------|-----------------|
| `[file_path]` | [Purpose] | `[skill_id]` |

### Files Modified
| File | Changes | Reason |
|------|---------|--------|
| `[file_path]` | [Description of changes] | [Reason] |

### Documentation
- `[doc_name]` — [Description]
```

### Example

```markdown
## Artifacts Produced

### Files Created
| File | Purpose | Skill Alignment |
|------|---------|-----------------|
| `src/api/auth.ts` | JWT authentication endpoints | `api_design_rest_skill_v1` |
| `src/middleware/auth.ts` | Auth middleware for protected routes | `security_auth_best_practices_v1` |
| `src/models/user.ts` | User model with password hashing | `laravel_11_structure_skill_v2` |
| `src/services/token.service.ts` | Token generation and validation | `authentication_jwt_skill_v1` |
| `tests/unit/auth.test.ts` | Unit tests for auth flow | `testing_unit_phpunit_skill_v1` |

### Files Modified
| File | Changes | Reason |
|------|---------|--------|
| `src/config/database.ts` | Added TimescaleDB connection config | Analytics module requirement |
| `.env.example` | Added `TIMESCALE_DB_URL` variable | New environment variable |
| `package.json` | Added `jsonwebtoken`, `bcrypt` dependencies | Authentication implementation |

### Documentation
- `API-AUTH.md` — Authentication API documentation
- `DECISIONS.md#auth-strategy` — Decision record for auth approach
- `ADRs/001-jwt-authentication.md` — Architecture Decision Record
```

---

## Section 4: Skills Applied

### Purpose

Document which skills guided the work, enabling skill memory tracking and consistency verification.

### Format

```markdown
## Skills Applied

**Total Skills Activated:** {N} (must be 3-7 per task)

### Skill Breakdown

| Category | Skills | Count |
|----------|--------|-------|
| Stack | `[skill_1]`, `[skill_2]` | {N} |
| Architecture | `[skill_3]`, `[skill_4]` | {N} |
| Domain | `[skill_5]` | {N} |
| Operational | `[skill_6]` | {N} |
| Governance | `[skill_7]` | {N} |

### Skill Rationale

- **`[skill_1]`:** [Why this skill was activated]
- **`[skill_2]`:** [Why this skill was activated]
```

### Example

```markdown
## Skills Applied

**Total Skills Activated:** 5

### Skill Breakdown

| Category | Skills | Count |
|----------|--------|-------|
| Stack | `laravel_11_structure_skill_v2` | 1 |
| Architecture | `repository_pattern_skill_v1`, `api_versioning_skill_v1` | 2 |
| Domain | `ecommerce_product_catalog_skill_v1` | 1 |
| Operational | `testing_integration_phpunit_skill_v1` | 1 |
| Governance | `api_rate_limiting_skill_v1` | 0 |

### Skill Rationale

- **`laravel_11_structure_skill_v2`:** Stack skill for Laravel 11 framework patterns
- **`repository_pattern_skill_v1`:** Clean separation between business logic and data access
- **`api_versioning_skill_v1`:** API needs versioning for backward compatibility
- **`ecommerce_product_catalog_skill_v1`:** Domain skill for product catalog patterns
- **`testing_integration_phpunit_skill_v1`:** Integration testing for API endpoints
```

---

## Section 5: Verification Status

### Purpose

Self-check results before handoff to ensure quality and completeness.

### Format

```markdown
## Verification Status

### Self-Check Results

- [ ] Output matches standardized format
- [ ] Decision log is complete with all required fields
- [ ] Trade-off analysis includes comparison table
- [ ] Artifacts section lists all created/modified files
- [ ] Skills applied section documents 3-7 skills
- [ ] Skills alignment verified
- [ ] Skill consistency validation passed
- [ ] Ready for handoff to {next_agent}

### Quality Gates

| Gate | Status | Notes |
|------|--------|-------|
| Requirement Completeness | ✅ PASS | All requirements addressed |
| Architecture Review | ✅ PASS | Follows architectural patterns |
| Code Quality | ✅ PASS | Linting and formatting pass |
| Security Baseline | ✅ PASS | No security issues detected |
| Testing | ✅ PASS | Tests passing with {N}% coverage |
| Documentation | ✅ PASS | All sections complete |
| Performance | ✅ PASS | Within performance budget |
```

### Example

```markdown
## Verification Status

### Self-Check Results

- [x] Output matches standardized format
- [x] Decision log is complete with all required fields
- [x] Trade-off analysis includes comparison table
- [x] Artifacts section lists all created/modified files
- [x] Skills applied section documents 5 skills (within 3-7 limit)
- [x] Skills alignment verified
- [x] Skill consistency validation passed
- [x] Ready for handoff to Backend Agent

### Quality Gates

| Gate | Status | Notes |
|------|--------|-------|
| Requirement Completeness | ✅ PASS | All auth requirements addressed |
| Architecture Review | ✅ PASS | Follows modular monolith patterns |
| Code Quality | ✅ PASS | ESLint pass, no errors |
| Security Baseline | ✅ PASS | Password hashing, rate limiting implemented |
| Testing | ✅ PASS | 87% coverage, all tests passing |
| Documentation | ✅ PASS | All sections complete |
| Performance | ✅ PASS | JWT validation < 10ms |
```

---

## Agent Return Format

At task completion, agents return this structured format:

```markdown
## AGENT COMPLETE

**Agent:** {agent-name}
**Task:** {task-description}
**Phase:** {phase-number}
**Duration:** {time-spent}

### Skills Activated
- {skill-1}
- {skill-2}
- {skill-3}

### Decisions Made
{N} decisions documented in DECISIONS.md

### Artifacts
- {N} files created
- {M} files modified

### Verification
- [ ] Self-check passed
- [ ] Skills alignment verified
- [ ] Decision log complete

### Handoff Notes
{Context for next agent if task continues}
```

---

## Validation Rules

The output validator (`bin/lib/output-validator.cjs`) checks:

### Required Sections (Error if missing)
- Decision Log
- Trade-off Analysis
- Artifacts Produced
- Skills Applied
- Verification Status

### Field Requirements (Warning if incomplete)
- Decision Log: At least 1 decision with all required fields
- Trade-off Analysis: Comparison table with at least 2 options
- Artifacts: At least 1 file listed (created or modified)
- Skills: 3-7 skills documented
- Verification: All checkboxes evaluated

### Severity Levels
- **error** — Missing required section (blocks handoff)
- **warning** — Incomplete section (logged, allows handoff)
- **info** — Suggestions for improvement

---

## Integration with Agents

Each specialist agent integrates this format by:

1. **Referencing this template** in their `<output_format>` section
2. **Including domain-specific examples** relevant to their responsibilities
3. **Defining agent-specific artifacts** they typically produce
4. **Following the agent return format** at task completion

See individual agent files for their specific integrations:
- `agents/ez-architect-agent.md`
- `agents/ez-backend-agent.md`
- `agents/ez-frontend-agent.md`
- `agents/ez-qa-agent.md`
- `agents/ez-devops-agent.md`
- `agents/ez-context-manager.md`
