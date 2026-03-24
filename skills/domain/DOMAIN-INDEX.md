# Domain/Project-Type Skills

## Overview

Domain skills encode domain-specific workflows, constraints, and patterns that differ from generic architecture skills. Each skill provides guidance on business workflows, compliance requirements, data model patterns, and integration points for common project types.

Domain skills are activated by the SkillMatcher based on:
- Project archetype detected by CTXE-06
- User-specified domain type
- Keywords in project requirements

## Available Domain Skills

| Domain | Directory | Key Workflows | Compliance |
|--------|-----------|---------------|------------|
| **POS Multi-Branch** | `pos-multi-branch/pos_multi_branch_v1/` | Sales Transaction, Inventory Sync, Branch Reconciliation | PCI-DSS, Tax compliance |
| **E-Commerce** | `e-commerce/ecommerce_v1/` | Product Catalog, Cart, Checkout, Order Fulfillment, Returns | PCI-DSS, GDPR, Sales tax |
| **ERP-Lite** | `erp-lite/erp_lite_v1/` | Procurement, Inventory, Accounting, HR, Reporting | Audit trails, SOX, GDPR |
| **CMS** | `cms/cms_v1/` | Content Creation, Review, Publishing, Versioning | SEO, WCAG, GDPR |
| **LMS** | `lms/lms_v1/` | Course Creation, Enrollment, Progress Tracking, Assessments | SCORM, FERPA, WCAG |
| **Booking System** | `booking-system/booking_system_v1/` | Availability Checking, Reservation, Payment, Confirmation | GDPR, Payment compliance |
| **Medical Records** | `medical-records/medical_records_v1/` | Patient Intake, Diagnosis, Treatment, Billing | HIPAA, Data retention |
| **Fintech Workflow** | `fintech-workflow/fintech_workflow_v1/` | Transaction Processing, Reconciliation, Reporting, Compliance | PCI-DSS, AML, KYC |
| **Inventory System** | `inventory-system/inventory_system_v1/` | Stock Tracking, Reorder Points, Warehouse Management | Varies by industry |
| **Dashboard Admin** | `dashboard-admin/dashboard_admin_v1/` | Data Visualization, Role-based Views, Widgets, Alerts | RBAC, Data privacy |
| **SaaS** | `saas/saas_v1/` | Tenant Onboarding, Subscription Management, Billing, Usage Tracking | GDPR, SOC2, SLA |

## Archetype Mapping (CTXE-06 Integration)

| Project Archetype | Domain Skill |
|-------------------|--------------|
| `pos-multi-branch` | POS Multi-Branch Operations |
| `retail-system` | POS Multi-Branch Operations |
| `ecommerce` | E-Commerce Platform |
| `online-retail` | E-Commerce Platform |
| `erp-lite` | ERP-Lite System |
| `business-management` | ERP-Lite System |
| `cms` | Content Management System |
| `content-platform` | Content Management System |
| `lms` | Learning Management System |
| `education-platform` | Learning Management System |
| `booking-system` | Booking and Reservation System |
| `appointment-scheduler` | Booking and Reservation System |
| `medical-records` | Medical Records System (EMR) |
| `healthcare-system` | Medical Records System (EMR) |
| `fintech` | Fintech Workflow |
| `financial-services` | Fintech Workflow |
| `inventory-system` | Inventory System |
| `warehouse-management` | Inventory System |
| `dashboard` | Dashboard Admin |
| `admin-platform` | Dashboard Admin |
| `saas` | SaaS Platform |
| `multi-tenant` | SaaS Platform |

## Usage Examples

### Using SkillRegistry

```javascript
const { SkillRegistry } = require('./ez-agents/bin/lib/skill-registry');
const registry = new SkillRegistry();
await registry.load();

// Get all domain skills
const domainSkills = registry.findByCategory('domain');

// Get specific domain skill
const posSkill = registry.get('pos_multi_branch_v1');

// Search by domain keyword
const retailSkills = registry.search('retail');
```

### Using SkillMatcher with Project Archetype

```javascript
const { SkillMatcher } = require('./ez-agents/bin/lib/skill-matcher');
const matcher = new SkillMatcher(registry);

// Match skills based on project archetype
const context = {
  projectArchetype: 'pos-multi-branch',
  teamSize: 'medium',
  compliance: 'PCI-DSS'
};

const matchedSkills = matcher.match(context);
// Returns: pos_multi_branch_v1, rbac_authorization_v1, etc.
```

## Domain Skill Structure

Each domain skill includes:

- **Key Workflows**: Step-by-step workflows with entities
- **Compliance Requirements**: Regulatory and industry requirements
- **Data Model Patterns**: Typical entity relationships
- **Integration Points**: Common third-party integrations
- **Scaling Considerations**: Domain-specific scaling challenges
- **When Not to Use**: Anti-indications for the domain pattern

## Version History

- **v1.0.0** (2026-03-21): Initial domain skills created in Phase 36
