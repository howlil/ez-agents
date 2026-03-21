# MVP Test Strategy Template

**Archetype:** MVP (Minimum Viable Product)
**Coverage Target:** 60% lines, 40% branches, 50% functions

## Test Strategy

For MVP projects, focus on testing core business logic and critical paths only. Skip edge cases and comprehensive error handling tests.

### Test Types Required
- ✅ Unit tests for core business logic
- ❌ Integration tests (optional)
- ❌ E2E tests (deferred)
- ❌ Visual regression (deferred)

## Coverage Targets

| Metric | Target | Current | Gap |
|--------|--------|---------|-----|
| Lines | 60% | — | — |
| Branches | 40% | — | — |
| Functions | 50% | — | — |

## Test Files

### Required
- `src/**/*.test.cjs` or `src/**/*.test.js` - Unit tests for all source files

### Optional
- None for MVP

## Example Test Structure

```javascript
// src/example.test.cjs
const { strict: assert } = require('assert');
const { myFunction } = require('./example');

describe('myFunction', () => {
  it('should return expected result for valid input', () => {
    const result = myFunction('input');
    assert.strictEqual(result, 'expected');
  });
  
  it('should handle edge case', () => {
    const result = myFunction('');
    assert.strictEqual(result, 'default');
  });
});
```

## Setup

```bash
# Install vitest
npm install -D vitest

# Add to package.json
{
  "scripts": {
    "test": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npx vitest run src/example.test.cjs
```

## Gate 5 Validation

```bash
node .planning/gates/gate-05-testing/validator.cjs validate . mvp
```
