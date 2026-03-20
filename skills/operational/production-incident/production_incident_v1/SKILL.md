---
name: Production Incident Handling
description: SRE-style incident response with severity classification and blameless postmortems
version: 1.0.0
tags: [incident, sre, production, oncall, response]
category: operational
triggers:
  keywords: [incident, outage, production issue, severity]
  modes: [incident, maintenance]
severity_classification:
  - level: "SEV1 - Critical"
    definition: "Complete service outage, data loss, security breach"
    response_time: "Immediate (< 15 min)"
    escalation: "All hands, executive notification"
  - level: "SEV2 - Major"
    definition: "Significant functionality impaired for multiple users"
    response_time: "Urgent (< 1 hour)"
    escalation: "Engineering lead, product manager"
  - level: "SEV3 - Moderate"
    definition: "Noticeable but manageable impact"
    response_time: "Standard (< 4 hours)"
    escalation: "On-call engineer"
  - level: "SEV4 - Minor"
    definition: "Minimal impact on operations"
    response_time: "Next business day"
    escalation: "Standard ticket queue"
  - level: "SEV5 - Low"
    definition: "Feature request or enhancement"
    response_time: "Scheduled"
    escalation: "Product backlog"
incident_workflow:
  - phase: "Detection"
    actions: ["Alert received", "Initial severity assessment", "Create incident ticket"]
  - phase: "Analysis"
    actions: ["Validate alert", "Understand scope", "Identify potential root cause", "Assign severity"]
  - phase: "Impact Mitigation"
    actions: ["Implement workaround", "Reduce blast radius", "Communicate status"]
  - phase: "Resolution"
    actions: ["Identify root cause", "Implement fix", "Test in staging", "Deploy with monitoring"]
  - phase: "Service Restoration"
    actions: ["Verify service health", "Gradual traffic restoration", "Monitor for regression", "Close incident"]
  - phase: "Post-Incident Analysis"
    actions: ["Schedule blameless postmortem (48 hours)", "Document timeline", "5 Whys analysis", "Action items with owners"]
roles_and_responsibilities:
  incident_commander: "Owns incident response process, makes go/no-go decisions"
  technical_lead: "Leads technical investigation, coordinates fix"
  communications_lead: "Drafts stakeholder updates, manages status page"
  scribe: "Records all actions and decisions, maintains timeline"
communication_protocols:
  internal_updates: "SEV1: Every 30 min, SEV2: Every hour"
  external_updates: "SEV1: Status page within 15 min, SEV2: Within 30 min"
postmortem_template:
  sections:
    - Executive Summary
    - Timeline
    - Root Cause Analysis (5 Whys)
    - What Went Well
    - What Went Poorly
    - Action Items
    - Lessons Learned
---

# Production Incident Handling

## Purpose

Provide a structured SRE-style response process for production incidents — from detection through blameless postmortem — ensuring fast mitigation, clear communication, and continuous improvement.

## Severity Classification

| Level | Definition | Response Time | Escalation |
|-------|-----------|---------------|------------|
| **SEV1 - Critical** | Complete service outage, data loss, security breach | Immediate (< 15 min) | All hands, executive notification |
| **SEV2 - Major** | Significant functionality impaired for multiple users | Urgent (< 1 hour) | Engineering lead, product manager |
| **SEV3 - Moderate** | Noticeable but manageable impact | Standard (< 4 hours) | On-call engineer |
| **SEV4 - Minor** | Minimal impact on operations | Next business day | Standard ticket queue |
| **SEV5 - Low** | Feature request or enhancement | Scheduled | Product backlog |

**Key principle:** Assign severity based on user impact, not technical complexity. A simple config error causing a full outage is SEV1.

## Incident Workflow

### Phase 1: Detection

- Alert received (monitoring, user report, automated check)
- Initial severity assessment (can change during analysis)
- Create incident ticket with timestamp
- Page on-call engineer if SEV1-SEV2

### Phase 2: Analysis

- Validate the alert is real (not a monitoring false positive)
- Understand scope: how many users affected? What functionality?
- Identify potential root cause (recent deploys, config changes, external dependencies)
- Confirm or revise severity classification

### Phase 3: Impact Mitigation

- Implement workaround to reduce user impact (rollback, feature flag disable, traffic routing)
- Reduce blast radius (isolate failing component, shed non-critical load)
- Update status page and communicate to stakeholders

### Phase 4: Resolution

- Identify root cause with evidence (logs, metrics, traces)
- Implement fix with proper code review
- Test in staging environment
- Deploy to production with enhanced monitoring

### Phase 5: Service Restoration

- Verify all service health checks pass
- Gradually restore traffic (if load was shed)
- Monitor for regression for 30-60 minutes
- Close incident ticket with resolution summary

### Phase 6: Post-Incident Analysis

- Schedule blameless postmortem within 48 hours
- Document complete incident timeline
- Conduct 5 Whys root cause analysis
- Define action items with owners and due dates
- Share learnings with broader team

## Roles and Responsibilities

| Role | Responsibilities |
|------|----------------|
| **Incident Commander** | Owns response process, makes go/no-go decisions, delegates tasks, manages escalation |
| **Technical Lead** | Leads technical investigation, proposes and implements fixes, coordinates debugging |
| **Communications Lead** | Drafts stakeholder updates, manages status page, handles user-facing communication |
| **Scribe** | Records all actions and decisions chronologically, maintains timeline, tracks action items |

For small teams, one person may hold multiple roles (except Incident Commander + Technical Lead — keep these separate to avoid tunnel vision).

## Communication Protocols

### Internal Updates

| Severity | Update Frequency | Channel |
|----------|-----------------|---------|
| SEV1 | Every 30 minutes | Incident war room + executive channel |
| SEV2 | Every hour | Engineering channel |
| SEV3 | Every 4 hours | Team channel |

### External Updates (Status Page)

| Severity | First Update | Subsequent |
|----------|-------------|-----------|
| SEV1 | Within 15 minutes | Every 30 minutes |
| SEV2 | Within 30 minutes | Every hour |
| SEV3 | Within 2 hours | When status changes |

**Message template:**
```
[HH:MM UTC] We are investigating an issue affecting [service/feature].
[N] users may be affected. We are working on a resolution and will
provide updates every [30 min / hour].
```

## Postmortem Template

### Blameless Postmortem Principles

- No blame, no shame — systems fail, not people
- Focus on process improvements, not individual mistakes
- Document everything, even uncomfortable truths

### Sections

**1. Executive Summary** (2-3 sentences)
What happened, impact, and resolution.

**2. Timeline**
Chronological log of all events, from first alert to incident closure.
Format: `[HH:MM UTC] Event description`

**3. Root Cause Analysis (5 Whys)**
```
Why did the service fail?          → [Answer]
Why did [answer] happen?           → [Answer]
Why did [answer] happen?           → [Answer]
Why did [answer] happen?           → [Answer]
Why did [answer] happen?           → Root cause
```

**4. What Went Well**
- Effective detection, fast response, good communication, successful mitigations

**5. What Went Poorly**
- Delayed detection, unclear roles, missing runbooks, slow communications

**6. Action Items**

| Item | Owner | Due Date | Priority |
|------|-------|----------|----------|
| Add monitoring for [gap] | @engineer | [date] | High |
| Update runbook for [scenario] | @oncall | [date] | Medium |

**7. Lessons Learned**
Key takeaways for the whole team.
