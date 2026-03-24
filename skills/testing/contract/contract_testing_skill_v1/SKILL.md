---
name: contract_testing_skill_v1
description: Contract testing with Pact for API integration verification, consumer-driven contracts, and microservices integration testing
version: 1.0.0
tags: [contract-testing, pact, api-testing, integration-testing, microservices, tdd]
stack: testing/contract
category: testing
triggers:
  keywords: [contract testing, pact, api contract, consumer-driven, provider verification, microservices integration]
  filePatterns: [*.pact.ts, *.pact.js, pact/*.json, tests/contract/*.ts]
  commands: [pact, pact-broker, npm run test:contract]
  stack: testing/contract
  projectArchetypes: [microservices, api-platform, distributed-systems]
  modes: [greenfield, integration, ci-cd]
prerequisites:
  - api_testing_fundamentals
  - typescript_javascript
  - microservices_basics
recommended_structure:
  directories:
    - tests/contract/
    - tests/contract/pacts/
    - tests/contract/providers/
    - tests/contract/consumers/
workflow:
  setup:
    - Install Pact framework
    - Set up Pact Broker
    - Configure CI/CD integration
    - Define contract strategy
  develop:
    - Write consumer tests
    - Generate pact files
    - Publish to broker
    - Run provider verification
  maintain:
    - Monitor contract changes
    - Handle breaking changes
    - Version contracts
    - Track compatibility
best_practices:
  - Use consumer-driven contracts
  - Publish contracts to central broker
  - Version all contracts
  - Run contract tests in CI/CD
  - Test all API interactions
  - Handle contract evolution
  - Document breaking changes
  - Use semantic versioning
  - Automate compatibility checks
  - Monitor contract drift
anti_patterns:
  - Never skip contract tests
  - Don't test implementation details
  - Avoid testing only happy path
  - Don't ignore contract versions
  - Never skip provider verification
  - Don't hardcode pact files
  - Avoid testing without broker
  - Don't ignore breaking changes
  - Never skip CI/CD integration
  - Don't forget about backward compatibility
scaling_notes: |
  For contract testing at scale:

  **Broker Management:**
  - Use hosted Pact Broker
  - Implement webhooks for notifications
  - Set up contract versioning
  - Monitor contract changes

  **CI/CD Integration:**
  - Run consumer tests on PR
  - Run provider verification on deploy
  - Block on breaking changes
  - Automate can-i-deploy checks

  **Contract Evolution:**
  - Support multiple versions
  - Implement deprecation strategy
  - Communicate breaking changes
  - Provide migration guides

when_not_to_use: |
  Contract testing may not be suitable for:

  **Monolithic Applications:**
  - Single codebase deployments
  - Integration tests may suffice

  **Simple APIs:**
  - Few consumers, stable API
  - Consider simpler testing

  **Early Prototypes:**
  - Rapidly changing APIs
  - Add contracts when API stabilizes

output_template: |
  ## Contract Testing Strategy

  **Framework:** Pact
  **Broker:** Pact Broker (hosted)
  **Integration:** GitHub Actions
  **Versioning:** Semantic versioning

  ### Key Decisions
  - **Pattern:** Consumer-driven contracts
  - **Broker:** Centralized for all services
  - **CI/CD:** Block on breaking changes
  - **Versioning:** Backward compatible first

  ### Next Steps
  1. Set up Pact Broker
  2. Write consumer tests
  3. Configure provider verification
  4. Integrate with CI/CD
  5. Monitor contract changes
dependencies:
  frameworks:
    - Pact (contract testing)
    - @pact-foundation/pact (JavaScript)
    - pact-python (Python)
    - pact-jvm (Java)
  tools:
    - Pact Broker (contract management)
    - pact-broker-cli (CLI tools)
  integrations:
    - GitHub Actions
    - GitLab CI
    - Jenkins
    - CircleCI
---

<role>
You are a contract testing specialist with deep expertise in Pact, consumer-driven contracts, and API integration testing. You provide structured guidance on preventing integration failures in microservices architectures.
</role>

<contract_test_example>
**Contract Testing with Pact:**

```typescript
// tests/contract/consumer/user-service.pact.ts
import { Pact } from '@pact-foundation/pact';
import { UserAPI } from '../../../src/api/user-api';

describe('User Service API Contract', () => {
  const provider = new Pact({
    consumer: 'UserConsumer',
    provider: 'UserProvider',
    port: 1234,
    log: './pact/logs/pact.log',
    dir: './pact/pacts',
    logLevel: 'warn',
  });

  const userApi = new UserAPI('http://localhost:1234');

  describe('when user exists', () => {
    beforeAll(() => provider.setup());
    afterAll(() => provider.finalize());

    it('returns user data', async () => {
      const expectedUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      };

      await provider
        .given('user exists', { userId: '123' })
        .uponReceiving('a request for user by ID')
        .withRequest({
          method: 'GET',
          path: `/api/users/123`,
          headers: {
            'Accept': 'application/json',
          },
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: expectedUser,
        });

      const result = await userApi.getUserById('123');
      expect(result).toEqual(expectedUser);
    });

    it('returns 404 for non-existent user', async () => {
      await provider
        .given('user does not exist', { userId: '999' })
        .uponReceiving('a request for non-existent user')
        .withRequest({
          method: 'GET',
          path: `/api/users/999`,
        })
        .willRespondWith({
          status: 404,
          body: { error: 'User not found' },
        });

      await expect(userApi.getUserById('999'))
        .rejects
        .toThrow('User not found');
    });
  });
});

// tests/contract/provider/user-provider.pact.ts
import { Verifier } from '@pact-foundation/pact';
import { app } from '../../../src/app';

describe('User Provider Contract Verification', () => {
  it('validates pact with provider', async () => {
    const opts = {
      provider: 'UserProvider',
      providerBaseUrl: 'http://localhost:3000',
      pactBrokerUrl: 'https://pact-broker.example.com',
      pactBrokerToken: process.env.PACT_BROKER_TOKEN,
      consumerVersionTags: ['main'],
      providerVersionTags: ['main'],
      providerVersionBranch: 'main',
      publishVerificationResult: true,
      providerStatesSetupUrl: 'http://localhost:3000/_pact/setup',
    };

    const verifier = new Verifier(opts);
    
    return verifier.verifyProvider()
      .then(() => {
        console.log('Contract verification successful!');
      })
      .catch((error) => {
        console.error('Contract verification failed:', error);
        throw error;
      });
  });
});
```
</contract_test_example>
