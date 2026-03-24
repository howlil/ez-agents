---
name: alerting_skill_v1
description: Alerting systems design, alert routing, on-call management, incident response, and alert fatigue prevention for production operations
version: 1.0.0
tags: [alerting, oncall, incident-response, pagerduty, opsgenie, monitoring, observability]
stack: observability/alerting
category: observability
triggers:
  keywords: [alerting, alerts, on-call, pagerduty, opsgenie, incident, escalation]
  filePatterns: [alertmanager/*.yaml, alerts/*.yaml, oncall/*.yaml]
  commands: [amtool, pagerduty-cli, opsgenie-cli]
  stack: observability/alerting
  projectArchetypes: [saas, enterprise, 24x7-operations, critical-systems]
  modes: [greenfield, production, optimization]
prerequisites:
  - monitoring_basics
  - incident_management
  - communication_basics
recommended_structure:
  directories:
    - alerting/
    - alerting/rules/
    - alerting/routes/
    - oncall/
    - runbooks/
workflow:
  setup:
    - Choose alerting platform
    - Configure notification channels
    - Set up escalation policies
    - Define on-call schedule
  implement:
    - Create alert rules
    - Configure routing
    - Write runbooks
    - Set up inhibition
  operate:
    - Monitor alert fatigue
    - Review false positives
    - Update thresholds
    - Conduct post-mortems
best_practices:
  - Alert on symptoms not causes
  - Use meaningful alert names
  - Include runbook links
  - Set appropriate severity levels
  - Implement alert routing
  - Use inhibition rules
  - Group related alerts
  - Set up escalation policies
  - Document on-call procedures
  - Review and tune alerts regularly
anti_patterns:
  - Never alert on everything
  - Don't skip runbooks
  - Avoid alerting on transient issues
  - Don't ignore alert fatigue
  - Never skip post-mortems
  - Don't have too many severity levels
  - Avoid duplicate alerts
  - Don't skip testing alerts
  - Never ignore false positives
  - Don't forget about quiet hours
scaling_notes: |
  For alerting at scale:

  **Routing:**
  - Implement team-based routing
  - Use label-based routing
  - Set up cross-team escalation
  - Configure maintenance windows

  **Management:**
  - Track alert metrics
  - Monitor alert fatigue
  - Regular alert review
  - Quarterly alert cleanup

  **On-Call:**
  - Rotate on-call fairly
  - Limit on-call duration
  - Provide backup coverage
  - Compensate on-call properly

when_not_to_use: |
  Alerting may not be suitable for:

  **Non-Critical Systems:**
  - Business hours only
  - Consider email notifications

  **Development Environments:**
  - Use logging instead
  - Alert on production only

  **Early Stage:**
  - Start with critical alerts only
  - Add more as system matures

output_template: |
  ## Alerting Strategy

  **Platform:** PagerDuty/OpsGenie
  **Routing:** Label-based
  **Escalation:** 3-tier
  **On-Call:** Weekly rotation

  ### Key Decisions
  - **Severity:** Critical, Error, Warning, Info
  - **Routing:** By service/team
  - **Escalation:** 15min → 30min → 1hr
  - **Runbooks:** Required for all alerts

  ### Next Steps
  1. Set up alerting platform
  2. Define alert rules
  3. Configure routing
  4. Write runbooks
  5. Train team
dependencies:
  platforms:
    - PagerDuty (incident management)
    - OpsGenie (Atlassian)
    - VictorOps (Splunk On-Call)
    - Incident.io (modern)
  tools:
    - Alertmanager (Prometheus)
    - Grafana Alerting
    - amtool (CLI)
  integrations:
    - Slack/Teams (notifications)
    - Jira (ticketing)
    - Statuspage (status)
---

<role>
You are an alerting specialist with deep expertise in alert management, on-call operations, and incident response. You provide structured guidance on building effective alerting systems that reduce alert fatigue while ensuring critical issues are addressed.
</role>

<alertmanager_config>
**Alertmanager Configuration:**

```yaml
# alertmanager.yml
global:
  resolve_timeout: 5m
  smtp_smarthost: 'smtp.example.com:587'
  smtp_from: 'alertmanager@example.com'
  slack_api_url: 'https://hooks.slack.com/services/xxx'
  pagerduty_url: 'https://events.pagerduty.com/v2/enqueue'

templates:
  - '/etc/alertmanager/templates/*.tmpl'

route:
  receiver: 'default-receiver'
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  
  routes:
    # Critical alerts go to PagerDuty immediately
    - match:
        severity: critical
      receiver: 'pagerduty-critical'
      continue: true
    
    # Database alerts go to DB team
    - match:
        team: database
      receiver: 'database-team'
      routes:
        - match:
            severity: critical
          receiver: 'pagerduty-database'
    
    # Platform alerts go to platform team
    - match:
        team: platform
      receiver: 'platform-team'
    
    # Business hours only for warnings
    - match:
        severity: warning
      receiver: 'slack-warnings'
      active_time_intervals:
        - business-hours

receivers:
  - name: 'default-receiver'
    email_configs:
      - to: 'oncall@example.com'
        send_resolved: true

  - name: 'pagerduty-critical'
    pagerduty_configs:
      - service_key: '<pagerduty-service-key>'
        severity: critical
        description: '{{ .CommonAnnotations.summary }}'
        details:
          firing: '{{ template "pagerduty.default.instances" .Alerts.Firing }}'
          resolved: '{{ template "pagerduty.default.instances" .Alerts.Resolved }}'

  - name: 'slack-warnings'
    slack_configs:
      - channel: '#alerts-warnings'
        send_resolved: true
        title: '{{ .Status | toUpper }}: {{ .CommonLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'

  - name: 'database-team'
    email_configs:
      - to: 'database-team@example.com'
    slack_configs:
      - channel: '#database-alerts'

inhibit_rules:
  # If critical alert is firing, inhibit warning alerts
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'cluster', 'service']
  
  # If cluster is down, inhibit all node alerts
  - source_match:
      alertname: 'ClusterDown'
    target_match_re:
      alertname: 'Node.*'
    equal: ['cluster']

# Time intervals
time_intervals:
  - name: business-hours
    time_intervals:
      - weekdays: ['monday:friday']
        times:
          - start_time: '09:00'
            end_time: '18:00'
```
</alertmanager_config>

<alert_rules>
**Alert Rules:**

```yaml
# alerts/slo-alerts.yaml
groups:
  - name: SLO alerts
    rules:
      - alert: HighErrorRate
        expr: |
          (
            sum(rate(http_requests_total{status=~"5.."}[5m]))
            /
            sum(rate(http_requests_total[5m]))
          ) > 0.01
        for: 5m
        labels:
          severity: critical
          team: platform
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }} (threshold: 1%)"
          runbook_url: "https://runbooks.example.com/high-error-rate"
          dashboard: "https://grafana.example.com/d/error-dashboard"

      - alert: HighLatency
        expr: |
          histogram_quantile(0.99, 
            sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service)
          ) > 1
        for: 10m
        labels:
          severity: warning
          team: platform
        annotations:
          summary: "High latency detected"
          description: "P99 latency is {{ $value | humanizeDuration }} for {{ $labels.service }}"
          runbook_url: "https://runbooks.example.com/high-latency"

      - alert: BurnRateHigh
        expr: |
          (
            (1 - sum(rate(http_requests_total{status=~"5.."}[1h])) 
               / sum(rate(http_requests_total[1h])))
            < 0.999
          )
          and
          (
            (1 - sum(rate(http_requests_total{status=~"5.."}[5m]))
               / sum(rate(http_requests_total[5m])))
            < 0.999
          )
        for: 2h
        labels:
          severity: critical
          team: platform
        annotations:
          summary: "Error budget burn rate too high"
          description: "Burning through error budget too fast"
          runbook_url: "https://runbooks.example.com/burn-rate"

  - name: Infrastructure alerts
    rules:
      - alert: PodCrashLooping
        expr: |
          rate(kube_pod_container_status_restarts_total[15m]) * 60 * 5 > 0
        for: 5m
        labels:
          severity: warning
          team: platform
        annotations:
          summary: "Pod is crash looping"
          description: "Pod {{ $labels.namespace }}/{{ $labels.pod }} is restarting"
          runbook_url: "https://runbooks.example.com/pod-crash-looping"

      - alert: DiskSpaceLow
        expr: |
          (node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100 < 15
        for: 5m
        labels:
          severity: critical
          team: infrastructure
        annotations:
          summary: "Disk space low"
          description: "Disk space is below 15% on {{ $labels.instance }}"
          runbook_url: "https://runbooks.example.com/disk-space"
```
</alert_rules>
