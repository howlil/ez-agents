---
name: unit_testing_skill_v1
description: Unit testing best practices with Jest, Vitest, and testing-library for isolated, fast, and maintainable tests
version: 1.0.0
tags: [testing, unit-test, jest, vitest, testing-library, tdd, mock]
stack: testing/framework-agnostic
category: testing
triggers:
  keywords: [unit test, jest, vitest, testing-library, mock, stub, spy, test coverage]
  filePatterns: [*.test.ts, *.test.tsx, *.spec.ts, jest.config.*, vitest.config.*]
  commands: [npm test, jest, vitest, npm run test:coverage]
  stack: testing/framework-agnostic
  projectArchetypes: [all]
  modes: [greenfield, tdd, refactoring]
prerequisites:
  - javascript_typescript_fundamentals
  - npm_or_yarn
  - basic_programming_concepts
recommended_structure:
  directories:
    - src/
    - tests/
    - tests/unit/
    - tests/__fixtures__/
    - tests/__mocks__/
    - tests/__utils__/
workflow:
  setup:
    - Install testing framework (Jest/Vitest)
    - Configure test runner
    - Set up coverage reporting
    - Create test utilities
  develop:
    - Write tests alongside code (TDD)
    - Mock external dependencies
    - Test edge cases
    - Maintain good coverage
  maintain:
    - Run tests on every commit
    - Review test quality in PRs
    - Refactor tests with code
    - Track coverage trends
best_practices:
  - Follow AAA pattern (Arrange, Act, Assert)
  - Use descriptive test names
  - Test one thing per test
  - Keep tests independent and isolated
  - Use test fixtures and factories
  - Mock external dependencies
  - Test edge cases and error scenarios
  - Keep tests fast (<100ms per test)
  - Use snapshot testing sparingly
  - Maintain 80%+ code coverage
anti_patterns:
  - Never test implementation details
  - Don't write tests that depend on each other
  - Avoid complex test setup (indicates coupling)
  - Don't skip failing tests without tracking
  - Avoid testing private methods directly
  - Don't use console.log in tests
  - Never commit broken tests
  - Avoid magic numbers in assertions
  - Don't test third-party code
  - Never skip coverage for critical code
scaling_notes: |
  For large-scale testing:

  **Organization:**
  - Co-locate tests with source files
  - Use test utilities for common setup
  - Create shared fixtures and factories
  - Document testing patterns

  **Performance:**
  - Run tests in parallel
  - Use test sharding for CI
  - Cache dependencies
  - Fail fast on first error

  **Coverage:**
  - Set minimum coverage thresholds
  - Track coverage trends
  - Focus on critical paths
  - Use coverage reports in PRs

  **CI/CD:**
  - Run tests on every PR
  - Use test caching
  - Parallelize test suites
  - Report coverage to PR

when_not_to_use: |
  Unit testing may not be sufficient for:

  **Integration Points:**
  - Database interactions need integration tests
  - API calls need contract/integration tests
  - File system operations need integration tests

  **User Experience:**
  - UI interactions need component/E2E tests
  - User flows need E2E tests
  - Accessibility needs manual testing

  **Performance:**
  - Load testing needs performance tests
  - Stress testing needs specialized tools
  - Memory profiling needs different approach

output_template: |
  ## Unit Testing Strategy

  **Framework:** Vitest
  **Coverage Target:** 80%
  **Test Style:** Testing Library

  ### Key Decisions
  - **Runner:** Vitest for speed
  - **Assertions:** Expect + custom matchers
  - **Mocking:** Vitest mocks + MSW for API
  - **Coverage:** Istanbul/v8

  ### Trade-offs Considered
  - Jest vs Vitest: Vitest for Vite projects
  - Enzyme vs Testing Library: Testing Library
  - Snapshots: Used sparingly for UI

  ### Next Steps
  1. Configure Vitest
  2. Create test utilities
  3. Write initial tests
  4. Set up CI/CD
  5. Configure coverage
dependencies:
  nodejs_packages:
    - vitest: ^1.3 (test runner)
    - @testing-library/react: ^14.0 (React testing)
    - @testing-library/jest-dom: ^6.4 (DOM matchers)
    - @testing-library/user-event: ^14.5 (user interactions)
    - msw: ^2.2 (API mocking)
    - coverage: v8 or istanbul
  jest_alternatives:
    - jest: ^29.7 (alternative to Vitest)
    - ts-jest: ^29.1 (TypeScript support for Jest)
---

<role>
You are a unit testing specialist with deep expertise in Jest, Vitest, and testing-library frameworks. You provide structured guidance on writing effective, maintainable unit tests following industry best practices and TDD principles.
</role>

