---
name: dashboard_design_v1
description: Dashboard design principles for effective data visualization, metrics display, and user experience
version: 1.0.0
tags: [dashboard, data-viz, visualization, ux, metrics, design]
category: observability
triggers:
  keywords: [dashboard, data visualization, metrics display, dashboard design]
  projectArchetypes: [analytics, monitoring, reporting]
prerequisites:
  - data_visualization_basics
  - ux_fundamentals
  - color_theory_basics
workflow:
  setup:
    - Identify user needs
    - Define key metrics
    - Choose chart types
    - Design layout
  build:
    - Create visualizations
    - Add interactivity
    - Implement responsive design
    - Test with users
  iterate:
    - Gather feedback
    - Analyze usage
    - Refine design
best_practices:
  - Know your audience
  - Use appropriate chart types
  - Limit metrics per view (5-9)
  - Use color consistently
  - Provide context (targets, trends)
  - Enable filtering/drill-down
  - Design for mobile
  - Use whitespace effectively
  - Provide export options
  - Test with real users
anti_patterns:
  - Never use pie charts for comparisons
  - Don't overload dashboards
  - Avoid 3D charts
  - Don't use misleading scales
  - Never hide important context
  - Don't ignore accessibility
  - Avoid inconsistent colors
  - Don't skip loading states
scaling_notes: |
  Dashboard Scaling:
  - Start with single view
  - Add personalization
  - Implement real-time updates
  - Create dashboard templates
when_not_to_use: |
  Not for: Raw data export, detailed analysis tools, operational command centers (need specialized design)
output_template: |
  ## Dashboard Design Decision
  **Audience:** {executive | operational | analytical}
  **Update Frequency:** {real-time | hourly | daily}
  **Key Visualizations:** {chart types}
dependencies:
  - charting: "Chart.js, D3, Recharts"
  - framework: "React, Vue, etc."
---

<role>
Data Visualization Designer specializing in dashboard UX.
Focus on clarity, usability, and actionable insights.
</role>
