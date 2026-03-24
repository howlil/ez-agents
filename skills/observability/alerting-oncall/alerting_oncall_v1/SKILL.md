---
name: alerting_oncall_v1
description: Alerting and on-call practices for incident response, paging, and SRE operations
version: 1.0.0
tags: [alerting, oncall, incident-response, sre, paging, monitoring]
category: observability
triggers:
  keywords: [alerting, on-call, incident, paging, sre, runbook]
  projectArchetypes: [production-systems, mission-critical, 24x7-operations]
prerequisites:
  - monitoring_basics
  - incident_management
  - communication_tools
workflow:
  setup:
    - Define alerting strategy
    - Create on-call rotation
    - Setup paging system
    - Write runbooks
  implement:
    - Alert rules
    - Escalation policies
    - Notification channels
    - Incident workflows
  improve:
    - Alert tuning
    - Post-mortems
    - On-call health
best_practices:
  - Alert on symptoms, not causes
  - Use severity levels (P0-P4)
  - Implement escalation policies
  - Write actionable runbooks
  - Rotate on-call fairly
  - Limit pages per shift
  - Track alert fatigue
  - Conduct post-mortems
  - Reward on-call participants
  - Automate incident response
anti_patterns:
  - Never alert without action
  - Don't page for informational
  - Avoid alert storms
  - Don't skip runbooks
  - Never ignore alert fatigue
  - Don't have single point of failure
  - Avoid complex escalation
  - Don't skip post-mortems
scaling_notes: |
  Alerting Scaling:
  - Start with critical alerts only
  - Add severity levels
  - Implement escalation
  - Add on-call rotation
when_not_to_use: |
  Not for: Development environments, non-critical systems, projects without 24/7 requirements
output_template: |
  ## Alerting Strategy
  **Severity Levels:** {P0-Critical, P1-High, P2-Medium, P3-Low}
  **Paging:** {PagerDuty, Opsgenie, custom}
  **Escalation:** {immediate, delayed, hierarchical}
dependencies:
  - monitoring: "Prometheus, Datadog, etc."
  - paging: "PagerDuty, Opsgenie"
  - communication: "Slack, Teams"
---

<role>
SRE specializing in incident response and on-call operations.
Focus on actionable alerts, sustainable on-call, and continuous improvement.
</role>
