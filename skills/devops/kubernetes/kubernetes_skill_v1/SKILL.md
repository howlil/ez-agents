---
name: kubernetes_skill_v1
description: Kubernetes cluster management, workload deployment, services, ingress, Helm charts, and production-ready K8s patterns
version: 1.0.0
tags: [kubernetes, k8s, containers, orchestration, helm, kubectl, devops]
stack: devops/kubernetes
category: devops
triggers:
  keywords: [kubernetes, k8s, kubectl, helm, deployment, service, ingress, pod, container orchestration]
  filePatterns: [*.yaml, *.yml, Chart.yaml, values.yaml, k8s/, manifests/]
  commands: [kubectl, helm, kustomize]
  stack: devops/kubernetes
  projectArchetypes: [microservices, saas, enterprise, cloud-native]
  modes: [greenfield, migration, production]
prerequisites:
  - docker_fundamentals
  - networking_basics
  - linux_basics
  - yaml_syntax
recommended_structure:
  directories:
    - k8s/
    - k8s/base/
    - k8s/overlays/
    - k8s/charts/
    - manifests/
workflow:
  setup:
    - Install kubectl and helm
    - Configure cluster access
    - Set up namespaces
    - Configure RBAC
  develop:
    - Create Kubernetes manifests
    - Define deployments and services
    - Configure ConfigMaps and Secrets
    - Set up ingress
  deploy:
    - Apply manifests with kubectl/helm
    - Monitor rollout status
    - Verify health checks
    - Set up monitoring
best_practices:
  - Use labels consistently for resource organization
  - Implement resource requests and limits
  - Use readiness and liveness probes
  - Store secrets in Secrets (not ConfigMaps)
  - Use namespaces for environment separation
  - Implement horizontal pod autoscaling
  - Use rolling updates with proper maxSurge/maxUnavailable
  - Configure pod disruption budgets
  - Use network policies for security
  - Implement proper logging and monitoring
anti_patterns:
  - Never run containers as root in pods
  - Don't skip resource limits
  - Avoid using :latest tags
  - Don't use hostNetwork unless necessary
  - Avoid monolithic deployments (split by service)
  - Don't skip health checks
  - Never store secrets in plain text
  - Don't ignore pod security policies
  - Avoid tight coupling between services
  - Never skip backup for stateful workloads
scaling_notes: |
  For Kubernetes at scale:

  **Cluster Design:**
  - Use node pools for workload separation
  - Implement cluster autoscaling
  - Use pod autoscaling (HPA, VPA)
  - Consider multi-cluster for isolation

  **Resource Management:**
  - Set appropriate requests/limits
  - Use resource quotas per namespace
  - Implement limit ranges
  - Monitor resource utilization

  **Networking:**
  - Use service mesh for complex routing
  - Implement network policies
  - Configure ingress controllers
  - Use DNS properly

  **Security:**
  - Enable pod security standards
  - Use RBAC with least privilege
  - Scan images before deployment
  - Implement secrets management

when_not_to_use: |
  Kubernetes may not be suitable for:

  **Simple Applications:**
  - Single service deployments
  - Consider Docker Compose or ECS

  **Small Teams:**
  - High operational overhead
  - Consider managed services (Vercel, Railway)

  **Stateful Workloads:**
  - Requires careful design
  - Consider managed databases

  **Budget Constraints:**
  - K8s clusters are expensive to run
  - Consider serverless alternatives

output_template: |
  ## Kubernetes Deployment Strategy

  **Cluster:** EKS/GKE/AKS
  **Package:** Helm Charts
  **Scaling:** HPA with metrics
  **Network:** Service Mesh (Istio)

  ### Key Decisions
  - **Deployments:** Rolling update strategy
  - **Services:** ClusterIP + Ingress
  - **Config:** ConfigMaps + Secrets
  - **Monitoring:** Prometheus + Grafana

  ### Trade-offs Considered
  - Managed vs Self-hosted: Managed for ops simplicity
  - Helm vs Kustomize: Helm for packaging
  - Service Mesh: Based on complexity needs

  ### Next Steps
  1. Create cluster
  2. Write manifests
  3. Package with Helm
  4. Deploy to cluster
  5. Configure monitoring
dependencies:
  tools:
    - kubectl (K8s CLI)
    - helm (package manager)
    - kustomize (configuration management)
    - skaffold (development)
    - lens (IDE)
  clusters:
    - EKS (AWS)
    - GKE (Google)
    - AKS (Azure)
    - Kind/K3d (local)
  addons:
    - ingress-nginx (ingress controller)
    - cert-manager (TLS certificates)
    - metrics-server (HPA metrics)
    - external-dns (DNS automation)
---

<role>
You are a Kubernetes specialist with deep expertise in cluster management, workload deployment, and production-ready K8s patterns. You provide structured guidance on building reliable, scalable Kubernetes deployments following industry best practices.
</role>

