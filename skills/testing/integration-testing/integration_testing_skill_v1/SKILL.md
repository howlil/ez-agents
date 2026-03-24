---
name: integration_testing_skill_v1
description: Integration testing strategies for API, database, and service integration with proper isolation and test containers
version: 1.0.0
tags: [testing, integration-test, api-test, database-test, test-containers, supertest]
stack: testing/framework-agnostic
category: testing
triggers:
  keywords: [integration test, api test, database test, test containers, supertest, e2e]
  filePatterns: [*.integration.test.ts, *.api.test.ts, *.integration.spec.ts]
  commands: [npm run test:integration, testcontainers]
  stack: testing/framework-agnostic
  projectArchetypes: [api-backend, microservices, saas]
  modes: [greenfield, migration, ci-cd]
prerequisites:
  - unit_testing_fundamentals
  - api_basics
  - database_basics
recommended_structure:
  directories:
    - tests/integration/
    - tests/integration/api/
    - tests/integration/database/
    - tests/integration/services/
    - tests/__setup__/
workflow:
  setup:
    - Install test frameworks
    - Set up test containers
    - Configure test database
    - Create test utilities
  develop:
    - Write API integration tests
    - Test database operations
    - Test service integrations
    - Mock external services
  maintain:
    - Run in CI/CD pipeline
    - Keep tests isolated
    - Clean up after tests
    - Monitor test duration
best_practices:
  - Use test containers for dependencies
  - Keep tests isolated and idempotent
  - Clean up test data after each test
  - Use transactions for database tests
  - Mock external third-party services
  - Test real integrations when possible
  - Keep integration tests fast (<5s per test)
  - Use realistic test data
  - Document test dependencies
  - Run integration tests separately from unit tests
anti_patterns:
  - Never share state between tests
  - Don't skip cleanup after tests
  - Avoid testing with production data
  - Don't mock everything (defeats purpose)
  - Avoid flaky tests (retry logic)
  - Don't run integration tests on every file change
  - Never skip database migrations in tests
  - Avoid hard-coded ports and URLs
  - Don't ignore test duration
  - Never commit failing integration tests
scaling_notes: |
  For large-scale integration testing:

  **Organization:**
  - Group tests by domain/service
  - Use test suites for related tests
  - Share setup utilities
  - Document test dependencies

  **Performance:**
  - Run tests in parallel
  - Use test containers efficiently
  - Cache container images
  - Use database transactions

  **CI/CD:**
  - Run on PR merge, not every commit
  - Use separate CI job
  - Set appropriate timeouts
  - Retry flaky tests (with limits)

  **Data Management:**
  - Use factories for test data
  - Clean up after each test
  - Use unique identifiers
  - Seed minimal required data

when_not_to_use: |
  Integration testing may not be suitable for:

  **Quick Prototypes:**
  - Focus on unit tests for rapid iteration
  - Add integration tests before production

  **External Service Dependencies:**
  - Mock services that are unreliable
  - Use contract testing for APIs

  **Very Large Test Suites:**
  - Consider selective test running
  - Split into smaller test suites

output_template: |
  ## Integration Testing Strategy

  **Framework:** Vitest + Supertest
  **Database:** Test Containers (PostgreSQL)
  **API Testing:** Supertest
  **External Services:** MSW mocking

  ### Key Decisions
  - **Containers:** Docker for dependencies
  - **Database:** Fresh DB per test suite
  - **Cleanup:** Transaction rollback
  - **External:** Mock with MSW

  ### Trade-offs Considered
  - Real vs Mock: Real for core, mock for external
  - Speed vs Coverage: Balance with selective running
  - Isolation vs Speed: Transactions for speed

  ### Next Steps
  1. Set up test containers
  2. Configure test database
  3. Write API tests
  4. Set up CI/CD job
  5. Configure reporting
dependencies:
  nodejs_packages:
    - vitest: ^1.3 (test runner)
    - supertest: ^6.3 (API testing)
    - @testcontainers/postgresql: ^10.5 (DB containers)
    - @testcontainers/redis: ^10.5 (Redis containers)
    - msw: ^2.2 (external service mocking)
    - knex: ^3.1 (database utilities)
  tools:
    - Docker (containers)
    - Testcontainers (programmatic containers)
---

<role>
You are an integration testing specialist with deep expertise in API testing, database testing, and test containers. You provide structured guidance on writing effective integration tests that verify component interactions following industry best practices.
</role>

<execution_flow>
1. **Test Environment Setup**
   - Configure test containers
   - Set up test database
   - Configure test server
   - Create test utilities

2. **API Integration Tests**
   - Test HTTP endpoints
   - Verify request/response
   - Test authentication
   - Test error handling

3. **Database Integration Tests**
   - Test queries and migrations
   - Test transactions
   - Test relationships
   - Test constraints

4. **Service Integration Tests**
   - Test service communication
   - Test message queues
   - Test event handlers
   - Test external APIs

