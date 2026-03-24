---
name: grafana_dashboards_skill_v1
description: Grafana dashboard design, visualization best practices, panel configuration, and observability dashboards for production monitoring
version: 1.0.0
tags: [grafana, dashboards, visualization, monitoring, observability, panels, metrics]
stack: observability/grafana
category: observability
triggers:
  keywords: [grafana, dashboard, visualization, panels, metrics, monitoring, observability]
  filePatterns: [grafana/*.json, dashboards/*.yaml, panels/*.json]
  commands: [grafana-cli, grafana-server]
  stack: observability/grafana
  projectArchetypes: [saas, enterprise, microservices, data-platform]
  modes: [greenfield, production, optimization]
prerequisites:
  - metrics_basics
  - prometheus_basics
  - dashboard_design_basics
recommended_structure:
  directories:
    - grafana/
    - grafana/dashboards/
    - grafana/dashboards/platform/
    - grafana/dashboards/services/
    - grafana/dashboards/business/
workflow:
  setup:
    - Deploy Grafana
    - Configure data sources
    - Set up authentication
    - Create folder structure
  develop:
    - Design dashboard layouts
    - Create panels
    - Configure alerts
    - Add annotations
  maintain:
    - Review dashboard usage
    - Update for new metrics
    - Optimize queries
    - Manage permissions
best_practices:
  - Design for specific personas
  - Use consistent color schemes
  - Add meaningful titles and descriptions
  - Include time range recommendations
  - Use appropriate visualizations
  - Add drill-down capabilities
  - Document panel queries
  - Set up dashboard permissions
  - Enable dashboard versioning
  - Create dashboard templates
anti_patterns:
  - Never create dashboards without purpose
  - Don't overload single dashboard
  - Avoid complex queries in panels
  - Don't skip documentation
  - Never ignore dashboard performance
  - Don't use misleading visualizations
  - Avoid static thresholds only
  - Don't skip alert integration
  - Never share sensitive dashboards
  - Don't forget about mobile viewing
scaling_notes: |
  For Grafana at scale:

  **Organization:**
  - Use folder hierarchy
  - Implement team ownership
  - Create dashboard templates
  - Standardize naming

  **Performance:**
  - Optimize PromQL queries
  - Use query caching
  - Implement dashboard lazy loading
  - Limit data points

  **Management:**
  - Track dashboard usage
  - Remove unused dashboards
  - Regular dashboard review
  - Version control configs

when_not_to_use: |
  Grafana may not be suitable for:

  **Simple Monitoring:**
  - Single service monitoring
  - Consider simpler tools

  **Business Reporting:**
  - Executive dashboards
  - Consider BI tools

  **Log Analysis:**
  - Heavy log querying
  - Consider Kibana/Loki

output_template: |
  ## Grafana Dashboard Strategy

  **Deployment:** K8s (Helm)
  **Auth:** SSO with OIDC
  **Storage:** PostgreSQL
  **Provisioning:** GitOps

  ### Key Decisions
  - **Structure:** Folder per team
  - **Provisioning:** IaC with Terraform
  - **Alerts:** Integrated with Alertmanager
  - **Permissions:** RBAC by team

  ### Next Steps
  1. Deploy Grafana
  2. Configure data sources
  3. Create base dashboards
  4. Set up alerts
  5. Train team
dependencies:
  platforms:
    - Grafana OSS (open-source)
    - Grafana Enterprise (paid)
    - Grafana Cloud (managed)
  data_sources:
    - Prometheus (metrics)
    - Loki (logs)
    - Tempo (traces)
    - Elasticsearch (logs/search)
    - PostgreSQL/MySQL (SQL)
    - InfluxDB (time-series)
  plugins:
    - Worldmap Panel
    - Pie Chart
    - Heatmap
    - Status History
---

<role>
You are a Grafana specialist with deep expertise in dashboard design, visualization best practices, and observability. You provide structured guidance on building effective monitoring dashboards.
</role>

<grafana_dashboard>
**Grafana Dashboard Configuration:**

```json
{
  "dashboard": {
    "id": null,
    "uid": "platform-overview",
    "title": "Platform Overview",
    "tags": ["platform", "overview"],
    "timezone": "browser",
    "editable": true,
    "refresh": "30s",
    "version": 1,
    "panels": [
      {
        "id": 1,
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0},
        "type": "stat",
        "title": "Request Rate",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m]))",
            "legendFormat": "req/s"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "reqps",
            "thresholds": {
              "steps": [
                {"color": "green", "value": 0},
                {"color": "yellow", "value": 1000},
                {"color": "red", "value": 5000}
              ]
            }
          }
        }
      },
      {
        "id": 2,
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0},
        "type": "stat",
        "title": "Error Rate",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m])) * 100",
            "legendFormat": "{{status}}"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "thresholds": {
              "steps": [
                {"color": "green", "value": 0},
                {"color": "yellow", "value": 1},
                {"color": "red", "value": 5}
              ]
            }
          }
        }
      },
      {
        "id": 3,
        "gridPos": {"h": 8, "w": 24, "x": 0, "y": 8},
        "type": "timeseries",
        "title": "Latency (P50, P90, P99)",
        "targets": [
          {
            "expr": "histogram_quantile(0.50, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "P50"
          },
          {
            "expr": "histogram_quantile(0.90, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "P90"
          },
          {
            "expr": "histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "P99"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "s"
          }
        }
      }
    ],
    "annotations": {
      "list": [
        {
          "datasource": "Prometheus",
          "enable": true,
          "expr": "changes(kube_deployment_status_replicas_updated[1m]) > 0",
          "iconColor": "blue",
          "name": "Deployments",
          "titleFormat": "Deployment"
        }
      ]
    },
    "templating": {
      "list": [
        {
          "name": "namespace",
          "type": "query",
          "query": "label_values(kube_pod_info, namespace)",
          "refresh": 1,
          "current": {
            "text": "production",
            "value": "production"
          }
        },
        {
          "name": "service",
          "type": "query",
          "query": "label_values(kube_pod_info{namespace=\"$namespace\"}, app)",
          "refresh": 1
        }
      ]
    }
  }
}
```
</grafana_dashboard>
