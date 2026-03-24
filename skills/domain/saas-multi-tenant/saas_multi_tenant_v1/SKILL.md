---
name: saas_multi_tenant_v1
description: Multi-tenant SaaS architecture with tenant isolation, subscription management, and scaling patterns
version: 1.0.0
tags: [saas, multi-tenant, subscription, tenant-isolation, B2B, billing]
category: domain
triggers:
  keywords: [saas, multi-tenant, subscription, tenant, B2B, recurring billing]
  filePatterns: [subscription.model, tenant.model, billing.service]
  commands: [stripe, paddle, recurring payment]
  projectArchetypes: [saas, B2B-platform, subscription-service]
  modes: [greenfield, scale-up]
prerequisites:
  - web_application_fundamentals
  - database_design_basics
  - authentication_authorization_basics
recommended_structure:
  directories:
    - src/tenants/
    - src/subscriptions/
    - src/billing/
    - src/features/
    - src/middleware/tenant-middleware.ts
workflow:
  setup:
    - Choose tenant isolation strategy
    - Setup subscription provider (Stripe/Paddle)
    - Implement tenant provisioning
    - Create onboarding flow
  generate:
    - npx stripe products create (for plans)
    - Tenant seeding scripts
  test:
    - Multi-tenant isolation tests
    - Subscription lifecycle tests
    - Billing webhook tests
best_practices:
  - Use tenant_id in all database queries (RLS if possible)
  - Implement proper tenant isolation at API gateway level
  - Use Stripe Customer objects for tenant billing
  - Store tenant configuration separately from data
  - Implement usage tracking for metered billing
  - Create tenant admin dashboard for self-service
  - Use feature flags for plan-based feature gating
  - Implement soft deletes for tenant data recovery
  - Log all tenant-scoped actions for audit
  - Use connection pooling with tenant-aware routing
anti_patterns:
  - Never share tenant data across boundaries
  - Don't hardcode tenant-specific logic in business layer
  - Avoid tenant database per customer for small SaaS (overhead)
  - Don't skip webhook signature verification
  - Never store payment details directly (use Stripe Elements)
  - Avoid complex custom billing logic (use provider SDK)
  - Don't forget to handle subscription downgrades
  - Never assume single tenant context per request
  - Don't skip tenant quota enforcement
  - Avoid manual tenant provisioning (automate everything)
scaling_notes: |
  SaaS Scaling Strategies:

  Tenant Isolation Levels:
  1. Shared DB, Shared Schema (cheapest, <100 tenants)
     - tenant_id column in all tables
     - Row-Level Security (RLS) recommended

  2. Shared DB, Separate Schema (medium, 100-1000 tenants)
     - Schema per tenant
     - Better isolation, more complex migrations

  3. Separate DB per Tenant (expensive, enterprise)
     - Full isolation
     - Compliance-friendly (HIPAA, SOC2)

  Billing Scale:
  - Use Stripe Billing for complex subscriptions
  - Implement usage-based billing with Stripe Metered
  - Cache subscription status to reduce API calls

  Onboarding Scale:
  - Automated tenant provisioning (< 5 minutes)
  - Self-service plan upgrades/downgrades
  - Template-based tenant initialization
when_not_to_use: |
  Multi-tenant SaaS may not be ideal for:

  1. Single-Customer Enterprise App
     - Build single-tenant instead
     - Simpler architecture, lower cost

  2. Marketplace Platform
     - Two-sided marketplace needs different model
     - Use marketplace_pattern skill instead

  3. Open Source SaaS
     - Consider open-core model
     - Self-hosted option for enterprise

  4. Highly Regulated Industries
     - HIPAA, finance may require single-tenant
     - Compliance overhead increases with multi-tenant
output_template: |
  ## SaaS Multi-Tenant Architecture Decision

  Isolation Strategy: {shared-schema | separate-schema | separate-db}
  Subscription Provider: {Stripe | Paddle | Lemonsqueezy}
  Tenant Count Target: {N} tenants

  Tenant Model Fields:
    - id: uuid
    - subdomain: string
    - plan: free|pro|enterprise
    - subscription_id: string
    - created_at: timestamp

  Subscription Tiers:
    - Free: 0 USD, basic features
    - Pro: 29 USD/mo, advanced features
    - Enterprise: Custom, all features

  When to Reconsider:
    - Tenant count > 10,000 (rethink isolation)
    - Enterprise customers demand dedicated infra
    - Compliance requires data residency
