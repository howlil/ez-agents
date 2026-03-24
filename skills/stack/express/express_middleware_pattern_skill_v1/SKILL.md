---
name: express_middleware_pattern_skill_v1
description: Express.js middleware architecture and REST API patterns
version: 1.0.0
tags: [express, nodejs, backend, api, middleware]
stack: javascript/express-4
category: stack
triggers:
  keywords: [express, middleware, route, controller, rest api]
  filePatterns: [package.json, app.js, server.js, routes/]
  commands: [npm install express, npm run dev, node app.js]
prerequisites:
  - nodejs_18_runtime
  - npm_package_manager
recommended_structure:
  directories:
    - routes/
    - controllers/
    - middleware/
    - models/
    - services/
    - config/
workflow:
  setup:
    - npm install
    - npm run dev
  generate:
    - express-generator
  test:
    - npm test
    - npm run test:coverage
best_practices:
  - Use middleware for cross-cutting concerns (auth, logging, validation)
  - Organize routes by resource/domain
  - Use async/await with proper error handling
  - Implement proper input validation (express-validator)
  - Use environment variables for configuration
anti_patterns:
  - Don't put business logic in route handlers
  - Avoid callback hell (use async/await)
  - Don't skip error handling middleware
scaling_notes: |
  For high-traffic Express applications:

  1. Clustering:
     - Use Node.js cluster module
     - Implement PM2 for process management
     - Configure worker processes per CPU core

  2. Caching Strategy:
     - Implement Redis caching
     - Use express-cache middleware
     - Configure appropriate TTL

  3. Load Balancing:
     - Deploy behind nginx or HAProxy
     - Implement health check endpoints
     - Use sticky sessions if needed

  4. Performance:
     - Enable gzip compression
     - Use response compression middleware
     - Implement rate limiting
when_not_to_use: |
  Express may not be ideal for:

  1. Projects requiring extensive structure
     - Consider NestJS for opinionated framework

  2. Real-time applications
     - Consider Socket.io or specialized frameworks

  3. TypeScript-first projects
     - Consider NestJS for better TS support
output_template: |
  ## Express Route Decision

  **Version:** Express 4.x/5.x
  **Pattern:** Middleware Architecture
  **Key Files:**
  - routes/{resource}.js
  - controllers/{controller}.js
  - middleware/{middleware}.js
dependencies:
  - nodejs: ">=18"
  - express: ">=4.18"
---

<role>
You are an Express.js expert specializing in middleware architecture and REST API patterns.
You provide guidance on Node.js web application development.
</role>

<execution_flow>
## Step 1: Analyze API Requirements
- Identify resources and endpoints
- Determine middleware needs
- Assess authentication requirements

## Step 2: Generate Project Structure
- Create Express app structure
- Set up routes directory
- Configure middleware

## Step 3: Implement Core Components
- Build route handlers
- Create middleware functions
- Implement error handling

## Step 4: Testing Strategy
- Write unit tests for services
- Write integration tests for routes
- Use supertest for HTTP testing
</execution_flow>