<execution_flow>
1. **Cluster Setup**
   - Choose managed or self-hosted
   - Configure node pools
   - Set up networking
   - Configure access (RBAC)

2. **Workload Definition**
   - Create Deployments
   - Define Services
   - Configure ConfigMaps/Secrets
   - Set up health probes

3. **Ingress & Networking**
   - Configure Ingress
   - Set up TLS
   - Define NetworkPolicies
   - Configure DNS

4. **Scaling Configuration**
   - Set resource requests/limits
   - Configure HPA
   - Define PodDisruptionBudgets
   - Plan cluster autoscaling

5. **Security Hardening**
   - Configure RBAC
   - Enable pod security standards
   - Scan images
   - Manage secrets

6. **Observability**
   - Deploy monitoring stack
   - Configure logging
   - Set up alerting
   - Create dashboards
</execution_flow>

<kubernetes_manifests>
**Kubernetes Manifests:**

```yaml
# k8s/base/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: myapp
  labels:
    name: myapp
    environment: production

---
# k8s/base/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: myapp-config
  namespace: myapp
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  PORT: "3000"
  DATABASE_HOST: "postgres.myapp.svc.cluster.local"
  REDIS_HOST: "redis.myapp.svc.cluster.local"

---
# k8s/base/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: myapp-secret
  namespace: myapp
type: Opaque
stringData:
  DATABASE_PASSWORD: "changeme"
  JWT_SECRET: "changeme"
  API_KEY: "changeme"

---
# k8s/base/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-api
  namespace: myapp
  labels:
    app: myapp
    component: api
    version: v1
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
      component: api
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: myapp
        component: api
        version: v1
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: myapp-api
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001
      containers:
        - name: api
          image: ghcr.io/user/myapp:latest
          imagePullPolicy: Always
          ports:
            - name: http
              containerPort: 3000
              protocol: TCP
          envFrom:
            - configMapRef:
                name: myapp-config
            - secretRef:
                name: myapp-secret
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3
          volumeMounts:
            - name: tmp
              mountPath: /tmp
      volumes:
        - name: tmp
          emptyDir: {}
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: myapp
                    component: api
                topologyKey: kubernetes.io/hostname

---
# k8s/base/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp-api
  namespace: myapp
  labels:
    app: myapp
    component: api
spec:
  type: ClusterIP
  ports:
    - port: 80
      targetPort: http
      protocol: TCP
      name: http
  selector:
    app: myapp
    component: api

---
# k8s/base/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp-api-hpa
  namespace: myapp
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp-api
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
        - type: Pods
          value: 4
          periodSeconds: 15
      selectPolicy: Max

---
# k8s/base/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-ingress
  namespace: myapp
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  tls:
    - hosts:
        - api.example.com
      secretName: myapp-tls
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: myapp-api
                port:
                  number: 80

---
# k8s/base/pdb.yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: myapp-api-pdb
  namespace: myapp
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: myapp
      component: api
```
</kubernetes_manifests>

<helm_chart>
**Helm Chart Structure:**

```
charts/
  myapp/
    Chart.yaml
    values.yaml
    values/
      production.yaml
      staging.yaml
    templates/
      _helpers.tpl
      deployment.yaml
      service.yaml
      hpa.yaml
      ingress.yaml
      configmap.yaml
      secret.yaml
      pdb.yaml
      serviceaccount.yaml
```

**Chart.yaml:**
```yaml
apiVersion: v2
name: myapp
description: MyApp Helm Chart
type: application
version: 1.0.0
appVersion: "1.0.0"
keywords:
  - myapp
  - api
maintainers:
  - name: Team
    email: team@example.com
dependencies:
  - name: postgresql
    version: 12.x
    repository: https://charts.bitnami.com/bitnami
    condition: postgresql.enabled
  - name: redis
    version: 17.x
    repository: https://charts.bitnami.com/bitnami
    condition: redis.enabled
```

**values.yaml:**
```yaml
replicaCount: 3

image:
  repository: ghcr.io/user/myapp
  tag: latest
  pullPolicy: Always

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: api.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: myapp-tls
      hosts:
        - api.example.com

resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 100m
    memory: 128Mi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 20
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80

postgresql:
  enabled: false

redis:
  enabled: false
```

**Deploy with Helm:**
```bash
# Install
helm install myapp ./charts/myapp \
  --namespace myapp \
  --create-namespace \
  -f charts/myapp/values/production.yaml

# Upgrade
helm upgrade myapp ./charts/myapp \
  --namespace myapp \
  -f charts/myapp/values/production.yaml

# Rollback
helm rollback myapp 1 --namespace myapp

# Status
helm status myapp --namespace myapp
```
</helm_chart>
