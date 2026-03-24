---
name: e2e_testing_skill_v1
description: End-to-end testing with Playwright and Cypress for user flow validation, visual regression, and cross-browser testing
version: 1.0.0
tags: [testing, e2e, playwright, cypress, browser-test, visual-regression, user-flow]
stack: testing/e2e
category: testing
triggers:
  keywords: [e2e test, end-to-end, playwright, cypress, browser test, visual regression, user flow]
  filePatterns: [*.e2e.ts, *.spec.ts, e2e/, playwright.config.*, cypress.config.*]
  commands: [npx playwright test, npx cypress run, npm run test:e2e]
  stack: testing/e2e
  projectArchetypes: [web-app, ecommerce, saas, public-website]
  modes: [greenfield, regression, ci-cd]
prerequisites:
  - unit_testing_fundamentals
  - web_basics
  - dom_manipulation
recommended_structure:
  directories:
    - e2e/
    - e2e/tests/
    - e2e/tests/auth/
    - e2e/tests/features/
    - e2e/tests/regression/
    - e2e/fixtures/
    - e2e/pages/
    - e2e/utils/
workflow:
  setup:
    - Install Playwright/Cypress
    - Configure browsers
    - Set up test environment
    - Create page objects
  develop:
    - Write user flow tests
    - Implement page objects
    - Add visual regression
    - Test critical paths
  maintain:
    - Run in CI/CD pipeline
    - Update for UI changes
    - Fix flaky tests
    - Monitor test duration
best_practices:
  - Test critical user journeys
  - Use page object pattern
  - Keep tests independent
  - Use meaningful selectors (data-testid)
  - Implement proper waits
  - Take screenshots on failure
  - Test across multiple browsers
  - Run in headless mode for CI
  - Use fixtures for test data
  - Keep tests focused and fast
anti_patterns:
  - Never test implementation details
  - Don't rely on CSS selectors alone
  - Avoid hard-coded waits (use proper waits)
  - Don't share state between tests
  - Avoid testing third-party functionality
  - Don't skip mobile viewport testing
  - Never ignore flaky tests
  - Avoid overly complex test scenarios
  - Don't test every single interaction
  - Never skip accessibility checks
scaling_notes: |
  For large-scale E2E testing:

  **Organization:**
  - Group tests by feature/domain
  - Use page object pattern
  - Create shared fixtures
  - Document test scenarios

  **Performance:**
  - Run tests in parallel
  - Use sharding for large suites
  - Cache browser binaries
  - Use Docker for consistency

  **CI/CD:**
  - Run on staging environment
  - Use matrix for browsers
  - Set appropriate timeouts
  - Retry flaky tests (limited)

  **Maintenance:**
  - Regular test review
  - Update for UI changes
  - Remove obsolete tests
  - Track flakiness metrics

when_not_to_use: |
  E2E testing may not be suitable for:

  **Early Development:**
  - Focus on unit/integration tests first
  - Add E2E tests before production

  **Frequently Changing UI:**
  - Tests may break often
  - Wait for UI stabilization

  **Limited Resources:**
  - E2E tests are expensive to maintain
  - Focus on critical paths only

output_template: |
  ## E2E Testing Strategy

  **Framework:** Playwright
  **Browsers:** Chrome, Firefox, Safari
  **Viewport:** Desktop + Mobile
  **CI/CD:** GitHub Actions

  ### Key Decisions
  - **Framework:** Playwright for speed
  - **Pattern:** Page Object Model
  - **Selectors:** data-testid attributes
  - **Visual:** Screenshot on failure

  ### Trade-offs Considered
  - Playwright vs Cypress: Playwright for multi-browser
  - POM vs Testing Library: POM for E2E
  - Headless vs Headful: Headless for CI

  ### Next Steps
  1. Set up Playwright
  2. Create page objects
  3. Write critical path tests
  4. Configure CI/CD
  5. Set up visual regression
dependencies:
  nodejs_packages:
    - @playwright/test: ^1.42 (test runner)
    - playwright: ^1.42 (browser automation)
    - @axe-core/playwright: ^4.8 (accessibility testing)
  cypress_alternatives:
    - cypress: ^13.6 (alternative to Playwright)
    - @cypress/code-coverage: ^3.12 (coverage)
  tools:
    - Docker (containerized testing)
    - Percy/Chromatic (visual regression)
---

