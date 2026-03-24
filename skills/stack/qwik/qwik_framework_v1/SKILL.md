---
name: qwik_framework_v1
description: Qwik framework for resumable applications with instant loading and fine-grained lazy loading
version: 1.0.0
tags: [qwik, resumable, performance, lazy-loading, javascript]
category: stack
stack: javascript/qwik-1
triggers:
  keywords: [qwik, resumable, instant loading, fine-grained lazy loading]
  filePatterns: [vite.config.ts, src/routes/, src/components/]
  commands: [npm create qwik, npm run dev, npm run build]
prerequisites:
  - javascript_typescript_basics
  - component_concepts
  - web_performance
workflow:
  setup:
    - npm create qwik@latest
    - Configure routing
    - Setup styling
    - Deploy configuration
  build:
    - Create components
    - Implement loaders
    - Add interactivity
    - Optimize bundles
  deploy:
    - Build optimization
    - Edge deployment
    - CDN configuration
best_practices:
  - Leverage resumability
  - Use $ for serializable functions
  - Implement fine-grained lazy loading
  - Minimize JavaScript
  - Use Qwik City for routing
  - Optimize images
  - Enable prefetching
  - Use TypeScript
  - Profile with Qwik Inspector
  - Deploy to edge
anti_patterns:
  - Never use useEffect patterns
  - Don't ship unnecessary JS
  - Avoid large bundles
  - Don't skip TypeScript
  - Never ignore DevTools
  - Don't overuse client state
  - Avoid waterfalls
  - Don't ignore mobile
scaling_notes: |
  Qwik Scaling:
  - Use edge deployment
  - Enable prefetch
  - Optimize serialization
  - Monitor bundle sizes
when_not_to_use: |
  Not for: Highly interactive apps needing immediate response, teams requiring React ecosystem
output_template: |
  ## Qwik Architecture Decision
  **Deployment:** {Vercel, Netlify, Cloudflare Workers}
  **Rendering:** {SSG, SSR, Client}
  **State:** {useStore, useSignal}
dependencies:
  - nodejs: ">=18"
  - qwik: ">=1.0"
---

<role>
Performance Architect specializing in Qwik and resumable applications.
Focus on instant loading, minimal JavaScript, and edge deployment.
</role>
