# Operational Workflow Skills

## Overview

Operational skills provide repeatable workflows for maintenance, incident handling, and quality assurance. Each skill includes structured processes with checklists, templates, and quality gates.

Operational skills are activated based on:
- Project mode (maintenance, incident, all)
- Keywords in user requests
- Quality gate triggers

## Available Operational Skills

| Skill | Directory | Activation Trigger | Key Components |
|-------|-----------|-------------------|----------------|
| **Bug Triage** | `bug-triage/bug_triage_v1/` | Bug reported, sprint planning | Severity classification, Priority assignment, Triage workflow |
| **Refactor Planning** | `refactor-planning/refactor_planning_v1/` | Tech debt identified | Tech debt inventory, Incremental strategy, Risk assessment |
| **Migration Planning** | `migration-planning/migration_planning_v1/` | Version upgrade, platform change | Gap analysis, Data migration, Phased rollout |
| **Release Readiness** | `release-readiness/release_readiness_v1/` | Pre-release, deployment gate | Acceptance criteria, Test coverage, Performance benchmarks |
| **Rollback Planning** | `rollback-planning/rollback_planning_v1/` | Deployment failure, critical bug | Rollback triggers, Steps, Data rollback |
| **Production Incident** | `production-incident/production_incident_v1/` | SEV1-SEV3 incident | Severity classification, Incident workflow, Postmortem |
| **Regression Testing** | `regression-testing/regression_testing_v1/` | Post-change, pre-release | Test suite selection, Environment parity, Performance baseline |
| **Code Review Checklist** | `code-review-checklist/code_review_checklist_v1/` | Pull request created | Eight pillars, Quality gates, Implementation phases |
| **Security Audit** | `security-audit/security_audit_v1/` | Pre-release, compliance check | OWASP Top 10, Dependency scan, Vulnerability assessment |
| **Performance Optimization** | `performance-optimization/performance_optimization_v1/` | Performance issues, pre-launch | Lighthouse audit, Bundle analysis, Core Web Vitals |

## Activation Triggers

| Trigger | Operational Skill |
|---------|------------------|
| "bug", "defect", "issue" | Bug Triage |
| "refactor", "technical debt", "code quality" | Refactor Planning |
| "migration", "upgrade", "platform change" | Migration Planning |
| "release", "deploy", "launch", "go-live" | Release Readiness |
| "rollback", "revert", "deployment failure" | Rollback Planning |
| "incident", "outage", "production issue", "severity" | Production Incident |
| "regression", "testing", "validation", "pre-release" | Regression Testing |
| "code review", "pull request", "pr" | Code Review Checklist |
| "security", "audit", "vulnerability", "OWASP", "CVE" | Security Audit |
| "performance", "slow", "lighthouse", "core web vitals" | Performance Optimization |

## Usage Examples

### Using SkillRegistry

```javascript
const { SkillRegistry } = require('./ez-agents/bin/lib/skill-registry');
const registry = new SkillRegistry();
await registry.load();

// Get all operational skills
const operationalSkills = registry.findByCategory('operational');

// Get specific skill
const incidentSkill = registry.get('production_incident_v1');

// Search by keyword
const testingSkills = registry.search('testing');
```

### Using SkillMatcher with Project Mode

```javascript
const { SkillMatcher } = require('./ez-agents/bin/lib/skill-matcher');
const matcher = new SkillMatcher(registry);

// Match skills during incident
const context = {
  mode: 'incident',
  severity: 'SEV2'
};

const matchedSkills = matcher.match(context);
// Returns: production_incident_v1
```

## Operational Skill Structure

Each operational skill includes:

- **Structured Workflows**: Step-by-step processes
- **Checklists/Templates**: Reusable artifacts
- **Quality Gates**: Validation criteria
- **Best Practices**: Proven approaches
- **Anti-Patterns**: Common mistakes to avoid

## Version History

- **v1.0.0** (2026-03-21): Initial operational skills created in Phase 36
