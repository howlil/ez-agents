# Skill Validation Rules

**Phase:** 39
**Plan:** 39-04
**Requirement:** POOL-04

This document defines validation rules for each skill in the Phase 35 Skill Registry. Each skill has:
- **Best Practices** (must have) — Output should follow these practices
- **Anti-Patterns** (must not have) — Output should avoid these patterns

---

## Validation Severity Levels

| Severity | Impact | Action |
|----------|--------|--------|
| **error** | Critical violation | Blocks handoff, requires fix |
| **warning** | Best practice deviation | Logged, allows handoff |
| **info** | Suggestion | Improvement recommendation |

---

## Stack Skills

### laravel_11_structure_skill_v2

**Best Practices:**
- `app/Models/` directory for Eloquent models
- `app/Http/Controllers/` for controllers
- `routes/api.php` for API routes
- Service classes in `app/Services/`
- Repository pattern in `app/Repositories/`

**Anti-Patterns:**
- Business logic in `routes/web.php`
- Direct `DB::query()` calls in controllers
- Fat controllers (>200 lines)
- N+1 queries without eager loading

---

### nextjs_app_router_skill

**Best Practices:**
- `app/` directory structure for routes
- Server Components by default
- `use client` directive for client components
- Loading states with `loading.tsx`
- Error boundaries with `error.tsx`

**Anti-Patterns:**
- `useState` in Server Components
- Direct database calls in client components
- Missing loading states
- `window`/`document` access in Server Components

---

### react_architecture_skill

**Best Practices:**
- Component composition over inheritance
- Custom hooks for reusable logic
- Prop drilling avoidance (Context or state management)
- Keys on list items

**Anti-Patterns:**
- Direct DOM manipulation
- `setState` in render
- Missing keys in lists
- Props mutation

---

## Architecture Skills

### modular_monolith_skill

**Best Practices:**
- Module boundaries clearly defined
- Inter-module communication via interfaces
- Shared kernel for common types
- Module per business capability

**Anti-Patterns:**
- Circular dependencies between modules
- Direct imports across module boundaries
- Shared database tables between modules
- God modules (>5000 lines)

---

### microservices_architecture_skill

**Best Practices:**
- Service per business capability
- Database per service
- API Gateway for external communication
- Event-driven communication between services

**Anti-Patterns:**
- Distributed monolith (tight coupling)
- Shared database between services
- Synchronous calls in critical paths
- Missing circuit breakers

---

### repository_pattern_skill

**Best Practices:**
- Interface for repository contract
- Entity aggregation in repository
- Unit of Work for transactions
- Specification pattern for complex queries

**Anti-Patterns:**
- Leaking ORM specifics through interface
- Multiple repositories per entity
- Business logic in repository
- Direct ORM usage outside repository

---

### service_layer_pattern_skill

**Best Practices:**
- Business logic in service layer
- Transaction management in services
- Domain events from services
- Dependency injection for dependencies

**Anti-Patterns:**
- Direct controller to repository calls
- Multiple services modifying same entity
- Circular service dependencies
- God services (>1000 lines)

---

### component_composition_skill

**Best Practices:**
- Small, focused components
- Composition via children prop
- Render props for flexibility
- Compound components for complex UIs

**Anti-Patterns:**
- Large components (>300 lines)
- Multiple responsibilities per component
- Deep nesting (>5 levels)
- Prop drilling through multiple levels

---

### state_management_skill

**Best Practices:**
- Single source of truth
- Immutable state updates
- Derived state computed, not stored
- Normalize nested state

**Anti-Patterns:**
- Duplicate state sources
- Direct state mutation
- Storing derived values
- Excessive state slices

---

## Domain Skills

### authentication_jwt_skill

**Best Practices:**
- Password hashing with bcrypt/argon2
- Token expiration configured
- Refresh token rotation
- Rate limiting on auth endpoints

**Anti-Patterns:**
- Hardcoded secrets
- Tokens in localStorage
- Missing rate limiting
- Synchronous token generation
- JWT without expiration

---

### saas_multi_tenant_skill

**Best Practices:**
- Tenant isolation at database level
- Tenant context in all queries
- Tenant-aware caching
- Row Level Security (RLS) for shared DB

**Anti-Patterns:**
- Missing tenant filter in queries
- Shared cache keys between tenants
- Tenant ID in client-side state only
- Cross-tenant data access

---

### ecommerce_product_catalog_skill

**Best Practices:**
- Product variants support
- Inventory tracking
- Price history tracking
- Category hierarchy

**Anti-Patterns:**
- Hardcoded product types
- Missing inventory checks
- Price without currency
- No soft delete for products

---

### payment_processing_skill

**Best Practices:**
- Idempotent payment operations
- Payment state machine
- Webhook signature verification
- PCI-DSS compliance measures