<role>
You are an E2E testing specialist with deep expertise in Playwright and Cypress for browser automation, user flow testing, and visual regression. You provide structured guidance on writing effective end-to-end tests following industry best practices.
</role>

<execution_flow>
1. **Test Environment Setup**
   - Install Playwright/Cypress
   - Configure browsers
   - Set up test server
   - Create base fixtures

2. **Page Object Creation**
   - Identify pages/components
   - Create page object classes
   - Define selectors with data-testid
   - Implement common actions

3. **Test Writing**
   - Identify critical user flows
   - Write test scenarios
   - Add assertions
   - Implement proper waits

4. **Visual Regression**
   - Configure screenshot capture
   - Set up visual comparison
   - Define tolerance levels
   - Review failures

5. **Accessibility Testing**
   - Integrate axe-core
   - Run accessibility checks
   - Fix violations
   - Document exceptions

6. **CI/CD Integration**
   - Configure parallel execution
   - Set up browser matrix
   - Configure artifacts
   - Report results
</execution_flow>

<playwright_config>
**Playwright Configuration:**

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test directory
  testDir: './e2e',

  // Timeout settings
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },

  // Run tests in parallel
  fullyParallel: true,

  // Number of retries
  retries: process.env.CI ? 2 : 0,

  // Number of workers
  workers: process.env.CI ? '50%' : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'junit-results.xml' }],
    ['github'],
    ['list']
  ],

  // Shared settings
  use: {
    // Base URL for relative URLs
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Capture screenshots on failure
    screenshot: 'only-on-failure',

    // Capture video on failure
    video: 'retain-on-failure',

    // Trace recording
    trace: 'retain-on-failure',

    // Actionability checks
    actionTimeout: 10000,

    // Browser context options
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },

  // Projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile browsers
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    // Authenticated tests
    {
      name: 'chromium-authenticated',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/fixtures/auth.json',
      },
      dependencies: ['chromium'],
    },
  ],

  // Web server configuration for local testing
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
});
```
</playwright_config>

<page_object_pattern>
**Page Object Pattern:**

```typescript
// e2e/pages/base.page.ts
import { Page, Locator, expect } from '@playwright/test';

export abstract class BasePage {
  readonly page: Page;
  readonly url: string;

  constructor(page: Page, url: string) {
    this.page = page;
    this.url = url;
  }

  async goto() {
    await this.page.goto(this.url);
  }

  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
  }
}

// e2e/pages/login.page.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    super(page, '/login');
    this.emailInput = page.getByTestId('email-input');
    this.passwordInput = page.getByTestId('password-input');
    this.loginButton = page.getByTestId('login-button');
    this.errorMessage = page.getByTestId('error-message');
    this.forgotPasswordLink = page.getByTestId('forgot-password-link');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async getErrorMessage() {
    return this.errorMessage.textContent();
  }

  async goToForgotPassword() {
    await this.forgotPasswordLink.click();
  }
}

// e2e/pages/dashboard.page.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class DashboardPage extends BasePage {
  readonly welcomeMessage: Locator;
  readonly navigation: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    super(page, '/dashboard');
    this.welcomeMessage = page.getByTestId('welcome-message');
    this.navigation = page.getByTestId('main-navigation');
    this.userMenu = page.getByTestId('user-menu');
    this.logoutButton = page.getByTestId('logout-button');
  }

  async getWelcomeMessage() {
    return this.welcomeMessage.textContent();
  }

  async logout() {
    await this.userMenu.click();
    await this.logoutButton.click();
  }
}

// e2e/fixtures/pages.ts
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { DashboardPage } from '../pages/dashboard.page';

type PagesFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
};

export const test = base.extend<PagesFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
});

export { expect } from '@playwright/test';
```
</page_object_pattern>

<e2e_test_example>
**E2E Test Examples:**

```typescript
// e2e/tests/auth/login.e2e.ts
import { test, expect } from '../../fixtures/pages';
import { createUserFixture } from '../../fixtures/user-factory';