dependencies:
  - stripe: "^14.0" or equivalent
  - database: "PostgreSQL with RLS support"
  - redis: "For caching subscription status"
---

<role>
You are a SaaS Architect specializing in multi-tenant architecture and subscription business models.
You have built 10+ successful SaaS products from MVP to 10M ARR.
You provide practical guidance on tenant isolation, subscription management, and scaling strategies.

Your philosophy: "Start shared, scale to dedicated" - begin with cost-effective shared infrastructure,
evolve to dedicated options as customers grow and compliance requires.
</role>

<workflow>
## SaaS Multi-Tenant Implementation

### Phase 1: Foundation (Week 1-2)
1. Choose Tenant Isolation
   - Shared schema for MVP (fastest, cheapest)
   - Plan for migration to separate schema later
   - Implement tenant_id in all models from day 1

2. Setup Subscription Provider
   - stripe products create --name="Pro Plan"
   - stripe prices create --product=prod_xxx --unit-amount=2900

3. Implement Tenant Model
   - id: uuid
   - subdomain: string
   - plan: free|pro|enterprise
   - stripeCustomerId: string (optional)
   - settings: JSON

### Phase 2: Core Features (Week 3-4)
4. Tenant Provisioning
   - Self-service signup flow
   - Subdomain or custom domain setup
   - Initial data seeding
   - Welcome email sequence

5. Subscription Management
   - Plan selection UI
   - Payment method collection (Stripe Elements)
   - Webhook handling for payment events
   - Dunning management for failed payments

6. Feature Gating
   - Feature flags per plan
   - Usage quota enforcement
   - Upgrade prompts at limits

### Phase 3: Growth (Month 2-3)
7. Analytics and Metrics
   - MRR (Monthly Recurring Revenue)
   - Churn rate tracking
   - Usage analytics per tenant
   - Cohort analysis

8. Self-Service Admin
   - Tenant admin dashboard
   - Plan upgrades/downgrades
   - Billing history
   - Team member management

9. Scaling Preparation
   - Database query optimization
   - Caching strategy (Redis)
   - Background job processing
   - Rate limiting per tenant
</workflow>

<integration_points>
## Command Integration

### new-project.md
Activated when project archetype is "saas" or "B2B platform"
Provides: Tenant isolation strategy, subscription provider selection

### plan-phase.md
Activated for subscription-related features
Provides: Billing workflow, webhook handling, dunning management

### verify-work.md
Security audit includes:
- Tenant isolation verification
- Payment security (PCI-DSS)
- Webhook signature verification
</integration_points>

<example_scenarios>
## Example SaaS Scenarios

### Scenario 1: B2B Project Management Tool
Context: Competing with Asana/Monday.com, targeting SMBs
Decision: Shared schema, Stripe Billing
Why: Fast time-to-market, low infrastructure cost
Stack:
  - Next.js + PostgreSQL (Supabase with RLS)
  - Stripe for subscriptions
  - Resend for tenant emails
  - Cost: ~100 USD/month for first 1000 tenants

### Scenario 2: Healthcare Analytics SaaS
Context: HIPAA compliance required, enterprise customers
Decision: Separate database per tenant
Why: Compliance requirement, data isolation
Stack:
  - AWS RDS per customer
  - Terraform for provisioning
  - Higher cost justified by compliance

### Scenario 3: Developer Tools SaaS
Context: API-first product, usage-based billing
Decision: Shared schema + usage tracking
Why: Metered billing aligns with value
Stack:
  - Stripe Metered Billing
  - Redis for usage counting
  - PostgreSQL for persistence
</example_scenarios>

<pricing_models>
## Common SaaS Pricing Models

### Per-Seat Pricing
- Charge per user per month
- Example: 29 USD/user/month
- Best for: Collaboration tools

### Usage-Based Pricing
- Charge per API call, GB stored, etc.
- Example: 0.01 USD per 1000 API calls
- Best for: Developer tools, infrastructure

### Tiered Pricing
- Free, Pro, Enterprise tiers
- Feature gating between tiers
- Best for: Most B2B SaaS

### Flat-Rate Pricing
- Single price, all features
- Example: 99 USD/month unlimited
- Best for: Simple products, niche markets

### Freemium Model
- Free tier with limits
- Paid upgrade for more
- Best for: PLG (Product-Led Growth)
</pricing_models>
