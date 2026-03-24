---
name: distributed_tracing_skill_v1
description: Distributed tracing with Jaeger, Zipkin, and OpenTelemetry for request flow analysis and performance debugging in microservices
version: 1.0.0
tags: [tracing, jaeger, zipkin, opentelemetry, observability, debugging, microservices]
stack: observability/tracing
category: observability
triggers:
  keywords: [tracing, distributed tracing, jaeger, zipkin, opentelemetry, span, trace]
  filePatterns: [otel/*.yaml, tracing/*.yaml]
  commands: [otel-collector, jaeger-query]
  stack: observability/tracing
  projectArchetypes: [microservices, cloud-native, distributed-systems]
  modes: [greenfield, debugging, production]
prerequisites:
  - microservices_basics
  - networking_fundamentals
recommended_structure:
  directories:
    - tracing/
    - tracing/otel/
    - tracing/jaeger/
workflow:
  setup:
    - Deploy OpenTelemetry Collector
    - Set up Jaeger/Zipkin
    - Configure sampling
    - Instrument applications
  implement:
    - Add tracing SDKs
    - Configure propagators
    - Create custom spans
    - Add trace context
  operate:
    - Analyze traces
    - Identify bottlenecks
    - Set up alerts
    - Monitor latency
best_practices:
  - Use OpenTelemetry for vendor neutrality
  - Implement proper context propagation
  - Configure appropriate sampling rates
  - Add meaningful span attributes
  - Correlate traces with logs
  - Set up trace-based alerts
  - Monitor sampling rates
  - Keep trace context consistent
anti_patterns:
  - Never trace sensitive data
  - Don't sample 100% in production
  - Avoid excessive span attributes
  - Don't skip error recording
  - Never ignore trace context
  - Don't create too many spans
  - Avoid tracing without purpose
scaling_notes: |
  For tracing at scale:

  **Sampling:**
  - Use head-based sampling
  - Implement tail-based sampling
  - Sample errors at 100%
  - Adjust rates per service

  **Storage:**
  - Use Elasticsearch for Jaeger
  - Configure retention
  - Implement downsampling
  - Use hot-warm architecture

  **Performance:**
  - Batch span exports
  - Use async exporters
  - Configure buffer sizes
  - Monitor collector load

when_not_to_use: |
  Tracing may not be suitable for:

  **Simple Applications:**
  - Monolithic apps
  - Consider logging only

  **High-Volume Services:**
  - Sampling overhead
  - Consider metrics only

output_template: |
  ## Tracing Strategy

  **Standard:** OpenTelemetry
  **Backend:** Jaeger
  **Sampling:** 10% base, 100% errors
  **Correlation:** Trace ID in logs

  ### Key Decisions
  - **SDK:** OpenTelemetry for portability
  - **Sampling:** Adaptive based on load
  - **Storage:** ES for search capability
  - **Context:** W3C trace context

  ### Next Steps
  1. Deploy OTEL Collector
  2. Set up Jaeger
  3. Instrument services
  4. Configure sampling
  5. Add correlation
dependencies:
  tools:
    - OpenTelemetry (standard)
    - Jaeger (tracing backend)
    - Zipkin (alternative)
    - Tempo (Grafana)
  exporters:
    - OTLP (OpenTelemetry Protocol)
    - Jaeger Thrift
    - Zipkin v2
  integrations:
    - Grafana (visualization)
    - Loki (log correlation)
    - Prometheus (metrics)
---

<role>
You are a distributed tracing specialist with deep expertise in OpenTelemetry, Jaeger, and Zipkin. You provide structured guidance on implementing tracing for microservices debugging and performance analysis.
</role>

<otel_config>
**OpenTelemetry Configuration:**

```yaml
# otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318
  jaeger:
    protocols:
      grpc:
        endpoint: 0.0.0.0:14250
      thrift_http:
        endpoint: 0.0.0.0:14268
  zipkin:
    endpoint: 0.0.0.0:9411

processors:
  batch:
    timeout: 1s
    send_batch_size: 1024
    send_batch_max_size: 2048
  
  memory_limiter:
    check_interval: 1s
    limit_mib: 1000
    spike_limit_mib: 200
  
  probabilistic_sampler:
    sampling_percentage: 10
    hash_seed: 42
  
  tail_sampling:
    decision_wait: 10s
    num_traces: 100000
    policies:
      - name: error-policy
        type: status_code
        status_code:
          status_codes: [ERROR]
      - name: slow-policy
        type: latency
        latency:
          threshold_ms: 1000
      - name: probabilistic-policy
        type: probabilistic
        probabilistic:
          sampling_percentage: 10

exporters:
  jaeger:
    endpoint: jaeger-collector:14250
    tls:
      insecure: true
  
  elasticsearch:
    endpoints: [https://elasticsearch:9200]
    index: otel-traces
    tls:
      insecure: true
  
  logging:
    loglevel: debug

service:
  pipelines:
    traces:
      receivers: [otlp, jaeger, zipkin]
      processors: [memory_limiter, batch, tail_sampling]
      exporters: [jaeger, elasticsearch]
```
</otel_config>