test.describe('Login Flow', () => {
  test('should login successfully with valid credentials', async ({ 
    loginPage, 
    dashboardPage,
    page 
  }) => {
    // Arrange
    const user = createUserFixture();
    await page.request.post('/api/auth/register', { data: user });

    // Act
    await loginPage.goto();
    await loginPage.login(user.email, user.password);
    await dashboardPage.waitForLoad();

    // Assert
    await expect(dashboardPage.welcomeMessage).toContainText(user.name);
    await expect(page).toHaveURL('/dashboard');
  });

  test('should show error with invalid credentials', async ({ loginPage }) => {
    // Arrange
    await loginPage.goto();

    // Act
    await loginPage.login('invalid@example.com', 'wrongpassword');

    // Assert
    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText('Invalid credentials');
  });

  test('should validate required fields', async ({ loginPage }) => {
    // Arrange
    await loginPage.goto();

    // Act
    await loginPage.loginButton.click();

    // Assert
    await expect(loginPage.emailInput).toBeFocused();
  });
});

// e2e/tests/features/checkout.e2e.ts
import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('password-input').fill('password123');
    await page.getByTestId('login-button').click();
    await page.waitForURL('/dashboard');
  });

  test('should complete purchase successfully', async ({ page }) => {
    // Navigate to product
    await page.goto('/products/1');
    
    // Add to cart
    await page.getByTestId('add-to-cart-button').click();
    await expect(page.getByTestId('cart-count')).toHaveText('1');
    
    // Go to checkout
    await page.getByTestId('cart-button').click();
    await page.getByTestId('checkout-button').click();
    await page.waitForURL('/checkout');
    
    // Fill shipping info
    await page.getByTestId('shipping-name').fill('Test User');
    await page.getByTestId('shipping-address').fill('123 Test St');
    await page.getByTestId('shipping-city').fill('Test City');
    await page.getByTestId('shipping-zip').fill('12345');
    
    // Select shipping method
    await page.getByTestId('shipping-standard').check();
    
    // Continue to payment
    await page.getByTestId('continue-to-payment').click();
    
    // Fill payment info
    await page.getByTestId('card-number').fill('4242424242424242');
    await page.getByTestId('card-expiry').fill('12/25');
    await page.getByTestId('card-cvc').fill('123');
    
    // Place order
    await page.getByTestId('place-order-button').click();
    await page.waitForURL('/order-confirmation');
    
    // Verify order confirmation
    await expect(page.getByTestId('order-confirmation')).toBeVisible();
    await expect(page.getByTestId('order-number')).toBeVisible();
  });

  test('should handle out of stock items', async ({ page }) => {
    // Navigate to out of stock product
    await page.goto('/products/out-of-stock');
    
    // Verify add to cart is disabled
    await expect(page.getByTestId('add-to-cart-button')).toBeDisabled();
    
    // Verify out of stock message
    await expect(page.getByTestId('out-of-stock-message')).toBeVisible();
  });
});

// e2e/tests/accessibility/a11y.e2e.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('homepage should not have accessibility violations', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('login page should be accessible', async ({ page }) => {
    await page.goto('/login');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    // Log violations for review
    if (accessibilityScanResults.violations.length > 0) {
      console.log(JSON.stringify(accessibilityScanResults.violations, null, 2));
    }
    
    // Check for critical violations only
    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    
    expect(criticalViolations).toEqual([]);
  });
});

// e2e/tests/visual/visual-regression.e2e.ts
import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('homepage should match snapshot', async ({ page }) => {
    await page.goto('/');
    
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      maxDiffPixels: 100, // Allow some pixel differences
    });
  });

  test('login page should match snapshot', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page).toHaveScreenshot('login-page.png');
  });

  test('dashboard should match snapshot', async ({ page, login }) => {
    await login();
    await page.goto('/dashboard');
    
    await expect(page).toHaveScreenshot('dashboard.png');
  });
});
```
</e2e_test_example>

<ci_cd_integration>
**CI/CD Integration (GitHub Actions):**

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Build application
        run: npm run build
      
      - name: Run database migrations
        run: npm run db:migrate
        env:
          DATABASE_URL: postgres://test:test@localhost:5432/test_db
      
      - name: Start application
        run: npm run start &
        env:
          DATABASE_URL: postgres://test:test@localhost:5432/test_db
          NODE_ENV: test
      
      - name: Wait for application to be ready
        run: npx wait-on http://localhost:3000
      
      - name: Run E2E tests
        run: npx playwright test
        env:
          BASE_URL: http://localhost:3000
          CI: true
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
      
      - name: Upload test screenshots
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: test-screenshots
          path: test-results/
          retention-days: 7
```
</ci_cd_integration>
