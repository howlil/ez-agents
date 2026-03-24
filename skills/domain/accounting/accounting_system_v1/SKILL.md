---
name: accounting_system_v1
description: Accounting system for financial records, invoicing, expenses, and financial reporting
version: 1.0.0
tags: [accounting, finance, invoicing, expenses, financial-reporting, double-entry]
category: domain
triggers:
  keywords: [accounting, finance, invoice, expense, ledger, double-entry, financial report]
  projectArchetypes: [accounting, fintech, business-management]
prerequisites:
  - accounting_basics
  - security_fundamentals
  - compliance_awareness
workflow:
  setup:
    - Chart of accounts
    - Double-entry system
    - Tax configuration
    - Audit trail setup
  build:
    - Journal entries
    - Invoicing
    - Expense tracking
    - Financial reports
  automate:
    - Recurring invoices
    - Bank reconciliation
    - Tax calculations
best_practices:
  - Use double-entry bookkeeping
  - Maintain complete audit trails
  - Reconcile accounts regularly
  - Automate recurring transactions
  - Generate financial statements
  - Comply with accounting standards
  - Secure financial data
  - Backup data frequently
  - Integrate with banking
  - Provide role-based access
anti_patterns:
  - Never allow negative balances without overdraft
  - Don't skip audit trails
  - Avoid manual calculations
  - Don't ignore tax compliance
  - Never allow backdated entries without approval
  - Don't skip reconciliation
  - Avoid complex chart of accounts
  - Don't ignore multi-currency if needed
scaling_notes: |
  Accounting Scaling:
  - Start with core ledger
  - Add invoicing
  - Implement inventory
  - Add multi-entity support
when_not_to_use: |
  Not for: Personal finance, very small businesses without accounting needs
output_template: |
  ## Accounting System Architecture
  **Method:** Double-entry bookkeeping
  **Modules:** {ledger, AP, AR, reporting}
  **Compliance:** {GAAP, IFRS, local standards}
dependencies:
  - database: "PostgreSQL with ACID compliance"
  - bank_api: "For reconciliation"
---

<role>
Financial Systems Architect specializing in accounting software.
Focus on accuracy, compliance, and auditability.
</role>
