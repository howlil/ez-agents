# Mode Workflow Templates

**Version:** 1.0  
**Purpose:** Define workflow templates for each operation mode  
**Reference:** `bin/lib/mode-detector.cjs`, `bin/lib/mode-workflows.cjs`

---

## MODE-01: Greenfield Mode Workflow

### Characteristics
- Full freedom to choose architecture
- Best practices from scratch
- No legacy constraints
- Full documentation required

### Workflow

```
Project Brief
    ↓
Architect Agent: Full architecture design
    ↓
Skill Activation: 7 skills (full stack + architecture + domain)
    ↓
Backend/Frontend Agents: Implementation with best practices
    ↓
QA Agent: Full test coverage (unit + integration + E2E)
    ↓
DevOps Agent: Complete CI/CD + monitoring setup
    ↓
Context Manager: Full documentation
```

### Configuration

| Setting | Value |
|---------|-------|
| Ceremony | Full |
| Skill Limit | 7 |
| Gates | All (1-7) |
| Documentation | Complete |
| Testing | Full coverage |

### Guardrails

None - full freedom to choose approach.

### When to Use

- New project from scratch
- No existing codebase constraints
- Team has freedom to choose technologies
- Time allows for comprehensive approach

---

## MODE-02: Existing Codebase Mode

### Characteristics
- Respect current structure
- Incremental improvements
- Pattern consistency with existing code
- Refactoring only when necessary

### Workflow

```
Analyze existing codebase patterns
    ↓
Architect Agent: Review architecture compatibility
    ↓
Skill Activation: 6 skills (consistency focused)
    ↓
Backend/Frontend Agents: Implementation matching existing patterns
    ↓
QA Agent: Standard test coverage
    ↓
Context Manager: Update documentation
```

### Configuration

| Setting | Value |
|---------|-------|
| Ceremony | Standard |
| Skill Limit | 6 |
| Gates | 1-5 (skip 6,7 for small changes) |
| Documentation | Standard |
| Testing | Standard |
| Pattern Consistency | Required |

### Guardrails

- No breaking changes without migration plan
- New code matches existing patterns
- Refactoring requires separate task

### When to Use

- Adding features to existing project
- Maintaining consistency with current code
- Incremental improvements
- Brownfield development

---

## MODE-03: Rapid MVP Mode

### Characteristics
- Speed > perfection
- Avoid overengineering
- Minimal viable features only
- Technical debt acceptable (documented)

### Workflow

```
Define minimal feature set
    ↓
Architect Agent: Minimal viable architecture
    ↓
Skill Activation: 4 skills (essential only)
    ↓
Backend/Frontend Agents: Rapid implementation
    ↓
QA Agent: Smoke testing only
    ↓
Context Manager: Log technical debt
```

### Configuration

| Setting | Value |
|---------|-------|
| Ceremony | Minimal |
| Skill Limit | 4 |
| Gates | 1, 4 only (requirements + security) |
| Documentation | Minimal |
| Testing | Smoke-only |
| Tech Debt Log | Required |

### Guardrails

- Technical debt must be logged
- Security gates still enforced
- Document shortcuts taken

### Trade-offs

| Pros | Cons |
|------|------|
| Fast delivery | Technical debt created |
| Minimal upfront investment | Limited test coverage |
| Quick feedback | Minimal documentation |

### When to Use

- POC for investor demo
- Tight deadline
- Validating product-market fit
- Small team, limited resources

---

## MODE-04: Scale-up Mode

### Characteristics
- Performance critical
- Scalability patterns required
- Distributed systems considerations
- Monitoring and alerting essential

### Workflow

```
Performance requirements analysis
    ↓
Architect Agent: Scalable architecture design
    ↓
Skill Activation: 6 skills (performance focused)
    ↓
Backend/Frontend Agents: Optimized implementation
    ↓
QA Agent: Performance + load testing
    ↓
DevOps Agent: Monitoring + scaling setup
```

### Configuration

| Setting | Value |
|---------|-------|
| Ceremony | Full |
| Skill Limit | 6 |
| Gates | All (1-7) |
| Documentation | Complete |
| Testing | Performance included |
| Performance Budget | Required |
| Load Testing | Required |

### Guardrails

- Performance budget must be met
- Load testing required
- Monitoring must be configured

### Focus Areas

- Database query optimization
- Caching strategy
- Horizontal scaling
- Rate limiting
- Monitoring dashboards

### When to Use

- High-traffic application
- Performance issues identified
- Scaling requirements
- Growth phase

---

## MODE-05: Maintenance Mode

### Characteristics
- Stability > new features
- Bug fixes and minor improvements
- No breaking changes
- Minimal risk changes

### Workflow

```
Impact analysis
    ↓
Architect Agent: Review change safety
    ↓
Skill Activation: 5 skills (stability focused)
    ↓
Backend/Frontend Agents: Minimal change implementation
    ↓
QA Agent: Regression testing
    ↓
Context Manager: Update change log
```

### Configuration

| Setting | Value |
|---------|-------|
| Ceremony | Minimal |
| Skill Limit | 5 |
| Gates | 1, 3, 4, 5 (skip 2, 6 for small fixes) |
| Documentation | Minimal |
| Testing | Regression |
| Rollback Plan | Required |

### Guardrails

- No architectural changes without approval
- All changes require rollback plan
- Regression tests mandatory

### When to Use

- Stable product in production
- Bug fixes
- Minor improvements
- Security patches

---

## Mode Detection Signals

### Greenfield Signals
- `no-existing-codebase`
- `new-project`
- `full-freedom`
- `from-scratch`

### Existing Signals
- `has-codebase`
- `incremental-change`
- `pattern-consistency-needed`
- `brownfield`

### Rapid MVP Signals
- `deadline-critical`
- `poc`
- `minimal-features`
- `team-size-small`
- `investor-demo`

### Scale-up Signals
- `high-traffic`
- `performance-issue`
- `scaling-requirement`
- `optimization-needed`

### Maintenance Signals
- `stable-product`
- `bug-fix`
- `minor-improvement`
- `no-breaking-changes`

---

## Mode Comparison

| Mode | Skill Limit | Gates | Documentation | Testing | Best For |
|------|-------------|-------|---------------|---------|----------|
| Greenfield | 7 | All | Complete | Full | New projects |
| Existing | 6 | 1-5 | Standard | Standard | Feature additions |
| Rapid MVP | 4 | 1,4 | Minimal | Smoke | POCs, demos |
| Scale-up | 6 | All | Complete | Performance | High traffic |
| Maintenance | 5 | 1,3,4,5 | Minimal | Regression | Bug fixes |
