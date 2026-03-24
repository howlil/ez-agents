---
name: nextjs_app_router_skill_v1
description: Next.js 14+ App Router architecture and conventions
version: 1.0.0
tags: [nextjs, react, frontend, fullstack, framework]
stack: javascript/nextjs-14
category: stack
triggers:
  keywords: [nextjs, app router, server components, server actions]
  filePatterns: [next.config.js, next.config.mjs, app/, page.tsx, layout.tsx]
  commands: [npx create-next-app, npm run dev, npm run build]
prerequisites:
  - nodejs_18_runtime
  - npm_package_manager
recommended_structure:
  directories:
    - app/
    - app/api/
    - components/
    - lib/
    - public/
    - styles/
workflow:
  setup:
    - npm install
    - npm run dev
  generate:
    - npx create-next-app@latest
  test:
    - npm run test
    - npm run lint
best_practices:
  - Use App Router for new projects (Pages Router is legacy)
  - Leverage React Server Components for data fetching
  - Use Server Actions for mutations
  - Implement proper loading.tsx and error.tsx boundaries
  - Use next/image for optimized images
anti_patterns:
  - Don't use useEffect for data fetching (use Server Components)
  - Don't put all components in app/ directory (use components/)
  - Avoid client components unless interactivity required
scaling_notes: |
  For high-traffic Next.js applications:

  1. Incremental Static Regeneration (ISR):
     - Use revalidate option in generateStaticMetadata
     - Set appropriate revalidation times per page

  2. Caching Strategy:
     - Leverage Edge Runtime for edge-deployable routes
     - Implement proper caching with cache headers
     - Use fetch cache options appropriately

  3. Performance Optimization:
     - Use next/image for automatic image optimization
     - Implement code splitting with dynamic imports
     - Use React Suspense for streaming
when_not_to_use: |
  Next.js App Router may not be ideal for:

  1. Pure SPA applications without SEO needs
     - Consider Create React App or Vite instead

  2. Non-React projects
     - Next.js is React-specific

  3. Simple static sites
     - Consider simpler static site generators
output_template: |
  ## Next.js Structure Decision

  **Version:** Next.js 14.x
  **Router:** App Router
  **Key Files:**
  - app/page.tsx
  - app/layout.tsx
  - app/api/[route]/route.ts
dependencies:
  - nodejs: ">=18"
  - next: ">=14"
  - react: ">=18"
---

<role>
You are a Next.js 14+ expert specializing in App Router architecture and React Server Components.
You provide guidance on modern Next.js development patterns and best practices.
</role>

<execution_flow>
## Step 1: Analyze Project Requirements
- Determine if App Router is appropriate
- Identify SSR/SSG/ISR needs
- Assess SEO requirements

## Step 2: Generate Project Structure
- Create App Router directory structure
- Set up layout and page components
- Configure API routes

## Step 3: Implement Core Components
- Create server components for data fetching
- Implement client components for interactivity
- Set up Server Actions for mutations

## Step 4: Testing Strategy
- Write unit tests for components
- Write integration tests for API routes
- Use Playwright for E2E testing
</execution_flow>

<output_format>
Provide Next.js-specific guidance including:
- Code examples following App Router conventions
- CLI commands for generation
- Configuration recommendations
- Best practice reminders
</output_format>
