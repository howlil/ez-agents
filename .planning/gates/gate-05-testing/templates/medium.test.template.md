# Medium Test Strategy Template

**Archetype:** Medium (Production Ready)
**Coverage Target:** 80% lines, 60% branches, 70% functions

## Test Strategy

For production-ready projects, implement comprehensive unit and integration tests. Cover all business logic, API endpoints, and database interactions.

### Test Types Required
- ✅ Unit tests for all business logic
- ✅ Integration tests for APIs and databases
- ❌ E2E tests (optional)
- ❌ Visual regression (deferred)

## Coverage Targets

| Metric | Target | Current | Gap |
|--------|--------|---------|-----|
| Lines | 80% | — | — |
| Branches | 60% | — | — |
| Functions | 70% | — | — |

## Test Files

### Required
- `src/**/*.test.cjs` - Unit tests for all source files
- `tests/integration/**/*.test.cjs` - Integration tests

### Optional
- `tests/e2e/**/*.test.cjs` - E2E tests (Playwright)

## Example Test Structure

### Unit Test
```javascript
// src/services/user.service.test.cjs
const { strict: assert } = require('assert');
const { UserService } = require('../services/user.service');

describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      const user = await UserService.createUser({
        email: 'test@example.com',
        name: 'Test User'
      });
      assert.ok(user.id);
      assert.strictEqual(user.email, 'test@example.com');
    });
    
    it('should reject duplicate email', async () => {
      await UserService.createUser({ email: 'test@example.com', name: 'Test' });
      await assert.rejects(
        () => UserService.createUser({ email: 'test@example.com', name: 'Test2' })
      );
    });
  });
});
```

### Integration Test
```javascript
// tests/integration/api/users.test.cjs
const { strict: assert } = require('assert');
const request = require('supertest');
const { app } = require('../../../src/app');

describe('POST /api/users', () => {
  it('should create user and return 201', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ email: 'test@example.com', name: 'Test' });
    
    assert.strictEqual(res.status, 201);
    assert.ok(res.body.id);
  });
});
```

## Setup

```bash
# Install dependencies
npm install -D vitest @playwright/test supertest

# Add to package.json
{
  "scripts": {
    "test": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:integration": "vitest run tests/integration"
  }
}
```

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run integration tests only
npm run test:integration
```

## Gate 5 Validation

```bash
node .planning/gates/gate-05-testing/validator.cjs validate . medium
```
