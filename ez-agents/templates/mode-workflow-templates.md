# Mode Workflow Templates

**Phase:** 39
**Plan:** 39-06
**Requirements:** MODE-01 through MODE-05

This document defines workflow templates for each of the 5 operation modes.

---

## MODE-01: Greenfield Mode Workflow

**Characteristics:**
- Full freedom to choose architecture
- Best practices from scratch
- No legacy constraints
- Full documentation required

**Workflow:**
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

**Configuration:**
| Setting | Value |
|---------|-------|
| Ceremony | Full |
| Skill Limit | 7 skills |
| Gates | All 7 gates |
| Documentation | Complete |
| Testing | Full coverage |

**Guardrails:** None (full freedom)

**Best For:**
- New projects from scratch
- Complete rewrites
- Greenfield initiatives

---

## MODE-02: Existing Codebase Mode

**Characteristics:**
- Respect current structure
- Incremental improvements
- Pattern consistency with existing code
- Refactoring only when necessary

**Workflow:**
```
Change Request
    ↓
Context Manager: Analyze existing patterns
    ↓
Architect Agent: Incremental design (no big rewrites)
    ↓
Skill Activation: 6 skills (existing stack + consistency)
    ↓
Backend/Frontend Agents: Implementation matching existing patterns
    ↓
QA Agent: Regression tests + new feature tests
    ↓
Context Manager: Update documentation
```

**Configuration:**
| Setting | Value |
|---------|-------|
| Ceremony | Standard |
| Skill Limit | 6 skills |
| Gates | 1, 2, 3, 4, 5 (skip Gate 6 for small changes) |
| Documentation | Standard |
| Testing | Regression + new |

**Guardrails:**
- No breaking changes without migration plan
- New code matches existing patterns
- Refactoring requires separate task

**Best For:**
- Feature additions to existing projects
- Incremental improvements
- Pattern consistency requirements

---

## MODE-03: Rapid MVP Mode

**Characteristics:**
- Speed > perfection
- Avoid overengineering
- Minimal viable features only
- Technical debt acceptable (documented)

**Workflow:**
```
MVP Requirements
    ↓
Architect Agent: Minimal architecture (skip complex patterns)
    ↓
Skill Activation: 4 skills (core stack only)
    ↓
Backend/Frontend Agents: Fast implementation
    ↓
QA Agent: Smoke tests + critical path only
    ↓
DevOps Agent: Basic deployment (skip monitoring)
    ↓
Context Manager: Minimal documentation + tech debt log
```

**Configuration:**
| Setting | Value |
|---------|-------|
| Ceremony | Minimal |
| Skill Limit | 4 skills |
| Gates | 1, 4 (only requirements + security) |
| Documentation | Minimal |
| Testing | Smoke-only |

**Guardrails:**
- Technical debt must be logged
- Minimal documentation acceptable
- Smoke tests only

**Trade-offs:**
- ✅ Fast delivery
- ⚠️ Technical debt created (must be documented)
- ⚠️ Limited test coverage
- ⚠️ Minimal documentation

**Best For:**
- Investor demos
- POCs
- Tight deadline projects
- MVP launches

---

## MODE-04: Scale-up Mode

**Characteristics:**
- Performance critical
- Scalability patterns required
- Distributed systems considerations
- Monitoring and alerting essential

**Workflow:**
```
Scale Requirement
    ↓
Architect Agent: Scalability review (bottleneck analysis)
    ↓
Skill Activation: 6 skills (scalability + performance + monitoring)
    ↓
Backend/Frontend Agents: Performance-optimized implementation
    ↓
QA Agent: Load tests + performance benchmarks
    ↓
DevOps Agent: Auto-scaling + monitoring + alerting
    ↓
Context Manager: Performance documentation
```

**Configuration:**
| Setting | Value |
|---------|-------|
| Ceremony | Full |
| Skill Limit | 6 skills |
| Gates | All 7 gates |
| Documentation | Complete |
| Testing | Full + load |

**Guardrails:**
- Performance budget required
- Load testing required
- Monitoring must be configured

**Focus Areas:**
- Database query optimization
- Caching strategy
- Horizontal scaling
- Rate limiting
- Monitoring dashboards

**Best For:**
- High-traffic applications
- Performance optimization
- Scaling requirements
- Growth preparation

---

## MODE-05: Maintenance Mode

**Characteristics:**
- Stability > new features
- Bug fixes and minor improvements
- No breaking changes
- Minimal risk changes

**Workflow:**
```
Bug Report / Minor Request
    ↓
Context Manager: Impact analysis
    ↓
Architect Agent: Risk assessment (only for significant changes)
    ↓
Skill Activation: 5 skills (stability + testing + rollback)
    ↓
Backend/Frontend Agents: Minimal fix
    ↓
QA Agent: Regression tests
    ↓
DevOps Agent: Safe deployment (rollback ready)
    ↓
Context Manager: Update change log
```

**Configuration:**
| Setting | Value |
|---------|-------|
| Ceremony | Minimal |
| Skill Limit | 5 skills |
| Gates | 1, 3, 4, 5 (skip Gate 2 for small fixes) |
| Documentation | Minimal |
| Testing | Regression-required |

**Guardrails:**
- No architectural changes without approval
- Rollback plan required
- Regression tests mandatory

**Best For:**
- Stable products
- Bug fixes
- Minor improvements
- Hotfixes

---

## Mode Comparison

| Mode | Skill Limit | Gates | Documentation | Testing | Ceremony |
|------|-------------|-------|---------------|---------|----------|
| Greenfield | 7 | All | Complete | Full coverage | Full |
| Existing | 6 | 1-5 | Standard | Regression + new | Standard |
| Rapid MVP | 4 | 1, 4 | Minimal | Smoke-only | Minimal |
| Scale-up | 6 | All | Complete | Full + load | Full |
| Maintenance | 5 | 1, 3, 4, 5 | Minimal | Regression | Minimal |

---

## Mode Detection

Modes are detected from project context signals:

| Mode | Signals |
|------|---------|
| Greenfield | no-existing-codebase, new-project, full-freedom |
| Existing | has-codebase, incremental-change, pattern-consistency-needed |
| Rapid MVP | deadline-critical, poc, minimal-features, team-size-small |
| Scale-up | high-traffic, performance-issue, scaling-requirement |
| Maintenance | stable-product, bug-fix, minor-improvement, no-breaking-changes |

---

## Integration with Chief Strategist

The Chief Strategist agent integrates mode detection and routing:

1. **Detect mode** from project context at task intake
2. **Route tasks** to appropriate workflow based on mode
3. **Apply mode-specific skill limits**
4. **Apply mode-specific gate requirements**
5. **Log mode decisions** for audit trail

```javascript
const mode = detectMode(projectContext);
const workflow = getWorkflow(mode);

// Apply mode context to task
const taskWithContext = applyModeContext(task, mode);

// Route to appropriate workflow
routeToWorkflow(taskWithContext, workflow);
```
