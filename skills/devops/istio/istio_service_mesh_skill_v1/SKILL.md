---
name: istio_service_mesh_skill_v1
description: Service mesh implementation with Istio for traffic management, security, observability, and resilience patterns in microservices
version: 1.0.0
tags: [istio, service-mesh, microservices, traffic-management, mtls, observability, kubernetes]
stack: devops/service-mesh
category: devops
triggers:
  keywords: [istio, service mesh, traffic management, mtls, circuit breaker, canary, kubernetes]
  filePatterns: [*.yaml, virtualservice/*.yaml, destinationrule/*.yaml]
  commands: [istioctl, kubectl]
  stack: devops/service-mesh
  projectArchetypes: [microservices, cloud-native, enterprise, multi-cluster]
  modes: [greenfield, migration, production]
prerequisites:
  - kubernetes_fundamentals
  - networking_basics
  - docker_basics
recommended_structure:
  directories:
    - istio/
    - istio/config/
    - istio/policies/
    - istio/telemetry/
workflow:
  setup:
    - Install Istio with istioctl
    - Configure namespaces
    - Enable sidecar injection
    - Set up mTLS
  implement:
    - Create VirtualServices
    - Configure DestinationRules
    - Set up Gateway
    - Implement traffic policies
  operate:
    - Monitor with Kiali
    - Configure telemetry
    - Set up alerts
    - Manage certificates
best_practices:
  - Enable mTLS for service-to-service security
  - Use strict mTLS in production
  - Implement proper traffic policies
  - Configure circuit breakers
  - Use retries with proper limits
  - Implement rate limiting
  - Enable distributed tracing
  - Monitor with Kiali and Grafana
  - Use Gateway API for ingress
  - Implement proper timeout policies
anti_patterns:
  - Never skip mTLS in production
  - Don't configure overly aggressive retries
  - Avoid complex routing without testing
  - Don't ignore resource limits
  - Skip sidecar injection only when necessary
  - Don't configure timeouts too short
  - Never ignore certificate expiration
  - Don't skip traffic policies
  - Avoid monolithic gateways
  - Never skip observability setup
scaling_notes: |
  For Istio at scale:

  **Performance:**
  - Tune sidecar resources
  - Use egress gateways
  - Configure connection pooling
  - Optimize mTLS handshakes

  **Multi-Cluster:**
  - Use Istio multi-cluster
  - Configure east-west gateway
  - Implement federation
  - Use global load balancing

  **Security:**
  - Enable PeerAuthentication
  - Configure AuthorizationPolicies
  - Rotate certificates
  - Audit access logs

  **Observability:**
  - Deploy Kiali
  - Configure Prometheus
  - Set up Grafana dashboards
  - Enable access logging

when_not_to_use: |
  Service mesh may not be suitable for:

  **Simple Applications:**
  - Single service or few services
  - Consider simpler solutions

  **Small Clusters:**
  - Resource overhead significant
  - Evaluate cost-benefit

  **Performance Critical:**
  - Sidecar adds latency
  - Consider alternatives

output_template: |
  ## Service Mesh Strategy

  **Mesh:** Istio
  **mTLS:** Strict mode
  **Ingress:** Istio Gateway
  **Observability:** Kiali + Prometheus

  ### Key Decisions
  - **mTLS:** Strict for security
  - **Traffic:** Canary deployments
  - **Resilience:** Circuit breakers
  - **Telemetry:** Full tracing

  ### Trade-offs Considered
  - Istio vs Linkerd: Istio for features
  - Sidecar vs Proxyless: Sidecar for control
  - Strict vs Permissive: Strict for prod

  ### Next Steps
  1. Install Istio
  2. Enable sidecar injection
  3. Configure mTLS
  4. Set up traffic management
  5. Deploy observability
dependencies:
  tools:
    - Istio (service mesh)
    - istioctl (CLI)
    - Kiali (observability)
    - Prometheus (metrics)
    - Grafana (dashboards)
    - Jaeger/Zipkin (tracing)
  components:
    - Pilot (control plane)
    - Envoy (data plane)
    - Citadel (security)
    - Galley (configuration)
---

<role>
You are a service mesh specialist with deep expertise in Istio for traffic management, security, and observability. You provide structured guidance on implementing service mesh patterns following cloud-native best practices.
</role>

<istio_config>
**Istio Configuration:**

```yaml
# Install Istio with minimal profile
# istio-install.yaml
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
metadata:
  name: istio-control-plane
  namespace: istio-system
spec:
  profile: default
  meshConfig:
    accessLogFile: /dev/stdout
    enableTracing: true
    defaultConfig:
      tracing:
        zipkin:
          address: zipkin.istio-system:9411
      proxyMetadata:
        ISTIO_META_DNS_CAPTURE: "true"
    outboundTrafficPolicy:
      mode: REGISTRY_ONLY
  components:
    pilot:
      k8s:
        resources:
          requests:
            cpu: 500m
            memory: 2Gi
          limits:
            cpu: 1000m
            memory: 4Gi
    proxy:
      k8s:
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 256Mi

---
# Enable strict mTLS
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: istio-system
spec:
  mtls:
    mode: STRICT

---
# VirtualService for traffic routing
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: myapp-vs
  namespace: production
spec:
  hosts:
    - myapp.example.com
    - myapp.production.svc.cluster.local
  gateways:
    - myapp-gateway
  http:
    - match:
        - headers:
            x-canary:
              exact: "true"
      route:
        - destination:
            host: myapp-canary
            port:
              number: 80
    - route:
        - destination:
            host: myapp-stable
            port:
              number: 80
          weight: 90
        - destination:
            host: myapp-canary
            port:
              number: 80
          weight: 10
      retries:
        attempts: 3
        perTryTimeout: 2s
        retryOn: gateway-error,connect-failure,refused-stream
      timeout: 10s

---
# DestinationRule for circuit breaker
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: myapp-dr
  namespace: production
spec:
  host: myapp.production.svc.cluster.local
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        h2UpgradePolicy: UPGRADE
        http1MaxPendingRequests: 100
        http2MaxRequests: 1000
        maxRequestsPerConnection: 10
        maxRetries: 3
    outlierDetection:
      consecutive5xxErrors: 5
      consecutiveGatewayErrors: 5
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
      minHealthPercent: 30
    loadBalancer:
      simple: LEAST_CONN

---
# Gateway for ingress
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: myapp-gateway
  namespace: production
spec:
  selector:
    istio: ingressgateway
  servers:
    - port:
        number: 80
        name: http
        protocol: HTTP
      hosts:
        - myapp.example.com
      tls:
        httpsRedirect: true
    - port:
        number: 443
        name: https
        protocol: HTTPS
      hosts:
        - myapp.example.com
      tls:
        mode: SIMPLE
        credentialName: myapp-tls-secret

---
# AuthorizationPolicy for RBAC
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: myapp-authz
  namespace: production
spec:
  selector:
    matchLabels:
      app: myapp
  action: ALLOW
  rules:
    - from:
        - source:
            principals:
              - cluster.local/ns/istio-system/sa/istio-ingressgateway-service-account
      to:
        - operation:
            methods: ["GET", "POST"]
            paths: ["/api/*"]

---
# Rate limiting with EnvoyFilter
apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: rate-limit
  namespace: production
spec:
  workloadSelector:
    labels:
      app: myapp
  configPatches:
    - applyTo: HTTP_FILTER
      match:
        context: SIDECAR_INBOUND
        listener:
          filterChain:
            filter:
              name: envoy.filters.network.http_connection_manager
      patch:
        operation: INSERT_BEFORE
        value:
          name: envoy.filters.http.local_ratelimit
          typed_config:
            "@type": type.googleapis.com/udpa.type.v1.TypedStruct
            type_url: type.googleapis.com/envoy.extensions.filters.http.local_ratelimit.v3.LocalRateLimit
            value:
              stat_prefix: http_local_rate_limiter
              token_bucket:
                max_tokens: 100
                tokens_per_fill: 100
                fill_interval: 60s
              filter_enabled:
                runtime_key: local_rate_limit_enabled
                default_value:
                  numerator: 100
                  denominator: HUNDRED
              filter_enforced:
                runtime_key: local_rate_limit_enforced
                default_value:
                  numerator: 100
                  denominator: HUNDRED
```
</istio_config>