**Anti-Patterns:**
- Storing raw card numbers
- Missing idempotency keys
- No webhook retry handling
- Synchronous payment processing

---

### dashboard_layout_skill

**Best Practices:**
- Grid-based layout
- Responsive breakpoints
- Widget-based architecture
- Lazy loading for charts

**Anti-Patterns:**
- Fixed pixel widths
- All data loaded upfront
- No loading states
- Non-responsive design

---

## Testing Skills

### testing_strategy_skill

**Best Practices:**
- Test pyramid (70% unit, 20% integration, 10% E2E)
- Test isolation (no shared state)
- Descriptive test names
- Arrange-Act-Assert pattern

**Anti-Patterns:**
- Test interdependencies
- Testing implementation details
- Missing assertions
- Flaky tests

---

### testing_unit_skill

**Best Practices:**
- One assertion per test
- Mock external dependencies
- Test edge cases
- Fast execution (<10ms per test)

**Anti-Patterns:**
- Multiple assertions per test
- Real database calls
- Testing private methods
- Slow tests (>100ms)

---

### testing_integration_skill

**Best Practices:**
- Test API contracts
- Use test database
- Clean up after tests
- Test error scenarios

**Anti-Patterns:**
- Testing against production
- Missing test data cleanup
- No error case testing
- Flaky network dependencies

---

## DevOps Skills

### docker_containerization_skill

**Best Practices:**
- Multi-stage builds
- Non-root user
- `.dockerignore` file
- Specific base image versions

**Anti-Patterns:**
- Running as root
- Using `latest` tag
- Large image size (>500MB)
- Hardcoded secrets in Dockerfile

---

### kubernetes_orchestration_skill

**Best Practices:**
- Resource limits defined
- Health checks (liveness/readiness)
- Pod disruption budgets
- Horizontal Pod Autoscaler

**Anti-Patterns:**
- No resource limits
- Missing health checks
- Single replica deployments
- Hardcoded configuration

---

### cicd_pipeline_architecture_skill

**Best Practices:**
- Pipeline as code
- Parallel test execution
- Artifact versioning
- Deployment gates

**Anti-Patterns:**
- Manual steps in CI
- No test parallelization
- Missing artifact versioning
- Direct production deployments

---

## Governance Skills

### security_architecture_skill

**Best Practices:**
- Input validation on all endpoints
- Output encoding
- Authentication on protected routes
- Authorization checks

**Anti-Patterns:**
- SQL injection vulnerabilities
- XSS vulnerabilities
- Missing authentication
- Hardcoded credentials

---

### accessibility_wcag_skill

**Best Practices:**
- Semantic HTML
- ARIA labels where needed
- Keyboard navigation
- Color contrast compliance (WCAG 2.1 AA)

**Anti-Patterns:**
- Missing alt text
- Non-semantic div soup
- Mouse-only interactions
- Low contrast text

---

### api_rate_limiting_skill

**Best Practices:**
- Rate limit headers (`X-RateLimit-*`)
- Sliding window algorithm
- Different limits per endpoint
- Graceful degradation

**Anti-Patterns:**
- No rate limit headers
- Fixed window (allows bursts)
- Same limit for all endpoints
- Hard failures on limit exceeded

---

## Validation Algorithm

```javascript
for (const skill of activatedSkills) {
  const skillDef = VALIDATION_RULES[skill];

  // Check best practices adherence
  for (const practice of skillDef.best_practices) {
    if (!outputMatchesPractice(output, practice)) {
      violations.push({
        skill: skill,
        type: 'best_practice',
        practice: practice,
        severity: 'warning'
      });
    }
  }

  // Check anti-patterns avoided
  for (const antiPattern of skillDef.anti_patterns) {
    if (outputContainsAntiPattern(output, antiPattern)) {
      violations.push({
        skill: skill,
        type: 'anti_pattern',
        antiPattern: antiPattern,
        severity: 'error'
      });
    }
  }
}
```

---

## Integration with QA Agent

The QA Agent runs skill consistency validation after task completion:

1. **After task completes:** Run `validateOutput(output, activatedSkills)`
2. **If errors found:** Block handoff, require fix
3. **If warnings found:** Log and continue
4. **Include validation report** in agent output

```markdown
### Verification Status
- [ ] Self-check passed
- [ ] Skills alignment verified
- [ ] Skill consistency validation passed
- [ ] Decision log complete
```

---

## Validation Report Format

```markdown
## Skill Consistency Validation Report

**Status:** ✅ PASS / ❌ FAIL
**Skills Validated:** N
**Errors:** N
**Warnings:** N

### Violations

#### Errors
- **skill_id:** Anti-pattern detected: [description]

#### Warnings
- **skill_id:** Output does not follow best practice: [description]
```
