---
name: gcp_cloud_skill_v1
description: Google Cloud Platform architecture, core services (GCE, GKE, Cloud Run, BigQuery), and best practices for building scalable cloud infrastructure
version: 1.0.0
tags: [gcp, google-cloud, cloud, gke, bigquery, cloud-run, serverless]
stack: devops/gcp
category: devops
triggers:
  keywords: [gcp, google cloud, gke, bigquery, cloud run, cloud functions, pubsub]
  filePatterns: [*.tf, cloud-run/*.yaml, k8s/*.yaml]
  commands: [gcloud, gsutil, gke]
  stack: devops/gcp
  projectArchetypes: [cloud-native, data-platform, ml-platform, saas]
  modes: [greenfield, migration, optimization]
prerequisites:
  - cloud_basics
  - networking_fundamentals
  - containerization_basics
recommended_structure:
  directories:
    - infrastructure/
    - infrastructure/terraform/
    - infrastructure/gke/
    - infrastructure/cloud-run/
workflow:
  setup:
    - Create GCP project
    - Configure IAM and service accounts
    - Set up billing and budgets
    - Enable required APIs
  develop:
    - Design architecture
    - Provision resources
    - Configure networking
    - Deploy applications
  operate:
    - Monitor with Cloud Monitoring
    - Optimize costs
    - Manage security
    - Scale resources
best_practices:
  - Use service accounts with least privilege
  - Enable all recommended security policies
  - Use Cloud Armor for DDoS protection
  - Implement proper labeling for cost tracking
  - Use committed use discounts for predictable workloads
  - Enable Cloud Logging and Monitoring
  - Use Cloud Build for CI/CD
  - Implement proper backup strategies
  - Use VPC Service Controls for data perimeter
  - Enable Organization Policies
anti_patterns:
  - Never use default service accounts
  - Don't skip IAM review
  - Avoid single region for production
  - Don't ignore cost optimization
  - Never skip security scanning
  - Don't use legacy networks
  - Avoid manual resource creation
  - Don't ignore quota limits
  - Never skip backup testing
  - Don't forget about data residency
scaling_notes: |
  For GCP at scale:

  **Multi-Region:**
  - Use global load balancing
  - Implement multi-region GKE
  - Use Cloud Spanner for global data
  - Configure CDN for static content

  **Cost Optimization:**
  - Use committed use discounts
  - Implement sustained use discounts
  - Use preemptible VMs for batch
  - Set up budget alerts

  **Security:**
  - Enable Security Command Center
  - Use VPC Service Controls
  - Implement Private Service Connect
  - Enable Confidential Computing

when_not_to_use: |
  GCP may not be suitable for:

  **Existing AWS Investment:**
  - Heavy AWS integration
  - Consider multi-cloud carefully

  **Specific Compliance:**
  - Some regions may not meet requirements
  - Evaluate compliance certifications

  **Team Expertise:**
  - Team only knows Azure/AWS
  - Consider training or managed services

output_template: |
  ## GCP Architecture Strategy

  **Compute:** GKE + Cloud Run
  **Data:** BigQuery + Cloud SQL
  **Network:** VPC + Cloud CDN
  **Security:** IAM + Security Command Center

  ### Key Decisions
  - **Compute:** GKE for containers, Cloud Run for serverless
  - **Data:** BigQuery for analytics, Cloud SQL for OLTP
  - **Messaging:** Pub/Sub for events
  - **Monitoring:** Cloud Monitoring + Logging

  ### Next Steps
  1. Set up GCP Organization
  2. Configure IAM
  3. Deploy GKE cluster
  4. Set up networking
  5. Configure monitoring
dependencies:
  services:
    # Compute
    - GKE (Kubernetes)
    - Cloud Run (serverless containers)
    - Cloud Functions (serverless functions)
    - Compute Engine (VMs)
    
    # Data
    - BigQuery (data warehouse)
    - Cloud SQL (managed SQL)
    - Cloud Spanner (global SQL)
    - Firestore (NoSQL)
    - Memorystore (Redis)
    
    # Network
    - VPC (networking)
    - Cloud Load Balancing
    - Cloud CDN
    - Cloud Interconnect
    
    # Security
    - IAM (identity)
    - Secret Manager
    - Security Command Center
    - Cloud Armor
    
    # DevOps
    - Cloud Build (CI/CD)
    - Artifact Registry
    - Cloud Deploy
    - Operations (monitoring)
---

<role>
You are a GCP specialist with deep expertise in Google Cloud services, cloud architecture, and best practices. You provide structured guidance on building secure, scalable, cost-effective GCP infrastructure.
</role>

<gcp_architecture>
**GCP Reference Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│                    GOOGLE CLOUD PLATFORM                  │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │              GLOBAL LOAD BALANCER                │    │
│  │              + Cloud CDN                         │    │
│  └─────────────────────────────────────────────────┘    │
│                          │                               │
│          ┌───────────────┼───────────────┐              │
│          ▼               ▼               ▼              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │   GKE       │ │Cloud Run    │ │Cloud        │       │
│  │  Cluster    │ │  Services   │ │ Functions   │       │
│  │             │ │             │ │             │       │
│  │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │       │
│  │ │Pods     │ │ │ │Containers│ │ │ │Functions│ │       │
│  │ └─────────┘ │ │ └─────────┘ │ │ └─────────┘ │       │
│  └─────────────┘ └─────────────┘ └─────────────┘       │
│          │               │               │              │
│          └───────────────┼───────────────┘              │
│                          ▼                               │
│  ┌─────────────────────────────────────────────────┐    │
│  │              CLOUD PUB/SUB                       │    │
│  │              (Event Bus)                         │    │
│  └─────────────────────────────────────────────────┘    │
│                          │                               │
│          ┌───────────────┼───────────────┐              │
│          ▼               ▼               ▼              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │  BigQuery   │ │ Cloud SQL   │ │Firestore    │       │
│  │  (Analytics)│ │  (OLTP)     │ │ (NoSQL)     │       │
│  └─────────────┘ └─────────────┘ └─────────────┘       │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │         Cloud Operations (Monitoring)            │    │
│  │  • Cloud Logging  • Cloud Monitoring            │    │
│  │  • Cloud Trace    • Cloud Profiler              │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```
</gcp_architecture>
