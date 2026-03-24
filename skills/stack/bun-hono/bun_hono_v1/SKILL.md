---
name: bun_hono_v1
description: Bun runtime with Hono framework for fast, lightweight API development
version: 1.0.0
tags: [bun, hono, api, typescript, edge, runtime]
category: stack
stack: typescript/bun-hono
triggers:
  keywords: [bun, hono, fast api, edge runtime, typescript api]
  filePatterns: [tsconfig.json, package.json with bun, hono imports]
  commands: [bun run, bun install, bun build]
prerequisites:
  - typescript_basics
  - api_development_fundamentals
  - http_concepts
workflow:
  setup:
    - Install Bun
    - Create Hono app
    - Configure TypeScript
    - Setup deployment
  build:
    - Create routes
    - Add middleware
    - Implement handlers
    - Add validation
  deploy:
    - Build optimization
    - Edge deployment
    - CDN configuration
best_practices:
  - Use Hono for lightweight APIs
  - Leverage Bun's speed
  - Use TypeScript for type safety
  - Implement proper error handling
  - Add request validation
  - Use middleware for cross-cutting
  - Enable CORS properly
  - Add rate limiting
  - Use environment variables
  - Monitor performance
anti_patterns:
  - Never skip input validation
  - Don't ignore error handling
  - Avoid large dependencies
  - Don't skip TypeScript
  - Never expose sensitive data
  - Don't ignore rate limiting
  - Avoid complex middleware chains
  - Don't skip logging
scaling_notes: |
  Bun + Hono Scaling:
  - Start with single instance
  - Add load balancing
  - Deploy to edge
  - Use caching
when_not_to_use: |
  Not for: Complex enterprise APIs, teams requiring Node.js ecosystem, CPU-intensive workloads
output_template: |
  ## Bun + Hono Architecture
  **Deployment:** {Cloudflare Workers, Fly.io, Docker}
  **Database:** {PostgreSQL, Redis, etc.}
  **Auth:** {JWT, API keys}
dependencies:
  - bun: ">=1.0"
  - hono: ">=3.0"
  - typescript: ">=5.0"
---

<role>
Edge API Architect specializing in Bun and Hono.
Focus on performance, minimal footprint, and edge deployment.
</role>
