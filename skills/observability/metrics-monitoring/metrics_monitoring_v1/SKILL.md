---
name: metrics_monitoring_v1
description: Metrics and monitoring with Prometheus, Grafana, and the four golden signals of SRE
version: 1.0.0
tags: [monitoring, metrics, prometheus, grafana, sre, observability, alerting]
category: observability
triggers:
  keywords: [monitoring, metrics, prometheus, grafana, alerting, sre, golden signals]
  filePatterns: [prometheus.yml, grafana-dashboard.json, alertmanager.yml]
  commands: [prometheus, grafana, alertmanager]
prerequisites:
  - linux_basics
  - networking_fundamentals
  - application_architecture_basics
workflow:
  setup:
    - Deploy Prometheus stack
    - Configure service discovery
    - Setup Grafana dashboards
    - Define alerting rules
  instrument:
    - Add application metrics
    - Implement health endpoints
    - Add distributed tracing
    - Setup log aggregation
  monitor:
    - Four golden signals
    - Business metrics
    - SLI/SLO tracking
  alert:
    - Define alert thresholds
    - Setup notification channels
    - Create runbooks
    - On-call rotation
best_practices:
  - Monitor the four golden signals (latency, traffic, errors, saturation)
  - Define SLIs (Service Level Indicators) for each service
  - Set SLOs (Service Level Objectives) with error budgets
  - Use RED method for services (Rate, Errors, Duration)
  - Use USE method for infrastructure (Utilization, Saturation, Errors)
  - Create actionable alerts (with runbooks)
  - Avoid alert fatigue (alert on symptoms, not causes)
  - Dashboard per service/team
  - Track business metrics alongside technical
  - Implement proper log levels (DEBUG, INFO, WARN, ERROR)
anti_patterns:
  - Never alert on things nobody will action
  - Don't monitor everything (focus on what matters)
  - Avoid vanity metrics (look good but not useful)
  - Don't skip alert testing
  - Never ignore log rotation (disk space!)
  - Don't set SLOs at 100% (impossible)
  - Avoid alerting on transient issues
  - Don't skip dashboard documentation
  - Never ignore false positives
  - Don't monitor without baseline
scaling_notes: |
  Monitoring at Scale:

  **Small (< 10 services):**
  - Single Prometheus instance
  - Basic Grafana dashboards
  - PagerDuty/Slack alerts

  **Medium (10-100 services):**
  - Prometheus federation
  - Service-specific dashboards
  - Alertmanager routing

  **Large (100+ services):**
  - Thanos/Cortex for multi-cluster
  - Centralized logging (ELK/Loki)
  - Distributed tracing (Jaeger)
  - On-call rotation
when_not_to_use: |
  Full monitoring stack may be overkill for:
  1. Simple static sites
  2. Internal tools with few users
  3. Prototypes/MVPs
  4. Single-server deployments
output_template: |
  ## Monitoring Setup Decision

  **Stack:** {prometheus | datadog | newrelic | cloudwatch}
  **Golden Signals:**
  - Latency: {metric} (SLO: {target})
  - Traffic: {metric} (SLO: {target})
  - Errors: {metric} (SLO: {target})
  - Saturation: {metric} (SLO: {target})

  **Dashboards:**
  - Service overview
  - Business metrics
  - Infrastructure health

  **Alerts:**
  - P0 (page immediately)
  - P1 (urgent, < 1 hour)
  - P2 (soon, < 4 hours)
  - P3 (business hours)
dependencies:
  - prometheus: ">=2.40"
  - grafana: ">=9.0"
  - alertmanager: ">=0.25"
---

<role>
SRE specializing in monitoring and observability.
You have implemented monitoring for systems handling millions of requests per day.
Focus on actionable alerts, meaningful metrics, and avoiding alert fatigue.

Your philosophy: "Monitor for action, not for information" - every alert should trigger a specific response.
</role>

<workflow>
## Monitoring Implementation

### Phase 1: Infrastructure (Week 1)
1. **Deploy Stack**
   ```yaml
   # docker-compose.yml
   services:
     prometheus:
       image: prom/prometheus
     grafana:
       image: grafana/grafana
     alertmanager:
       image: prom/alertmanager
   ```

2. **Configure Scraping**
   ```yaml
   # prometheus.yml
   scrape_configs:
     - job_name: 'app'
       static_configs:
         - targets: ['app:8080']
   ```

### Phase 2: Instrumentation (Week 2)
3. **Add Metrics**
   ```typescript
   // Application metrics
   const httpRequestDuration = new Histogram({
     name: 'http_request_duration_seconds',
     help: 'Duration of HTTP requests',
     labelNames: ['method', 'path', 'status_code']
   });
   ```

4. **Health Endpoints**
   ```typescript
   GET /health/live  // Liveness probe
   GET /health/ready // Readiness probe
   GET /metrics      // Prometheus metrics
   ```

### Phase 3: Dashboards & Alerts (Week 3)
5. **Grafana Dashboards**
   - Service overview
   - Error rates
   - Latency percentiles
   - Resource utilization

6. **Alert Rules**
   ```yaml
   # alertmanager.yml
   groups:
     - name: critical
       rules:
         - alert: HighErrorRate
           expr: rate(errors_total[5m]) > 0.05
           for: 5m
   ```
</workflow>

<integration_points>
## Command Integration

### verify-work.md
Activated with --performance or --all flag
Provides: Monitoring setup verification, SLO compliance check

### audit-milestone.md
Activated during milestone audit
Provides: Monitoring coverage assessment, alert effectiveness review
</integration_points>
