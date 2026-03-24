---
name: analytics_dashboard_v1
description: Analytics and dashboard architecture for data visualization, metrics tracking, and business intelligence
version: 1.0.0
tags: [analytics, dashboard, data-visualization, metrics, business-intelligence, charts]
category: domain
triggers:
  keywords: [analytics, dashboard, metrics, kpi, data visualization, charts, reports]
  projectArchetypes: [analytics, dashboard, bi-platform, reporting]
prerequisites:
  - database_querying_basics
  - data_modeling_fundamentals
  - frontend_charting_libraries
workflow:
  setup:
    - Define key metrics (KPIs)
    - Design data models
    - Choose charting library
    - Setup data pipelines
  build:
    - Create dashboard layouts
    - Implement chart components
    - Add filtering/drill-down
    - Setup real-time updates
  optimize:
    - Query optimization
    - Caching strategies
    - Lazy loading
best_practices:
  - Start with user questions, not data available
  - Use appropriate chart types for data
  - Implement dashboard personalization
  - Add export functionality (PDF, CSV)
  - Setup automated report delivery
  - Use color consistently
  - Provide context (targets, trends)
  - Optimize for mobile viewing
  - Implement row-level security
  - Cache expensive aggregations
anti_patterns:
  - Never show all data (curate insights)
  - Don't use misleading chart types
  - Avoid cluttered dashboards
  - Don't skip loading states
  - Never show stale data without timestamp
  - Don't ignore accessibility
  - Avoid complex queries on main thread
  - Don't skip data validation
scaling_notes: |
  Dashboard Scaling:
  - Start with static dashboards
  - Add real-time for critical metrics
  - Use materialized views for aggregations
  - Implement query result caching
  - Consider columnar DB for analytics
when_not_to_use: |
  Not for: Simple data display, operational screens, non-technical users needing simple reports
output_template: |
  ## Analytics Dashboard Decision
  **Dashboard Type:** {operational | analytical | strategic}
  **Update Frequency:** {real-time | hourly | daily}
  **Key Metrics:** {list of KPIs}
  **Chart Types:** {line, bar, pie, heatmap, etc.}
dependencies:
  - charting_library: "Chart.js, D3, Recharts, or similar"
  - database: "Optimized for analytics queries"
---

<role>
Analytics Architect specializing in data visualization and business intelligence.
You have built dashboards used by Fortune 500 companies.
Focus on actionable insights, not just data display.
</role>

<workflow>
## Analytics Dashboard Implementation

### Phase 1: Requirements (Week 1)
1. Identify User Questions
   - What decisions will this dashboard support?
   - What metrics matter most?
   - What actions will users take?

2. Define KPIs
   - Leading vs lagging indicators
   - Targets and thresholds
   - Calculation formulas

### Phase 2: Data Model (Week 2)
3. Design Data Schema
   - Fact and dimension tables
   - Aggregation strategies
   - Data freshness requirements

4. Build Data Pipeline
   - ETL/ELT processes
   - Data quality checks
   - Incremental updates

### Phase 3: Dashboard Build (Week 3-4)
5. Create Visualizations
   - Choose appropriate chart types
   - Implement responsive layouts
   - Add interactivity (filters, drill-down)

6. Add Real-time Features
   - WebSocket connections
   - Polling strategies
   - Optimistic updates
</workflow>