5. **Cleanup and Isolation**
   - Clean up test data
   - Reset state between tests
   - Use transactions
   - Ensure idempotency

6. **CI/CD Integration**
   - Configure separate job
   - Set timeouts
   - Configure retries
   - Report results
</execution_flow>

<testcontainers_setup>
**Test Containers Setup:**

```typescript
// tests/__setup__/database.ts
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { Knex, knex } from 'knex';
import { afterAll, beforeAll } from 'vitest';

let container: StartedPostgreSqlContainer;
let db: Knex;

export async function setupDatabase() {
  beforeAll(async () => {
    // Start PostgreSQL container
    container = await new PostgreSqlContainer('postgres:15-alpine')
      .withDatabase('test_db')
      .withUsername('test')
      .withPassword('test')
      .withExposedPorts(5432)
      .start();

    // Create knex instance
    db = knex({
      client: 'postgres',
      connection: container.getConnectionUri(),
      pool: {
        min: 2,
        max: 10
      },
      migrations: {
        tableName: 'knex_migrations'
      }
    });

    // Run migrations
    await db.migrate.latest({
      directory: './src/database/migrations'
    });
  }, 30000); // 30s timeout for container startup

  afterAll(async () => {
    // Cleanup
    await db.destroy();
    await container.stop();
  }, 10000);

  return () => db;
}

// tests/__setup__/redis.ts
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { createClient, RedisClientType } from 'redis';
import { afterAll, beforeAll } from 'vitest';

let container: StartedRedisContainer;
let client: RedisClientType;

export async function setupRedis() {
  beforeAll(async () => {
    container = await new RedisContainer('redis:7-alpine')
      .withExposedPorts(6379)
      .start();

    client = createClient({
      url: container.getConnectionUrl()
    });

    await client.connect();
  }, 30000);

  afterAll(async () => {
    await client.quit();
    await container.stop();
  }, 10000);

  return () => client;
}

// tests/__setup__/index.ts
export { setupDatabase } from './database';
export { setupRedis } from './redis';
export { setupTestServer } from './server';
export { mockExternalServices } from './mocks';
```
</testcontainers_setup>

<api_integration_test>
**API Integration Test Example:**

```typescript
// tests/integration/api/users.api.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { setupDatabase } from '../../__setup__/database';
import { setupTestServer } from '../../__setup__/server';
import { createUserFixture } from '../../__fixtures__/user-factory';
import { knex } from 'knex';

describe('Users API', () => {
  const getDb = setupDatabase();
  const { app, server } = setupTestServer();
  let db: ReturnType<typeof getDb>;

  beforeEach(async () => {
    db = getDb();
    // Clean up before each test
    await db('users').del();
  });

  describe('POST /api/users', () => {
    it('should create a user with valid data', async () => {
      // Arrange
      const userData = createUserFixture();

      // Act
      const response = await request(app)
        .post('/api/users')
        .send({
          email: userData.email,
          password: userData.password,
          name: userData.name
        })
        .expect(201);

      // Assert
      expect(response.body).toMatchObject({
        id: expect.any(String),
        email: userData.email,
        name: userData.name,
        createdAt: expect.any(String)
      });

      // Verify in database
      const userInDb = await db('users').where({ email: userData.email }).first();
      expect(userInDb).toBeDefined();
      expect(userInDb.email).toBe(userData.email);
    });

    it('should return 400 for invalid email', async () => {
      // Arrange
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User'
      };

      // Act
      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(400);

      // Assert
      expect(response.body.error).toContain('email');
    });

    it('should return 409 for duplicate email', async () => {
      // Arrange
      const userData = createUserFixture();
      await db('users').insert({
        email: userData.email,
        password: 'hash',
        name: 'Existing User'
      });

      // Act
      const response = await request(app)
        .post('/api/users')
        .send({
          email: userData.email,
          password: userData.password,
          name: userData.name
        })
        .expect(409);

      // Assert
      expect(response.body.error).toContain('already exists');
    });

    it('should hash password before storing', async () => {
      // Arrange
      const userData = createUserFixture();

      // Act
      await request(app)
        .post('/api/users')
        .send({
          email: userData.email,
          password: userData.password,
          name: userData.name
        });

      // Assert
      const userInDb = await db('users').where({ email: userData.email }).first();
      expect(userInDb.password).not.toBe(userData.password);
      expect(userInDb.password).toHaveLength(60); // bcrypt hash
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by id', async () => {
      // Arrange
      const userData = createUserFixture();
      const [inserted] = await db('users').insert(userData).returning('*');

      // Act
      const response = await request(app)
        .get(`/api/users/${inserted.id}`)
        .expect(200);

      // Assert
      expect(response.body).toMatchObject({
        id: inserted.id,
        email: userData.email,
        name: userData.name
      });
    });

    it('should return 404 for non-existent user', async () => {
      // Act
      const response = await request(app)
        .get('/api/users/non-existent-id')
        .expect(404);

      // Assert
      expect(response.body.error).toBe('User not found');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user', async () => {
      // Arrange
      const userData = createUserFixture();
      const [inserted] = await db('users').insert(userData).returning('*');
      const updateData = { name: 'Updated Name' };

      // Act
      const response = await request(app)
        .put(`/api/users/${inserted.id}`)
        .send(updateData)
        .expect(200);

      // Assert
      expect(response.body.name).toBe('Updated Name');

      // Verify in database
      const userInDb = await db('users').where({ id: inserted.id }).first();
      expect(userInDb.name).toBe('Updated Name');
    });

    it('should return 404 for non-existent user', async () => {
      // Act
      const response = await request(app)
        .put('/api/users/non-existent-id')
        .send({ name: 'Updated' })
        .expect(404);

      // Assert
      expect(response.body.error).toBe('User not found');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user', async () => {
      // Arrange
      const userData = createUserFixture();
      const [inserted] = await db('users').insert(userData).returning('*');

      // Act
      await request(app)
        .delete(`/api/users/${inserted.id}`)
        .expect(204);

      // Assert
      const userInDb = await db('users').where({ id: inserted.id }).first();
      expect(userInDb).toBeUndefined();
    });
  });
});
```
</api_integration_test>

