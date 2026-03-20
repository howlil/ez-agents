---
name: Migration Planning
description: System and data migration planning with phased rollout and validation
version: 1.0.0
tags: [migration, data-migration, upgrade, platform-change]
category: operational
triggers:
  keywords: [migration, upgrade, platform change, data migration]
  modes: [maintenance, scale-up]
key_components:
  current_state: "Document current system, data model, integrations, dependencies"
  target_state: "Define target system, desired outcomes, success criteria"
  gap_analysis: "What needs to change, migration tasks, effort estimation"
  data_migration_strategy: "ETL, dual-write, backfill, data validation"
  phased_rollout: "Canary deployment, blue-green, percentage-based rollout"
  validation_criteria: "How to confirm success, data integrity checks, functional tests"
  rollback_procedures: "How to revert, data rollback strategy, communication plan"
  communication_plan: "Stakeholder updates, user notifications, documentation"
migration_patterns:
  - Big bang
  - Parallel run
  - Phased migration
  - Strangler fig
when_not_to_use: "Unstable current system (fix first), without backup strategy, during critical business periods"
---

# Migration Planning

## Purpose

Structure system and data migrations with phased rollout and validation to minimize risk and ensure successful transition.

## Key Components

### 1. Current State

Document everything about the existing system:

- Current system architecture and technology stack
- Data model: schemas, volumes, relationships
- External integrations and API contracts
- Dependencies (libraries, services, infrastructure)
- Known issues and limitations

### 2. Target State

Define the destination clearly:

- Target system architecture
- Desired outcomes (performance, scalability, cost)
- Success criteria: what does "done" look like?
- Non-functional requirements (uptime, latency, data retention)

### 3. Gap Analysis

Bridge the gap between current and target:

- What needs to change (feature by feature, component by component)
- Identify migration tasks and dependencies
- Estimate effort and timeline
- Highlight high-risk areas

### 4. Data Migration Strategy

Choose the right data movement approach:

- **ETL (Extract, Transform, Load):** Batch migration with transformation
- **Dual-write:** Write to both old and new systems during transition
- **Backfill:** Migrate historical data after new system is live
- **Data validation:** Row counts, checksums, spot checks

### 5. Phased Rollout

Reduce blast radius with incremental deployment:

- **Canary deployment:** Small percentage of traffic first
- **Blue-green:** Full parallel environment, instant cutover
- **Percentage-based rollout:** Gradual traffic shifting

### 6. Validation Criteria

Confirm the migration succeeded:

- Data integrity checks (counts, checksums, sample validation)
- Functional tests against migrated system
- Performance benchmarks comparison
- User acceptance testing

### 7. Rollback Procedures

Always have an exit path:

- How to revert to the old system
- Data rollback strategy (backups, point-in-time restore)
- Communication plan for rollback announcement

### 8. Communication Plan

Keep stakeholders informed:

- Stakeholder update schedule
- User notifications (maintenance windows, expected impact)
- Documentation updates
- Post-migration runbook

## Migration Patterns

| Pattern | When to Use | Risk Level |
|---------|-------------|------------|
| Big bang | Small data volume, low traffic, planned downtime window | High |
| Parallel run | Critical systems, cannot afford downtime | Medium |
| Phased migration | Large system, phased feature parity | Low |
| Strangler fig | Gradual replacement without full rewrite | Low |

## When NOT to Use This Skill

- Unstable current system: fix stability issues before migrating
- Without backup strategy: always have a tested restore path
- During critical business periods (year-end, product launches)
