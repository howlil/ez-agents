---
name: astro_framework_v1
description: Astro framework for content-focused websites with partial hydration and island architecture
version: 1.0.0
tags: [astro, static-site, content, islands, performance, seo]
category: stack
stack: javascript/astro-4
triggers:
  keywords: [astro, static site, content site, blog, documentation, islands]
  filePatterns: [astro.config.mjs, src/pages/, src/components/]
  commands: [npx create-astro, npm run dev, npm run build]
prerequisites:
  - html_css_basics
  - javascript_fundamentals
  - component_concepts
workflow:
  setup:
    - npx create-astro@latest
    - Configure integrations
    - Setup content collection
    - Deploy configuration
  build:
    - Create pages
    - Build components
    - Add interactivity (islands)
    - Content collections
  optimize:
    - Image optimization
    - CSS bundling
    - JavaScript hydration
best_practices:
  - Use Astro for content-first sites
  - Minimize JavaScript (islands only where needed)
  - Use content collections for structured content
  - Leverage Astro components (.astro)
  - Use framework components sparingly (React/Vue)
  - Optimize images with Astro Image
  - Implement proper SEO meta tags
  - Use RSS feeds for content sites
  - Configure proper caching
  - Enable view transitions
anti_patterns:
  - Never ship unnecessary JavaScript
  - Don't use for highly interactive apps
  - Avoid client-side routing for content
  - Don't skip image optimization
  - Never ignore accessibility
  - Don't overuse framework islands
  - Avoid large page sizes
  - Don't skip mobile optimization
scaling_notes: |
  Astro Scaling:
  - Use SSR for dynamic content
  - Enable hybrid rendering
  - Use CDN for static assets
  - Implement incremental static regeneration
when_not_to_use: |
  Not for: Web applications, dashboards, highly interactive UIs, real-time apps
output_template: |
  ## Astro Architecture Decision
  **Rendering:** {SSG, SSR, Hybrid}
  **CMS:** {Content Collections, Headless CMS}
  **Interactivity:** {Astro components, React islands}
dependencies:
  - nodejs: ">=18"
  - astro: ">=4.0"
---

<role>
Web Performance Architect specializing in content-focused websites.
You have built high-performance sites with perfect Lighthouse scores.
Focus on speed, SEO, and user experience.
</role>

<workflow>
## Astro Implementation

### Phase 1: Setup (Day 1)
1. Project Creation
   - npx create-astro@latest
   - Choose template
   - Configure integrations

2. Content Setup
   - Define collections
   - Create content structure
   - Setup MDX if needed

### Phase 2: Development (Week 1-2)
3. Pages
   - File-based routing
   - Dynamic routes
   - Layouts

4. Components
   - Astro components
   - Framework islands
   - Shared layouts

5. Content
   - Markdown/MDX
   - Content collections
   - Taxonomies

### Phase 3: Optimization (Week 3)
6. Performance
   - Image optimization
   - CSS bundling
   - JavaScript minimization

7. SEO
   - Meta tags
   - Sitemap
   - RSS feeds
   - Structured data

8. Deploy
   - Build configuration
   - Platform setup
   - CI/CD pipeline
</workflow>
