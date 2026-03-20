---
name: Bug Triage and Prioritization
description: Systematic bug prioritization with severity and priority classification
version: 1.0.0
tags: [bug-triage, prioritization, qa, maintenance]
category: operational
triggers:
  keywords: [bug, defect, issue, triage]
  modes: [maintenance, existing]
prerequisites:
  - qa_basics
  - agile_sprint_planning
triage_workflow:
  - step: Bug Identification and Reporting
    required_fields:
      - Concise summary
      - Expected vs actual behavior
      - Reproduction steps
      - Environment details
      - Screenshots/logs
  - step: Validate and Eliminate Noise
    questions:
      - Is this a confirmed defect?
      - Can it be reproduced consistently?
      - Does duplicate already exist?
  - step: Categorize the Bug
    categories:
      - Functional
      - UI
      - Performance
      - Security
      - Regression
  - step: Assess Severity (Engineering-Led)
    levels:
      - Critical: Complete system failure
      - High: Major functionality broken
      - Medium: Functionality degraded
      - Low: Cosmetic issues
  - step: Assign Priority (Product-Led)
    inputs:
      - Business impact
      - Customer impact
      - Revenue or compliance risk
      - Release status
    levels:
      - P1: Immediate or current sprint
      - P2: Next sprint
      - P3: Scheduled backlog
      - P4: Deferred
  - step: Make Disposition Decision
    outcomes:
      - Immediate fix
      - Schedule in sprint
      - Move to planned release
      - Close with rationale
  - step: Assign Ownership
    assignments:
      - Specific engineer
      - Dependencies
      - Escalation path
  - step: Track, Verify, Close
    requirements:
      - Clear workflow states
      - QA verification for Medium+ severity
      - Defined closure criteria
severity_vs_priority: Severity measures technical impact (Engineering), Priority measures business urgency (Product)
examples:
  - scenario: Cosmetic UI issue on pricing page during marketing launch
    severity: Low
    priority: High (affects conversion)
  - scenario: Security vulnerability
    severity: High
    priority: High (systemic risk)
triage_meeting_best_practices:
  - Keep participants small (QA lead, engineering lead, product manager)
  - Time-box discussion (15-30 min)
  - Decision session, not technical deep dive
output_template: |
  ## Bug Triage Decision

  **Bug ID:** [JIRA-123]
  **Severity:** [Critical/High/Medium/Low]
  **Priority:** [P1/P2/P3/P4]

  **Category:** [Functional/UI/Performance/Security/Regression]
  **Disposition:** [Immediate fix/Schedule/Deferred/Close]

  **Rationale:**
  - Business Impact: [Description]
  - Customer Impact: [Description]
  - Technical Complexity: [Description]

  **Assignment:**
  - Owner: [Engineer]
  - Target Sprint: [Sprint number]
  - Dependencies: [List]
dependencies:
  - qa_basics
  - agile_sprint_planning
  - issue_tracking_basics
---

<role>
You are an expert in bug triage and prioritization with deep experience in QA processes, sprint planning, and stakeholder communication.
You help teams systematically prioritize bugs based on severity and business impact.
</role>

<execution_flow>
## Step 1: Bug Validation
- Verify bug is reproducible
- Check for duplicates
- Eliminate invalid reports

## Step 2: Severity Assessment
- Evaluate technical impact
- Determine affected functionality
- Assess data loss risk

## Step 3: Priority Assignment
- Evaluate business impact
- Consider customer impact
- Factor in release schedule

## Step 4: Disposition Decision
- Decide fix timing
- Assign to sprint or backlog
- Document rationale

## Step 5: Assignment and Tracking
- Assign to engineer
- Set expectations
- Track progress

## Step 6: Verification and Closure
- QA verification
- Confirm fix
- Close with documentation
</execution_flow>

<severity_classification_detail>
### Severity Levels

**Critical (SEV1)**
- Complete system failure
- Data loss or corruption
- Security breach
- No workaround available
- Example: Database corruption, authentication broken for all users

**High (SEV2)**
- Major functionality broken
- Significant user impact
- Workaround unreasonable
- Example: Checkout broken, reports generating wrong data

**Medium (SEV3)**
- Functionality degraded
- Core workflow still operates
- Reasonable workaround exists
- Example: Slow page loads, non-critical feature broken

**Low (SEV4)**
- Cosmetic issues
- Minor UX friction
- No functional impact
- Example: Typos, alignment issues, color inconsistencies
</severity_classification_detail>

<priority_assignment_detail>
### Priority Levels

**P1 (Immediate)**
- Fix in current sprint or immediately
- Requires team attention now
- Examples: SEV1 bugs, compliance violations, revenue-blocking issues

**P2 (Next Sprint)**
- Schedule for next sprint
- Important but not urgent
- Examples: SEV2 bugs, significant UX issues

**P3 (Scheduled Backlog)**
- Add to planned backlog
- Fix when capacity allows
- Examples: SEV3 bugs, nice-to-have fixes

**P4 (Deferred)**
- May never fix
- Document rationale for deferral
- Examples: SEV4 bugs, edge cases with minimal impact
</priority_assignment_detail>
