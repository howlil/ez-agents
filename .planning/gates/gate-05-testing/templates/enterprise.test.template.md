# Enterprise Test Strategy Template

**Archetype:** Enterprise (Maximum Coverage)
**Coverage Target:** 95% lines, 80% branches, 90% functions

## Test Strategy

For enterprise-grade systems, implement comprehensive testing across all layers: unit, integration, E2E, and visual regression. Every code path must be tested.

### Test Types Required
- ✅ Unit tests for all functions and components
- ✅ Integration tests for all APIs and databases
- ✅ E2E tests for critical user journeys
- ✅ Visual regression tests for UI components

## Coverage Targets

| Metric | Target | Current | Gap |
|--------|--------|---------|-----|
| Lines | 95% | — | — |
| Branches | 80% | — | — |
| Functions | 90% | — | — |

## Test Files

### Required
- `src/**/*.test.cjs` - Unit tests for all source files
- `src/**/*.spec.cjs` - Component specs
- `tests/integration/**/*.test.cjs` - API and database integration tests
- `tests/e2e/**/*.spec.cjs` - E2E tests (Playwright)
- `tests/visual/**/*.spec.cjs` - Visual regression tests

## Example Test Structure

### Unit Test with Mocks
```javascript
// src/services/payment.service.test.cjs
const { strict: assert } = require('assert');
const sinon = require('sinon');
const { PaymentService } = require('../services/payment.service');
const { StripeAdapter } = require('../adapters/stripe.adapter');

describe('PaymentService', () => {
  let stripeStub;
  
  beforeEach(() => {
    stripeStub = sinon.createStubInstance(StripeAdapter);
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('processPayment', () => {
    it('should process payment successfully', async () => {
      stripeStub.charge.resolves({ id: 'ch_123', status: 'succeeded' });
      
      const result = await PaymentService.processPayment({
        amount: 1000,
        currency: 'usd',
        source: 'tok_visa'
      });
      
      assert.strictEqual(result.status, 'succeeded');
      sinon.assert.calledOnce(stripeStub.charge);
    });
    
    it('should handle payment failure', async () => {
      stripeStub.charge.rejects(new Error('Card declined'));
      
      await assert.rejects(
        () => PaymentService.processPayment({ amount: 1000, currency: 'usd', source: 'declined_card' }),
        /Card declined/
      );
    });
  });
});
```

### E2E Test (Playwright)
```javascript
// tests/e2e/checkout.spec.cjs
const { test, expect } = require('@playwright/test');

test.describe('Checkout Flow', () => {
  test('should complete purchase successfully', async ({ page }) => {
    // Navigate to product
    await page.goto('/products/1');
    
    // Add to cart
    await page.click('[data-testid="add-to-cart"]');
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');
    
    // Checkout
    await page.click('[data-testid="checkout"]');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="card"]', '4242424242424242');
    await page.click('[data-testid="pay"]');
    
    // Verify success
    await expect(page.locator('[data-testid="order-confirmation"]')).toBeVisible();
    await expect(page).toHaveURL(/\/order\/\d+/);
  });
});
```

### Visual Regression Test
```javascript
// tests/visual/dashboard.spec.cjs
const { test, expect } = require('@playwright/test');

test.describe('Dashboard Visual Tests', () => {
  test('dashboard should match snapshot', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveScreenshot('dashboard.png', {
      fullPage: true,
      maxDiffPixels: 100
    });
  });
  
  test('dashboard dark mode should match snapshot', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('[data-testid="dark-mode-toggle"]');
    await expect(page).toHaveScreenshot('dashboard-dark.png', {
      fullPage: true,
      maxDiffPixels: 100
    });
  });
});
```

## Setup

```bash
# Install all testing dependencies
npm install -D vitest @playwright/test c8 @vitest/coverage-v8 supertest sinon

# Initialize Playwright browsers
npx playwright install

# Add to package.json
{
  "scripts": {
    "test": "vitest run",
    "test:coverage": "vitest run --coverage --coverage-reporter=json",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test",
    "test:visual": "playwright test tests/visual",
    "test:all": "npm test && npm run test:e2e"
  }
}
```

## Running Tests

```bash
# Run unit tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run visual regression tests
npm run test:visual

# Run all tests
npm run test:all
```

## Gate 5 Validation

```bash
node .planning/gates/gate-05-testing/validator.cjs validate . enterprise
```
