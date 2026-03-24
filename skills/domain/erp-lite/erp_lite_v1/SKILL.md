---
name: ERP-Lite System
description: Lightweight ERP with procurement, inventory, accounting, HR for SMBs
version: 1.0.0
tags: [erp, business, accounting, inventory, hr]
category: domain
domain_type: erp
triggers:
  keywords: [erp, enterprise resource planning, business management, smb, procurement]
  projectArchetypes: [erp-lite, business-management, smb-operations]
  constraints: [multi-department, approval-workflows, financial-reporting]
prerequisites:
  - accounting_basics
  - inventory_management_basics
  - rbac_basics
key_workflows:
  - name: Procurement
    steps:
      - Purchase requisition creation
      - Approval workflow (manager → finance)
      - Purchase order creation and sending to vendor
      - Goods receipt and inspection
      - Three-way matching (PO, receipt, invoice)
      - Payment processing
    entities: [PurchaseRequisition, PurchaseOrder, Vendor, GoodsReceipt, Invoice, Payment]
  - name: Inventory Management
    steps:
      - Stock tracking with SKU/barcode
      - Warehouse and bin location management
      - Stock transfers between locations
      - Cycle counting and adjustments
      - Reorder point alerts
      - FIFO/LIFO cost calculation
    entities: [StockItem, Warehouse, BinLocation, StockTransfer, ReorderPoint, StockAdjustment]
  - name: Accounting
    steps:
      - General ledger setup and chart of accounts
      - Journal entry creation and posting
      - Accounts payable processing
      - Accounts receivable and invoicing
      - Bank reconciliation
      - Financial statement generation (P&L, Balance Sheet, Cash Flow)
    entities: [GLAccount, JournalEntry, Invoice, Payment, BankStatement, FinancialReport]
  - name: HR Management
    steps:
      - Employee record creation and onboarding
      - Attendance tracking (clock in/out)
      - Leave request and approval
      - Payroll calculation and processing
      - Performance review cycles
      - Offboarding and exit process
    entities: [Employee, Attendance, LeaveRequest, Payroll, PerformanceReview, Department]
  - name: Reporting and Analytics
    steps:
      - Financial statements (monthly/quarterly)
      - Inventory reports (valuation, turnover)
      - Sales analysis and trends
      - HR metrics (headcount, turnover)
      - Executive dashboard with KPIs
      - Custom report builder
    entities: [Report, Dashboard, KPI, Chart, Export]
compliance_requirements:
  - Audit trails for all financial transactions
  - Data retention policies (7+ years for financial data)
  - SOX compliance (if publicly traded)
  - GDPR for employee and customer data
  - Tax compliance (sales tax, payroll tax)
  - GAAP/IFRS accounting standards
data_model_patterns:
  - Double-entry bookkeeping (debits = credits)
  - Approval workflows for purchases and expenses
  - Period closing (monthly/quarterly/yearly)
  - Multi-department support with cost centers
  - Fiscal year configuration
  - Currency support for multi-national operations
integration_points:
  - Banking APIs for automatic reconciliation
  - Tax authorities for VAT/GST filing
  - Payroll providers for tax calculations
  - E-commerce platforms for order sync
  - CRM for customer data
  - BI tools for advanced analytics
scaling_considerations: |
  ERP scaling strategies:

  1. **Multi-Tenancy for SaaS ERP**:
     - Database per tenant or schema isolation
     - Tenant configuration and customization
     - Usage-based billing

  2. **Role-Based Access Control**:
     - Granular permissions by module
     - Department-level data isolation
     - Audit log for all access

  3. **Period Performance**:
     - Archive closed periods to read-only storage
     - Partition tables by fiscal period
     - Optimize for current period queries

  4. **Report Generation**:
     - Async report generation for large datasets
     - Cached report results
     - Incremental calculation for dashboards

  5. **Integration Queue**:
     - Async sync with external systems
     - Retry logic for failed integrations
     - Data transformation pipelines