<database_integration_test>
**Database Integration Test Example:**

```typescript
// tests/integration/database/user.repository.integration.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { setupDatabase } from '../../__setup__/database';
import { UserRepository } from '../../../src/repositories/user-repository';
import { createUserFixture } from '../../__fixtures__/user-factory';
import { knex } from 'knex';

describe('UserRepository', () => {
  const getDb = setupDatabase();
  let db: ReturnType<typeof getDb>;
  let repository: UserRepository;

  beforeEach(() => {
    db = getDb();
    repository = new UserRepository(db);
  });

  describe('create', () => {
    it('should create a user', async () => {
      // Arrange
      const userData = createUserFixture();

      // Act
      const user = await repository.create(userData);

      // Assert
      expect(user).toMatchObject({
        id: expect.any(String),
        email: userData.email,
        name: userData.name
      });

      // Verify in database
      const found = await db('users').where({ id: user.id }).first();
      expect(found).toBeDefined();
    });

    it('should set timestamps automatically', async () => {
      // Arrange
      const userData = createUserFixture();
      const beforeCreate = new Date();

      // Act
      const user = await repository.create(userData);

      // Assert
      expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      // Arrange
      const userData = createUserFixture();
      const [inserted] = await db('users').insert(userData).returning('*');

      // Act
      const user = await repository.findById(inserted.id);

      // Assert
      expect(user).toBeDefined();
      expect(user?.email).toBe(userData.email);
    });

    it('should return null for non-existent user', async () => {
      // Act
      const user = await repository.findById('non-existent');

      // Assert
      expect(user).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      // Arrange
      const userData = createUserFixture();
      await db('users').insert(userData);

      // Act
      const user = await repository.findByEmail(userData.email);

      // Assert
      expect(user).toBeDefined();
      expect(user?.name).toBe(userData.name);
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      // Arrange
      const userData = createUserFixture();
      const [inserted] = await db('users').insert(userData).returning('*');
      const updateData = { name: 'Updated Name' };

      // Act
      const updated = await repository.update(inserted.id, updateData);

      // Assert
      expect(updated.name).toBe('Updated Name');
      expect(updated.updatedAt.getTime()).toBeGreaterThan(inserted.updatedAt.getTime());
    });

    it('should throw error for non-existent user', async () => {
      // Act & Assert
      await expect(repository.update('non-existent', { name: 'Updated' }))
        .rejects
        .toThrow('User not found');
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      // Arrange
      const userData = createUserFixture();
      const [inserted] = await db('users').insert(userData).returning('*');

      // Act
      await repository.delete(inserted.id);

      // Assert
      const found = await db('users').where({ id: inserted.id }).first();
      expect(found).toBeUndefined();
    });
  });

  describe('transactions', () => {
    it('should rollback on error', async () => {
      // Arrange
      const userData = createUserFixture();

      // Act & Assert
      await expect(
        db.transaction(async (trx) => {
          await trx('users').insert(userData);
          // Simulate error
          throw new Error('Rollback');
        })
      ).rejects.toThrow('Rollback');

      // Verify rollback
      const found = await db('users').where({ email: userData.email }).first();
      expect(found).toBeUndefined();
    });

    it('should commit on success', async () => {
      // Arrange
      const userData = createUserFixture();

      // Act
      await db.transaction(async (trx) => {
        await trx('users').insert(userData);
      });

      // Assert
      const found = await db('users').where({ email: userData.email }).first();
      expect(found).toBeDefined();
    });
  });
});
```
</database_integration_test>
