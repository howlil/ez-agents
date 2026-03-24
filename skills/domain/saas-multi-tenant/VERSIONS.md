# SaaS Multi-Tenant Skill Versions

## v1.0.0 (2026-03-24)

**Initial Release**

**Added:**
- Multi-tenant architecture patterns (shared-schema, separate-schema, separate-db)
- Tenant isolation strategies with Row-Level Security
- Subscription management with Stripe/Paddle
- Usage-based billing patterns
- Feature gating by plan tier
- Tenant onboarding automation
- Dunning management for failed payments
- SaaS metrics tracking (MRR, churn, LTV)

**Tags:** saas, multi-tenant, subscription, tenant-isolation, B2B, billing

**Dependencies:** Stripe SDK, PostgreSQL with RLS, Redis

**Migration Guide:** N/A (initial release)
