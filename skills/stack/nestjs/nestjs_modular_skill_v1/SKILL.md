---
name: nestjs_modular_skill_v1
description: NestJS modular architecture with dependency injection
version: 1.0.0
tags: [nestjs, nodejs, backend, framework, typescript]
stack: typescript/nestjs-10
category: stack
triggers:
  keywords: [nestjs, decorator, module, dependency injection]
  filePatterns: [nest-cli.json, *.module.ts, *.controller.ts, *.service.ts]
  commands: [nest g resource, npm run start:dev, nest build]
prerequisites:
  - nodejs_18_runtime
  - npm_package_manager
  - typescript
recommended_structure:
  directories:
    - src/
    - src/modules/
    - src/common/
    - src/config/
    - src/filters/
    - src/guards/
    - src/interceptors/
workflow:
  setup:
    - npm install
    - npm run start:dev
  generate:
    - nest g resource
    - nest g module
    - nest g controller
    - nest g service
  test:
    - npm run test
    - npm run test:e2e
best_practices:
  - One module per feature domain
  - Use dependency injection for all services
  - Leverage guards, interceptors, pipes for cross-cutting concerns
  - Use ConfigModule for environment configuration
  - Implement proper exception filters
anti_patterns:
  - Don't put business logic in controllers
  - Avoid circular dependencies between modules
  - Don't skip DTO validation
scaling_notes: |
  For high-traffic NestJS applications:

  1. Microservices Architecture:
     - Use NestJS Microservices package
     - Implement message brokers (Redis, RabbitMQ)
     - Use gRPC for inter-service communication

  2. Caching Strategy:
     - Implement Redis caching with CacheModule
     - Use cache interceptors for automatic caching
     - Configure cache TTL appropriately

  3. Performance Optimization:
     - Enable production mode with fastify adapter
     - Use compression middleware
     - Implement request rate limiting
when_not_to_use: |
  NestJS may not be ideal for:

  1. Simple scripts or CLI tools
     - Consider plain Node.js or TypeScript

  2. Projects requiring minimal structure
     - Express.js might be more appropriate

  3. Non-TypeScript projects
     - NestJS is designed for TypeScript
output_template: |
  ## NestJS Module Decision

  **Version:** NestJS 10.x
  **Architecture:** Modular with DI
  **Key Files:**
  - {module}.module.ts
  - {controller}.controller.ts
  - {service}.service.ts
dependencies:
  - nodejs: ">=18"
  - nestjs: ">=10"
  - typescript: ">=5"
---

<role>
You are a NestJS expert specializing in modular architecture and dependency injection patterns.
You provide guidance on enterprise-grade Node.js application development.
</role>

<execution_flow>
## Step 1: Analyze Project Requirements
- Identify feature domains for modules
- Determine cross-cutting concerns
- Assess scalability needs

## Step 2: Generate Module Structure
- Create feature modules
- Set up shared/common modules
- Configure dependency injection

## Step 3: Implement Core Components
- Build controllers for HTTP layer
- Create services for business logic
- Implement guards and interceptors

## Step 4: Testing Strategy
- Write unit tests for services
- Write integration tests for controllers
- Use e2e testing framework
</execution_flow>