when_not_to_use: |
  ERP-Lite may not be suitable for:

  1. **Large Enterprises Needing Full SAP/Oracle**:
     - Complex multi-national requirements
     - Industry-specific modules (oil & gas, pharmaceuticals)
     - Consider enterprise ERP solutions

  2. **Single-Function Needs**:
     - Just accounting → Use QuickBooks/Xero
     - Just inventory → Use dedicated WMS
     - Just HR → Use HRIS platforms

  3. **Startups Without Complex Operations**:
     - Simple business model
     - Fewer than 10 employees
     - Consider lighter tools (Spreadsheet + accounting software)

  4. **Project-Based Businesses**:
     - Need project accounting and billing
     - Consider PSA (Professional Services Automation)
output_template: |
  ## ERP-Lite System Decision

  **Domain:** ERP-Lite
  **Version:** 1.0.0
  **Rationale:** [Why ERP-Lite was chosen]

  **Key Workflows:**
  - Procurement
  - Inventory Management
  - Accounting
  - HR Management
  - Reporting and Analytics

  **Compliance:**
  - Audit trails for all transactions
  - Data retention (7+ years)
  - GAAP/IFRS accounting standards

  **Integrations:**
  - Banking: [Bank API for reconciliation]
  - Tax: [Tax authority integration]
  - Payroll: [Payroll provider]

  **Scaling Plan:**
  - Multi-tenant architecture (if SaaS)
  - Role-based access control
  - Period archiving strategy
dependencies:
  - accounting_basics
  - double_entry_bookkeeping
  - rbac_basics
  - approval_workflow_pattern
---

<role>
You are an expert in ERP system design with deep experience in SMB operations, financial management, and business process automation.
You help teams build integrated business management systems that streamline operations while maintaining compliance.
</role>

<execution_flow>
## Step 1: Assess Business Requirements
- Identify core modules needed (procurement, inventory, accounting, HR)
- Understand compliance and reporting requirements
- Determine integration needs (banks, tax authorities)
- Assess user roles and permission requirements

## Step 2: Design Core Data Model
- Define chart of accounts structure
- Design procurement workflow entities
- Plan inventory tracking approach
- Establish employee and department model

## Step 3: Implement Financial Core
- Build general ledger with double-entry bookkeeping
- Implement accounts payable/receivable
- Create financial reporting engine
- Add bank reconciliation features

## Step 4: Build Operational Modules
- Implement procurement with approval workflows
- Develop inventory management with tracking
- Create HR module with payroll integration
- Build reporting and dashboard system

## Step 5: Implement Compliance and Controls
- Add audit trail logging
- Implement period closing controls
- Configure role-based permissions
- Set up data retention policies
</execution_flow>

<best_practices_detail>
### Double-Entry Bookkeeping

```javascript
// Every transaction has equal debits and credits
{
  journalEntryId: "je_123",
  date: "2026-03-21",
  description: "Office supplies purchase",
  lines: [
    { accountId: "acc_supplies", accountName: "Office Supplies", debit: 500.00, credit: 0 },
    { accountId: "acc_cash", accountName: "Cash", debit: 0, credit: 500.00 }
  ],
  totalDebit: 500.00,
  totalCredit: 500.00,
  balanced: true, // Must always be true
  posted: true,
  postedAt: "2026-03-21T10:00:00Z"
}

// Validation: debits must equal credits
function validateJournalEntry(entry) {
  const debitSum = entry.lines.reduce((sum, line) => sum + line.debit, 0);
  const creditSum = entry.lines.reduce((sum, line) => sum + line.credit, 0);
  return Math.abs(debitSum - creditSum) < 0.01;
}
```

### Approval Workflows

```javascript
// Multi-level approval for purchases
{
  requisitionId: "pr_456",
  requester: { id: "emp_123", name: "John Doe" },
  amount: 5000.00,
  approvalWorkflow: {
    levels: [
      { level: 1, approver: "manager_abc", status: "approved", approvedAt: "2026-03-20T14:00:00Z" },
      { level: 2, approver: "finance_xyz", status: "pending" }
    ],
    currentLevel: 2,
    rules: {
      under1000: ["manager"],
      under5000: ["manager", "finance"],
      over5000: ["manager", "finance", "cfo"]
    }
  }
}
```

### Period Closing

```javascript
// Prevent modifications to closed periods
{
  fiscalPeriod: {
    id: "period_2026_02",
    year: 2026,
    month: 2,
    startDate: "2026-02-01",
    endDate: "2026-02-28",
    status: "closed", // open, soft_closed, closed
    closedAt: "2026-03-05T09:00:00Z",
    closedBy: "acc_manager"
  }
}

// Validate before posting journal entry
function canPostToPeriod(date, periodStatus) {
  if (periodStatus === 'closed') {
    throw new Error('Cannot post to closed period');
  }
  return true;
}
```

