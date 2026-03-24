---
name: metrics_skill_v1
description: Metrics collection, aggregation, and visualization with Prometheus, Grafana, and Cloud Monitoring for production observability
version: 1.0.0
tags: [metrics, prometheus, grafana, monitoring, observability, alerting, dashboards]
stack: observability/metrics
category: observability
triggers:
  keywords: [metrics, prometheus, grafana, monitoring, alerting, dashboard, observability]
  filePatterns: [prometheus/*.yaml, grafana/*.json, alertmanager/*.yaml]
  commands: [promtool, prometheus, grafana-cli]
  stack: observability/metrics
  projectArchetypes: [cloud-native, microservices, saas, enterprise]
  modes: [greenfield, production, optimization]
prerequisites:
  - linux_basics
  - networking_fundamentals
  - basic_scripting
recommended_structure:
  directories:
    - monitoring/
    - monitoring/prometheus/
    - monitoring/grafana/
    - monitoring/alerts/
workflow:
  setup:
    - Deploy Prometheus stack
    - Configure service discovery
    - Set up Grafana
    - Create dashboards
  implement:
    - Instrument applications
    - Define SLOs/SLIs
    - Create alert rules
    - Configure alertmanager
  operate:
    - Monitor metrics
    - Review alerts
    - Optimize queries
    - Update dashboards
best_practices:
  - Use RED metrics (Rate, Errors, Duration)
  - Implement USE metrics for infrastructure
  - Define SLOs with error budgets
  - Use meaningful labels
  - Keep cardinality low
  - Implement recording rules
  - Configure appropriate scrape intervals
  - Use federation for scale
  - Set up alert routing
  - Create runbooks for alerts
anti_patterns:
  - Never use high cardinality labels
  - Don't scrape too frequently
  - Avoid complex PromQL in alerts
  - Don't skip alert deduplication
  - Never ignore metric naming conventions
  - Don't create too many alerts
  - Avoid storing raw metrics long-term
  - Don't skip recording rules
  - Never skip runbooks
  - Don't ignore metric retention
scaling_notes: |
  For metrics at scale:

  **Prometheus Scaling:**
  - Use federation
  - Implement Thanos/Cortex
  - Configure remote write
  - Shard by namespace

  **Storage:**
  - Use TSDB optimization
  - Configure retention
  - Downsample old data
  - Use object storage

  **Query Performance:**
  - Use recording rules
  - Optimize PromQL
  - Cache frequently used queries
  - Limit query range

  **Alerting:**
  - Implement alert routing
  - Use inhibition rules
  - Configure grouping
  - Set up escalation

when_not_to_use: |
  Prometheus may not be suitable for:

  **High Cardinality Data:**
  - Consider specialized solutions
  - Use histograms carefully

  **Long-Term Storage:**
  - Use Thanos/Cortex
  - Consider managed solutions

  **Billing/Accounting:**
  - Need exact counts
  - Use dedicated systems

output_template: |
  ## Metrics Strategy

  **Collection:** Prometheus
  **Visualization:** Grafana
  **Alerting:** Alertmanager
  **Storage:** Thanos for long-term

  ### Key Decisions
  - **Metrics:** RED + USE methodology
  - **SLOs:** 99.9% availability
  - **Alerts:** Page only for actionable
  - **Dashboards:** Per service + overview

  ### Trade-offs Considered
  - Pull vs Push: Pull for control
  - Self-hosted vs Managed: Based on team
  - Prometheus vs VictoriaMetrics: Scale needs

  ### Next Steps
  1. Deploy Prometheus stack
  2. Instrument applications
  3. Create dashboards
  4. Define SLOs
  5. Configure alerts
dependencies:
  tools:
    - Prometheus (metrics collection)
    - Grafana (visualization)
    - Alertmanager (alerting)
    - Thanos/Cortex (long-term storage)
    - promtool (validation)
  exporters:
    - node_exporter (system metrics)
    - kube-state-metrics (K8s)
    - blackbox_exporter (probing)
    - pushgateway (batch jobs)
  integrations:
    - Slack/PagerDuty (notifications)
    - Loki (logs correlation)
    - Tempo/Jaeger (traces)
---

<role>
You are a metrics specialist with deep expertise in Prometheus, Grafana, and monitoring best practices. You provide structured guidance on implementing comprehensive metrics collection and alerting following SRE principles.
</role>

<execution_flow>
1. **Prometheus Setup**
   - Deploy Prometheus
   - Configure scrape targets
   - Set up service discovery
   - Configure retention

2. **Grafana Configuration**
   - Deploy Grafana
   - Add data sources
   - Create dashboards
   - Set up permissions

3. **Application Instrumentation**
   - Add metrics libraries
   - Define custom metrics
   - Implement health checks
   - Expose metrics endpoint

4. **SLO Definition**
   - Identify critical paths
   - Define SLIs
   - Set SLO targets
   - Calculate error budgets

5. **Alert Configuration**
   - Create alert rules
   - Configure Alertmanager
   - Set up routing
   - Write runbooks

6. **Operations**
   - Monitor dashboards
   - Review alerts
   - Optimize queries
   - Update SLOs
</execution_flow>

<prometheus_config>
**Prometheus Configuration:**

```yaml
# prometheus.yml
global:
  scrape_interval: 30s
  evaluation_interval: 30s
  external_labels:
    cluster: production
    environment: prod

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

rule_files:
  - /etc/prometheus/rules/*.yaml

scrape_configs:
  # Prometheus self-monitoring
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
  
  # Kubernetes API server
  - job_name: 'kubernetes-apiservers'
    kubernetes_sd_configs:
      - role: endpoints
    scheme: https
    tls_config:
      ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
    relabel_configs:
      - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_service_name, __meta_kubernetes_endpoint_port_name]
        action: keep
        regex: default;kubernetes;https
  
  # Kubernetes nodes
  - job_name: 'kubernetes-nodes'
    scheme: https
    tls_config:
      ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
    kubernetes_sd_configs:
      - role: node
    relabel_configs:
      - action: labelmap
        regex: __meta_kubernetes_node_label_(.+)
      - target_label: __address__
        replacement: kubernetes.default.svc:443
      - source_labels: [__meta_kubernetes_node_name]
        regex: (.+)
        target_label: __metrics_path__
        replacement: /api/v1/nodes/${1}/proxy/metrics
  
  # Kubernetes pods
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        target_label: __address__
      - action: labelmap
        regex: __meta_kubernetes_pod_label_(.+)
      - source_labels: [__meta_kubernetes_namespace]
        action: replace
        target_label: kubernetes_namespace
      - source_labels: [__meta_kubernetes_pod_name]
        action: replace
        target_label: kubernetes_pod_name
  
  # ServiceMonitor for custom services
  - job_name: 'service-monitors'
    kubernetes_sd_configs:
      - role: endpoints
    relabel_configs:
      - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scrape]
        action: keep
        regex: true

---
# Alert rules
# rules/alerts.yaml
groups:
  - name: application-alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m])) 
          / sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: High error rate detected
          description: Error rate is {{ $value | humanizePercentage }}
          runbook_url: https://runbooks.example.com/high-error-rate
      
      - alert: HighLatency
        expr: |
          histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service)) 
          > 1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: High latency detected
          description: P99 latency is {{ $value | humanizeDuration }}
          runbook_url: https://runbooks.example.com/high-latency
      
      - alert: PodCrashLooping
        expr: |
          rate(kube_pod_container_status_restarts_total[15m]) * 60 * 5 > 0
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: Pod is crash looping
          description: Pod {{ $labels.namespace }}/{{ $labels.pod }} is restarting
          runbook_url: https://runbooks.example.com/pod-crash-looping

  - name: infrastructure-alerts
    rules:
      - alert: HighCPUUsage
        expr: |
          100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: High CPU usage
          description: CPU usage is above 80%
      
      - alert: HighMemoryUsage
        expr: |
          (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 85
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: High memory usage
          description: Memory usage is above 85%
      
      - alert: DiskSpaceLow
        expr: |
          (node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100 < 15
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: Disk space low
          description: Disk space is below 15%

---
# Recording rules for performance
# rules/recording.yaml
groups:
  - name: recording-rules
    interval: 30s
    rules:
      - record: job:http_requests_total:rate5m
        expr: sum(rate(http_requests_total[5m])) by (job)
      
      - record: job:http_request_duration_seconds:avg5m
        expr: avg(rate(http_request_duration_seconds_sum[5m])) by (job) 
              / avg(rate(http_request_duration_seconds_count[5m])) by (job)
      
      - record: service:error_rate:ratio_rate5m
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m])) by (service)
          / sum(rate(http_requests_total[5m])) by (service)
```
</prometheus_config>

<grafana_dashboard>
**Grafana Dashboard (JSON snippet):**

```json
{
  "dashboard": {
    "title": "Application Overview",
    "tags": ["application", "overview"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m])) by (service)",
            "legendFormat": "{{service}}"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) by (service) / sum(rate(http_requests_total[5m])) by (service) * 100",
            "legendFormat": "{{service}} %"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0}
      },
      {
        "id": 3,
        "title": "Latency (P50, P90, P99)",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.50, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service))",
            "legendFormat": "{{service}} P50"
          },
          {
            "expr": "histogram_quantile(0.90, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service))",
            "legendFormat": "{{service}} P90"
          },
          {
            "expr": "histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service))",
            "legendFormat": "{{service}} P99"
          }
        ],
        "gridPos": {"h": 8, "w": 24, "x": 0, "y": 8}
      },
      {
        "id": 4,
        "title": "SLO Status",
        "type": "stat",
        "targets": [
          {
            "expr": "1 - (sum(rate(http_requests_total{status=~\"5..\"}[30d])) / sum(rate(http_requests_total[30d])))",
            "legendFormat": "Availability"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "thresholds": {
              "steps": [
                {"color": "red", "value": 0},
                {"color": "yellow", "value": 0.99},
                {"color": "green", "value": 0.999}
              ]
            }
          }
        },
        "gridPos": {"h": 4, "w": 8, "x": 0, "y": 16}
      }
    ],
    "time": {"from": "now-1h", "to": "now"},
    "refresh": "30s"
  }
}
```
</grafana_dashboard>
