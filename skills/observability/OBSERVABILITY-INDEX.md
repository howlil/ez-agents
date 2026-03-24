# Observability Skills Index

**Version:** 1.0
**Category:** observability

## Overview

Observability skills provide comprehensive guidance on monitoring, logging, tracing, and alerting for production systems. These skills help teams understand system behavior, diagnose issues, and maintain reliability.

## Available Observability Skills

| Skill | Directory | Focus Area |
|-------|-----------|------------|
| **Logging** | `logging/logging_skill_v1/` | Structured logging, log aggregation |
| **Metrics** | `metrics/metrics_skill_v1/` | Metrics collection, dashboards, alerts |
| **Distributed Tracing** | `tracing/distributed_tracing_skill_v1/` | Request tracing, span analysis |
| **Alerting** | `alerting/alerting_skill_v1/` | Alert configuration, on-call |
| **Dashboarding** | `dashboarding/dashboarding_skill_v1/` | Grafana, visualization |

## Three Pillars of Observability

```
┌─────────────────────────────────────────────────────────┐
│                    OBSERVABILITY                         │
├──────────────────┬──────────────────┬───────────────────┤
│     LOGGING      │     METRICS      │     TRACING       │
│                  │                  │                   │
│  What happened?  │  System health?  │  Request flow?    │
│                  │                  │                   │
│  - Structured    │  - Counters      │  - Spans          │
│  - Aggregation   │  - Gauges        │  - Context        │
│  - Search        │  - Histograms    │  - Propagation    │
│  - Analysis      │  - Alerts        │  - Analysis       │
└──────────────────┴──────────────────┴───────────────────┘
```

## Usage

```javascript
const { SkillRegistry } = require('./ez-agents/bin/lib/skill-registry');
const registry = new SkillRegistry();
await registry.load();

// Get all observability skills
const obsSkills = registry.findByCategory('observability');

// Get specific skill
const loggingSkill = registry.get('logging_skill_v1');
```

## Related Categories

- **Operational Skills**: `skills/operational/OPERATIONAL-INDEX.md`
- **Architecture Skills**: `skills/architecture/ARCHITECTURE-INDEX.md`
- **DevOps Agent**: `agents/ez-devops-agent.md`
