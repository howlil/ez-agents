# Skill Validation Rules

**Version:** 1.0  
**Purpose:** Define validation rules for skill best practices and anti-patterns  
**Reference:** `bin/lib/skill-consistency-validator.cjs`

---

## Validation Rule Format

Each skill has:
- **Best Practices** — Must-have patterns (warning if missing)
- **Anti-Patterns** — Must-not-have patterns (error if detected)

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
- ❌ ERROR: Business logic in `routes/web.php`
- ❌ ERROR: Direct `DB::query()` calls in controllers
- ⚠️ WARNING: Fat controllers (>200 lines)

---

### nextjs_app_router_skill

**Best Practices:**
- Server Components for data fetching
- Client Components for interactivity
- Route Handlers for API endpoints
- Proper use of `use client` directive

**Anti-Patterns:**
- ❌ ERROR: Using `getServerSideProps` with App Router
- ⚠️ WARNING: Client Components where Server would suffice

---

### express_js_architecture_skill

**Best Practices:**
- Middleware pattern for cross-cutting concerns
- Router modularization
- Error handling middleware
- Async/await for async operations

**Anti-Patterns:**
- ❌ ERROR: Callback hell in route handlers
- ⚠️ WARNING: Monolithic route files (>500 lines)

---

## Architecture Skills

### authentication_jwt_skill

**Best Practices:**
- Password hashing with bcrypt/argon2
- Token expiration configured
- Refresh token rotation
- Rate limiting on auth endpoints

**Anti-Patterns:**
- ❌ ERROR: Hardcoded secrets in code
- ❌ ERROR: Tokens stored in localStorage
- ⚠️ WARNING: Missing rate limiting on auth endpoints

---

### repository_pattern_skill

**Best Practices:**
- Interface abstraction for repositories
- Single responsibility per repository
- Dependency injection for repository usage

**Anti-Patterns:**
- ❌ ERROR: Direct database access in controllers
- ⚠️ WARNING: Repository doing business logic

---

### microservices_architecture_skill

**Best Practices:**
- Service isolation with bounded contexts
- API gateway for external access
- Inter-service communication via RPC or message queue

**Anti-Patterns:**
- ❌ ERROR: Shared databases between services
- ❌ ERROR: Tight coupling between services
- ⚠️ WARNING: Synchronous calls for non-critical paths

---

### caching_strategy_skill

**Best Practices:**
- Multi-level caching (L1, L2)
- Cache invalidation strategy
- Cache-aside or write-through patterns

**Anti-Patterns:**
- ❌ ERROR: No cache invalidation
- ⚠️ WARNING: Caching without TTL

---

## Domain Skills

### ecommerce_product_catalog_skill

**Best Practices:**
- Product variant support
- Category hierarchy
- Search indexing
- Inventory tracking

**Anti-Patterns:**
- ❌ ERROR: Hardcoded product data
- ⚠️ WARNING: No image optimization

---

### saas_multi_tenant_skill

**Best Practices:**
- Tenant isolation (schema or row-level)
- Tenant context in all queries
- Tenant-specific configuration

**Anti-Patterns:**
- ❌ ERROR: Cross-tenant data access
- ❌ ERROR: Missing tenant validation

---

### payment_processing_skill

**Best Practices:**
- PCI DSS compliance
- Idempotent payment operations
- Payment webhook handling
- Retry logic with exponential backoff

**Anti-Patterns:**
- ❌ ERROR: Storing raw card numbers
- ❌ ERROR: Non-idempotent payment endpoints

---

## Testing Skills

### testing_strategy_skill

**Best Practices:**
- Test pyramid (70% unit, 20% integration, 10% E2E)
- Test isolation
- Descriptive test names
- Arrange-Act-Assert pattern

**Anti-Patterns:**
- ⚠️ WARNING: Only E2E tests (no unit tests)
- ⚠️ WARNING: Tests with interdependencies

---

### testing_playwright_skill

**Best Practices:**
- Page Object Model
- Test parallelization
- Screenshot on failure
- Proper wait strategies

**Anti-Patterns:**
- ❌ ERROR: Hardcoded waits (`setTimeout`)
- ⚠️ WARNING: Brittle selectors

---

## DevOps Skills

### docker_containerization_skill

**Best Practices:**
- Multi-stage builds
- Non-root user
- Minimal base images
- Health checks

**Anti-Patterns:**
- ❌ ERROR: Running as root
- ⚠️ WARNING: Large image size (>500MB)

---

### kubernetes_orchestration_skill

**Best Practices:**
- Resource limits and requests
- Liveness and readiness probes
- Horizontal Pod Autoscaler
- ConfigMaps for configuration

**Anti-Patterns:**
- ❌ ERROR: No resource limits
- ❌ ERROR: Hardcoded configuration in manifests

---

## Documentation

### How Rules Are Applied

1. **Best Practice Check:** If output doesn't match pattern → WARNING
2. **Anti-Pattern Detection:** If output contains anti-pattern → ERROR
3. **Severity Assignment:**
   - ERROR: Blocks handoff, must be fixed
   - WARNING: Logged, allows handoff
   - INFO: Suggestion for improvement

### Example Validation

```javascript
const validator = require('./skill-consistency-validator.cjs');

const output = `
## Implementation

Created UserController in app/Http/Controllers/
Using Eloquent models in app/Models/
`;

const result = validator.validateOutput(output, ['laravel_11_structure_skill_v2']);
// result.valid = true (no anti-patterns detected)
// result.warnings = 3 (missing Services, Repositories, API routes)
```
