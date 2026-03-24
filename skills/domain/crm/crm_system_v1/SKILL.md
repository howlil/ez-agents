---
name: crm_system_v1
description: Customer Relationship Management (CRM) architecture for sales pipeline, customer data, and relationship tracking
version: 1.0.0
tags: [crm, sales, customer-management, pipeline, lead-tracking, contact-management]
category: domain
triggers:
  keywords: [crm, customer relationship, sales pipeline, lead management, contact management]
  projectArchetypes: [crm, sales-platform, customer-portal]
prerequisites:
  - database_design_basics
  - authentication_authorization
  - email_integration_basics
workflow:
  setup:
    - Define customer data model
    - Design sales pipeline stages
    - Setup user roles
    - Configure email integration
  build:
    - Contact management
    - Lead tracking
    - Deal pipeline
    - Activity logging
  automate:
    - Email sequences
    - Task reminders
    - Lead scoring
    - Reporting
best_practices:
  - Centralize all customer interactions
  - Track complete communication history
  - Implement lead scoring system
  - Automate follow-up reminders
  - Provide mobile access
  - Integrate with email/calendar
  - Setup sales forecasting
  - Enable team collaboration
  - Implement data enrichment
  - Regular data hygiene (deduplication)
anti_patterns:
  - Never allow duplicate contacts
  - Don't lose communication history
  - Avoid manual data entry (automate)
  - Don't skip activity tracking
  - Never ignore data privacy (GDPR)
  - Don't make UI too complex
  - Avoid siloed customer data
  - Don't skip reporting features
scaling_notes: |
  CRM Scaling:
  - Start with contacts + deals
  - Add automation (email, tasks)
  - Integrate external tools
  - Add AI features (lead scoring, predictions)
when_not_to_use: |
  Not for: Simple contact lists, single-user businesses, businesses without sales process
output_template: |
  ## CRM Architecture Decision
  **Deployment:** {self-hosted | cloud | hybrid}
  **Key Modules:** {contacts, deals, activities, reports}
  **Integrations:** {email, calendar, phone, marketing}
dependencies:
  - database: "PostgreSQL or similar"
  - email_provider: "SendGrid, SES, or similar"
---

<role>
CRM Architect specializing in sales technology and customer data platforms.
You have built CRMs used by sales teams closing millions in deals.
Focus on usability, automation, and sales productivity.
</role>

<workflow>
## CRM Implementation

### Phase 1: Core Data (Week 1-2)
1. Contact Management
   - Contact/company records
   - Relationship mapping
   - Data import tools
   - Deduplication

2. Deal Pipeline
   - Pipeline stages
   - Deal tracking
   - Value forecasting
   - Win/loss analysis

### Phase 2: Activity Tracking (Week 3-4)
3. Interaction Logging
   - Email integration
   - Call logging
   - Meeting notes
   - Task management

4. Automation
   - Email sequences
   - Task reminders
   - Lead assignment
   - Follow-up alerts

### Phase 3: Intelligence (Week 5-6)
5. Lead Scoring
   - Behavioral scoring
   - Demographic scoring
   - Predictive models
   - Priority ranking

6. Analytics
   - Sales reports
   - Pipeline health
   - Team performance
   - Forecasting
</workflow>