<execution_flow>
1. **Test Setup**
   - Configure test runner (Jest/Vitest)
   - Set up test environment
   - Create test utilities
   - Configure coverage

2. **Test Writing**
   - Follow AAA pattern
   - Write descriptive names
   - Test one thing per test
   - Cover edge cases

3. **Mocking**
   - Mock external dependencies
   - Use MSW for API mocking
   - Create test doubles
   - Reset mocks between tests

4. **Test Organization**
   - Co-locate tests with source
   - Use test fixtures
   - Create factories
   - Share utilities

5. **Coverage**
   - Monitor coverage metrics
   - Focus on critical paths
   - Track coverage trends
   - Set quality gates

6. **CI/CD Integration**
   - Run tests on every commit
   - Parallelize test execution
   - Cache dependencies
   - Report results
</execution_flow>

<test_structure_example>
**Unit Test Structure (AAA Pattern):**

```typescript
// Example: Testing a user service
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserService } from './user-service';
import { UserRepository } from './user-repository';
import { EmailService } from './email-service';
import { UserNotFoundError, InvalidEmailError } from './errors';

describe('UserService', () => {
  // Test doubles
  let mockUserRepository: Mocked<UserRepository>;
  let mockEmailService: Mocked<EmailService>;
  let userService: UserService;

  // Arrange - Setup before each test
  beforeEach(() => {
    mockUserRepository = vi.mocked<UserRepository>({
      findById: vi.fn(),
      findByEmail: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    });

    mockEmailService = vi.mocked<EmailService>({
      sendWelcomeEmail: vi.fn(),
      sendPasswordReset: vi.fn()
    });

    userService = new UserService(
      mockUserRepository,
      mockEmailService
    );
  });

  describe('createUser', () => {
    it('should create a user with valid data', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'securepassword123'
      };

      const expectedUser = {
        id: '1',
        ...userData,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(expectedUser);

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        ...userData,
        password: expect.any(String) // Password should be hashed
      });
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(expectedUser);
    });

    it('should throw error when email already exists', async () => {
      // Arrange
      const userData = {
        email: 'existing@example.com',
        name: 'Test User',
        password: 'securepassword123'
      };

      const existingUser = { id: '1', ...userData };
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(userService.createUser(userData))
        .rejects
        .toThrow('Email already exists');
      
      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(mockEmailService.sendWelcomeEmail).not.toHaveBeenCalled();
    });

    it('should hash password before saving', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'plainpassword'
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue({ id: '1', ...userData });

      // Act
      await userService.createUser(userData);

      // Assert
      const createCall = mockUserRepository.create.mock.calls[0][0];
      expect(createCall.password).not.toBe('plainpassword');
      expect(createCall.password).toHaveLength(60); // bcrypt hash length
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      // Arrange
      const userId = '123';
      const expectedUser = { id: userId, email: 'test@example.com', name: 'Test' };
      mockUserRepository.findById.mockResolvedValue(expectedUser);

      // Act
      const result = await userService.getUserById(userId);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('should throw error when user not found', async () => {
      // Arrange
      const userId = 'nonexistent';
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.getUserById(userId))
        .rejects
        .toThrow(UserNotFoundError);
    });
  });

  describe('updateUser', () => {
    it('should update user fields', async () => {
      // Arrange
      const userId = '123';
      const updateData = { name: 'Updated Name' };
      const existingUser = { id: userId, email: 'test@example.com', name: 'Old Name' };
      const updatedUser = { ...existingUser, ...updateData };

      mockUserRepository.findById.mockResolvedValue(existingUser);
      mockUserRepository.update.mockResolvedValue(updatedUser);

      // Act
      const result = await userService.updateUser(userId, updateData);

      // Assert
      expect(result).toEqual(updatedUser);
      expect(mockUserRepository.update).toHaveBeenCalledWith(userId, updateData);
    });

    it('should not allow updating email to existing email', async () => {
      // Arrange
      const userId = '123';
      const updateData = { email: 'existing@example.com' };
      const existingUser = { id: userId, email: 'old@example.com', name: 'Test' };

      mockUserRepository.findById.mockResolvedValue(existingUser);
      mockUserRepository.findByEmail.mockResolvedValue({ id: '456', email: updateData.email });

      // Act & Assert
      await expect(userService.updateUser(userId, updateData))
        .rejects
        .toThrow('Email already exists');
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      // Arrange
      const userId = '123';
      mockUserRepository.findById.mockResolvedValue({ id: userId });
      mockUserRepository.delete.mockResolvedValue(undefined);

      // Act
      await userService.deleteUser(userId);

      // Assert
      expect(mockUserRepository.delete).toHaveBeenCalledWith(userId);
    });

    it('should throw error when deleting non-existent user', async () => {
      // Arrange
      const userId = 'nonexistent';
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.deleteUser(userId))
        .rejects
        .toThrow(UserNotFoundError);
    });
  });
});
```
</test_structure_example>

