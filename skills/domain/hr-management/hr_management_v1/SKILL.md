---
name: hr_management_v1
description: HR management system for employee records, payroll, attendance, and performance tracking
version: 1.0.0
tags: [hr, human-resources, payroll, employee, attendance, performance]
category: domain
triggers:
  keywords: [hr, human resources, payroll, employee management, attendance, performance review]
  projectArchetypes: [hr-system, enterprise, workforce-management]
prerequisites:
  - database_design_basics
  - security_basics
  - compliance_awareness
workflow:
  setup:
    - Employee data model
    - Role definitions
    - Payroll configuration
    - Compliance setup
  build:
    - Employee records
    - Attendance tracking
    - Payroll processing
    - Performance reviews
  automate:
    - Leave approvals
    - Payroll automation
    - Report generation
best_practices:
  - Secure employee data (encryption, access control)
  - Comply with labor laws
  - Automate payroll calculations
  - Track attendance accurately
  - Regular performance reviews
  - Self-service portal for employees
  - Audit trails for all changes
  - Backup data regularly
  - Integrate with accounting
  - Generate compliance reports
anti_patterns:
  - Never expose salary data improperly
  - Don't skip access controls
  - Avoid manual payroll calculations
  - Don't ignore labor law compliance
  - Never lose attendance records
  - Don't skip approval workflows
  - Avoid complex UI for employees
  - Don't ignore mobile access
scaling_notes: |
  HR System Scaling:
  - Start with core employee records
  - Add payroll integration
  - Implement performance management
  - Add recruiting module
when_not_to_use: |
  Not for: Very small teams (<10), contractor-only organizations
output_template: |
  ## HR System Architecture
  **Modules:** {employee records, payroll, attendance, performance}
  **Compliance:** {local labor laws, tax regulations}
  **Integration:** {accounting, time tracking}
dependencies:
  - database: "PostgreSQL with encryption"
  - payroll_provider: "Optional integration"
---

<role>
HR Technology Architect specializing in workforce management systems.
Focus on compliance, employee experience, and automation.
</role>