### Audit Trail

```javascript
// Log all financial transactions
{
  auditLog: {
    entityId: "je_123",
    entityType: "JournalEntry",
    action: "UPDATE",
    userId: "acc_clerk",
    timestamp: "2026-03-21T10:00:00Z",
    changes: {
      description: { old: "Office supplies", new: "Office supplies - Q1" }
    },
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0..."
  }
}
```
</best_practices_detail>

<anti_patterns_detail>
### Violating Double-Entry Rules

**Problem:** Allowing unbalanced journal entries

```javascript
// BAD: Allowing unbalanced entries
await JournalEntry.create({
  lines: [
    { accountId: "acc_supplies", debit: 500, credit: 0 }
    // Missing credit line - books won't balance!
  ]
});

// GOOD: Enforce balance before saving
const entry = new JournalEntry({ lines: [...] });
if (!entry.isBalanced()) {
  throw new Error('Journal entry must balance (debits = credits)');
}
await entry.save();
```

### Modifying Closed Periods

**Problem:** Allowing changes to historical financial data

```javascript
// BAD: Allowing edits to closed period
await JournalEntry.update({ id: "je_123", date: "2026-02-15" }, {
  description: "Updated description"
});
// This changes February data after period was closed!

// GOOD: Require reversing entry for closed periods
const originalEntry = await JournalEntry.findById("je_123");
if (isPeriodClosed(originalEntry.date)) {
  // Create reversing entry in current period
  await JournalEntry.create({
    date: "2026-03-21", // Current period
    lines: originalEntry.lines.map(line => ({
      accountId: line.accountId,
      debit: line.credit, // Reverse
      credit: line.debit
    })),
    description: `Reversing entry for ${originalEntry.id}`
  });
}
```

### No Segregation of Duties

**Problem:** Same person can create and approve transactions

```javascript
// BAD: No separation of duties
{
  permissions: {
    accountant: ["create_journal_entry", "approve_journal_entry", "post_to_gl"]
    // Same user can create, approve, and post - fraud risk!
  }
}

// GOOD: Segregate duties
{
  permissions: {
    clerk: ["create_journal_entry"],
    manager: ["approve_journal_entry"],
    accountant: ["post_to_gl"]
  }
}
```
</anti_patterns_detail>

<scaling_notes_detail>
### Multi-Tenant SaaS ERP

1. **Database Isolation Strategies**
   ```javascript
   // Option 1: Database per tenant
   // Best for: High isolation, compliance requirements
   const tenantDb = getTenantDatabase(tenantId);
   await tenantDb.query('SELECT * FROM journal_entries');

   // Option 2: Schema per tenant
   // Best for: Balance of isolation and manageability
   await db.query(`SELECT * FROM ${tenantId}.journal_entries`);

   // Option 3: Shared tables with tenant_id
   // Best for: Cost efficiency, simpler operations
   await db.query('SELECT * FROM journal_entries WHERE tenant_id = ?', [tenantId]);
   ```

2. **Report Caching**
   ```javascript
   // Cache expensive financial reports
   async function getFinancialReport(tenantId, period) {
     const cacheKey = `report:${tenantId}:${period}`;
     const cached = await redis.get(cacheKey);
     if (cached) return JSON.parse(cached);

     const report = await generateFinancialReport(tenantId, period);
     await redis.setex(cacheKey, 3600, JSON.stringify(report)); // 1 hour
     return report;
   }
   ```

3. **Period Archiving**
   ```javascript
   // Move closed periods to archive storage
   async function archivePeriod(tenantId, periodId) {
     // Export to cold storage (S3 Glacier, etc.)
     const data = await db.query('SELECT * FROM transactions WHERE period_id = ?', [periodId]);
     await archiveStorage.put(`tenant/${tenantId}/period/${periodId}.json`, JSON.stringify(data));
     
     // Delete from hot storage, keep summary
     await db.delete('transactions').where({ period_id: periodId });
     await db.insert('period_summaries', { period_id: periodId, summary: calculateSummary(data) });
   }
   ```
</scaling_notes_detail>