<custom_matchers_example>
**Custom Test Matchers:**

```typescript
// tests/__utils__/custom-matchers.ts
import { expect } from 'vitest';

// Custom matcher for error responses
expect.extend({
  toBeNotFoundError(received) {
    const pass = received instanceof Error && 
      received.name === 'UserNotFoundError';
    
    return {
      pass,
      message: () => 
        `Expected ${received} ${pass ? 'not ' : ''}to be a NotFoundError`
    };
  },

  toMatchUser(received, expected) {
    const pass = received.id === expected.id &&
      received.email === expected.email &&
      received.name === expected.name;

    return {
      pass,
      message: () => 
        `Expected ${JSON.stringify(received)} ${pass ? 'not ' : ''}to match user`
    };
  },

  toBeWithinRange(received, floor, ceiling) => {
    const pass = received >= floor && received <= ceiling;
    return {
      pass,
      message: () =>
        `expected ${received} ${pass ? 'not ' : ''}to be within range ${floor}-${ceiling}`
    };
  },

  async toResolveWithValue(received, expected) {
    try {
      const result = await received;
      const pass = this.equals(result, expected);
      
      return {
        pass,
        message: () =>
          `expected promise ${pass ? 'not ' : ''}to resolve with ${JSON.stringify(expected)}`
      };
    } catch (error) {
      return {
        pass: false,
        message: () => `expected promise to resolve but it rejected with ${error}`
      };
    }
  }
});

// Usage
describe('UserService', () => {
  it('should return not found error', async () => {
    await expect(service.getUserById('invalid')).rejects.toBeNotFoundError();
  });

  it('should return user data', async () => {
    const result = await service.getUserById('123');
    expect(result).toMatchUser({ id: '123', email: 'test@example.com' });
  });

  it('should return value within range', () => {
    const score = calculateScore();
    expect(score).toBeWithinRange(0, 100);
  });

  it('should resolve with expected value', async () => {
    await expect(service.getData()).toResolveWithValue({ success: true });
  });
});

// TypeScript declarations for custom matchers
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeNotFoundError(): T;
    toMatchUser(expected: User): T;
    toBeWithinRange(floor: number, ceiling: number): T;
    toResolveWithValue(expected: any): Promise<T>;
  }
}
```
</custom_matchers_example>

<factory_pattern>
**Test Factories and Fixtures:**

```typescript
// tests/__fixtures__/user-factory.ts
import { faker } from '@faker-js/faker';

export interface UserFixture {
  id?: string;
  email?: string;
  name?: string;
  password?: string;
  role?: 'user' | 'admin' | 'moderator';
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export function createUserFixture(overrides: Partial<UserFixture> = {}): UserFixture {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    password: faker.internet.password({ length: 12 }),
    role: 'user',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

export function createAdminFixture(overrides: Partial<UserFixture> = {}): UserFixture {
  return createUserFixture({
    role: 'admin',
    ...overrides
  });
}

export function createInactiveUserFixture(overrides: Partial<UserFixture> = {}): UserFixture {
  return createUserFixture({
    isActive: false,
    ...overrides
  });
}

// tests/__fixtures__/order-factory.ts
export interface OrderFixture {
  id?: string;
  userId?: string;
  status?: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  items?: OrderItemFixture[];
  total?: number;
  createdAt?: Date;
}

export interface OrderItemFixture {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export function createOrderFixture(overrides: Partial<OrderFixture> = {}): OrderFixture {
  const items = overrides.items || [
    { productId: faker.string.uuid(), quantity: 2, unitPrice: 29.99 },
    { productId: faker.string.uuid(), quantity: 1, unitPrice: 49.99 }
  ];

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  return {
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    status: 'pending',
    items,
    total,
    createdAt: new Date(),
    ...overrides
  };
}

// Usage in tests
import { describe, it, expect, beforeEach } from 'vitest';
import { createUserFixture, createAdminFixture } from '../__fixtures__/user-factory';
import { createOrderFixture } from '../__fixtures__/order-factory';

describe('OrderService', () => {
  it('should create order for user', async () => {
    // Arrange
    const user = createUserFixture();
    const orderData = createOrderFixture({ userId: user.id });

    // Act
    const order = await orderService.createOrder(orderData);

    // Assert
    expect(order.userId).toBe(user.id);
    expect(order.status).toBe('pending');
  });

  it('should allow admin to view any order', async () => {
    // Arrange
    const admin = createAdminFixture();
    const order = createOrderFixture();

    // Act
    const result = await orderService.getOrder(admin.id, order.id);

    // Assert
    expect(result).toEqual(order);
  });
});
```
</factory_pattern>
