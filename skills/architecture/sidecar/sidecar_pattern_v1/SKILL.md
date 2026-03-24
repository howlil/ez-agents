---
name: sidecar_pattern_v1
description: Sidecar pattern for service mesh, observability, and cross-cutting concerns in microservices
version: 1.0.0
tags: [sidecar, service-mesh, microservices, observability, infrastructure]
category: architecture
triggers:
  keywords: [sidecar, service mesh, envoy, istio, microservices infrastructure]
  projectArchetypes: [microservices, distributed-systems, enterprise]
prerequisites:
  - microservices_basics
  - containerization
  - networking_fundamentals
workflow:
  setup:
    - Choose sidecar proxy
    - Define sidecar responsibilities
    - Configure service mesh
    - Setup observability
  deploy:
    - Sidecar injection
    - Configuration management
    - Traffic policies
    - Security policies
  operate:
    - Monitor sidecars
    - Update configurations
    - Handle failures
best_practices:
  - Use established service mesh (Istio, Linkerd)
  - Keep sidecar lightweight
  - Configure resource limits
  - Implement health checks
  - Monitor sidecar metrics
  - Automate sidecar injection
  - Version sidecar configurations
  - Secure sidecar communication
  - Log sidecar activities
  - Plan sidecar failures
anti_patterns:
  - Never put business logic in sidecar
  - Don't ignore resource overhead
  - Avoid manual sidecar management
  - Don't skip monitoring
  - Never ignore latency impact
  - Don't overuse sidecar responsibilities
  - Avoid tight coupling to sidecar
  - Don't ignore security implications
scaling_notes: |
  Sidecar Scaling:
  - Start with simple proxy
  - Add service mesh features
  - Implement traffic management
  - Add security policies
when_not_to_use: |
  Not for: Monolithic applications, very small microservices deployments, resource-constrained environments
output_template: |
  ## Sidecar Pattern Decision
  **Use Case:** {service mesh | observability | security}
  **Sidecar:** {Envoy, Linkerd-proxy, custom}
  **Mesh:** {Istio, Linkerd, Consul}
dependencies:
  - kubernetes: "For orchestration"
  - service_mesh: "Istio, Linkerd, or similar"
---

<role>
Infrastructure Architect specializing in service mesh and sidecar patterns.
Focus on observability, security, and traffic management.
</role>
