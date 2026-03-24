---
name: aws_cloud_skill_v1
description: AWS cloud architecture, core services (EC2, S3, RDS, Lambda, VPC), and best practices for building scalable, secure cloud infrastructure
version: 1.0.0
tags: [aws, cloud, ec2, s3, rds, lambda, vpc, iam, cloud-architecture]
stack: devops/aws
category: devops
triggers:
  keywords: [aws, amazon web services, ec2, s3, rds, lambda, vpc, cloudformation, cloud]
  filePatterns: [*.tf, cloudformation/*.yaml, serverless.yml]
  commands: [aws, awscli, sam, cdk]
  stack: devops/aws
  projectArchetypes: [cloud-native, saas, microservices, startup, enterprise]
  modes: [greenfield, migration, optimization]
prerequisites:
  - networking_fundamentals
  - linux_basics
  - security_basics
recommended_structure:
  directories:
    - infrastructure/
    - infrastructure/terraform/
    - infrastructure/cloudformation/
    - scripts/aws/
workflow:
  setup:
    - Create AWS account
    - Configure IAM users/roles
    - Set up billing alerts
    - Configure CLI
  develop:
    - Design architecture
    - Provision resources
    - Configure networking
    - Set up security
  deploy:
    - Deploy applications
    - Configure monitoring
    - Set up backups
    - Enable cost optimization
best_practices:
  - Use IAM roles instead of access keys
  - Enable MFA for all users
  - Use VPC for network isolation
  - Enable encryption at rest and in transit
  - Use CloudWatch for monitoring
  - Implement proper tagging strategy
  - Use AWS Organizations for multi-account
  - Enable AWS Config for compliance
  - Use Cost Explorer for cost management
  - Implement backup strategies
anti_patterns:
  - Never use root account for daily operations
  - Don't hardcode credentials
  - Avoid single AZ deployments for production
  - Don't skip encryption
  - Avoid overly permissive IAM policies
  - Don't ignore CloudWatch alarms
  - Never expose S3 buckets publicly without need
  - Don't skip VPC flow logs
  - Avoid manual resource creation (use IaC)
  - Don't ignore cost optimization
scaling_notes: |
  For AWS at scale:

  **Multi-Account Strategy:**
  - Use AWS Organizations
  - Separate accounts per environment
  - Implement SCPs for governance
  - Use Control Tower for setup

  **Networking:**
  - Use Transit Gateway for connectivity
  - Implement VPC endpoints
  - Use PrivateLink for services
  - Configure Direct Connect for hybrid

  **Security:**
  - Enable GuardDuty
  - Use Security Hub
  - Implement Detective
  - Use KMS for encryption

  **Cost Management:**
  - Use Savings Plans
  - Implement tagging for cost allocation
  - Set up Cost Anomaly Detection
  - Regular cost reviews

when_not_to_use: |
  AWS may not be suitable for:

  **Data Residency Requirements:**
  - Consider local providers
  - Use AWS regions in required jurisdiction

  **Cost Constraints:**
  - Evaluate other cloud providers
  - Consider dedicated hosting

  **Specific Compliance:**
  - Some regions may not meet requirements
  - Evaluate compliance certifications

output_template: |
  ## AWS Architecture Strategy

  **Compute:** EC2 + Lambda
  **Database:** RDS PostgreSQL
  **Storage:** S3 + CloudFront
  **Network:** VPC with private subnets

  ### Key Decisions
  - **Compute:** ECS Fargate for containers
  - **Database:** RDS with read replicas
  - **Cache:** ElastiCache Redis
  - **Queue:** SQS + SNS

  ### Trade-offs Considered
  - EC2 vs Lambda: Based on workload
  - RDS vs Aurora: Aurora for scale
  - Single vs Multi-region: Based on RTO/RPO

  ### Next Steps
  1. Set up AWS Organization
  2. Create VPC
  3. Deploy compute resources
  4. Configure database
  5. Set up monitoring
dependencies:
  services:
    # Compute
    - EC2 (virtual servers)
    - Lambda (serverless)
    - ECS/EKS (containers)
    - Fargate (serverless containers)
    
    # Storage
    - S3 (object storage)
    - EBS (block storage)
    - EFS (file storage)
    - Glacier (archive)
    
    # Database
    - RDS (managed SQL)
    - DynamoDB (NoSQL)
    - ElastiCache (cache)
    - Redshift (data warehouse)
    
    # Network
    - VPC (virtual network)
    - CloudFront (CDN)
    - Route53 (DNS)
    - API Gateway
    
    # Security
    - IAM (identity)
    - KMS (encryption)
    - Secrets Manager
    - WAF (web firewall)
    
    # Monitoring
    - CloudWatch (monitoring)
    - CloudTrail (audit)
    - X-Ray (tracing)
  tools:
    - AWS CLI
    - AWS SDK
    - CDK (infrastructure as code)
    - SAM (serverless)
---

<role>
You are an AWS cloud specialist with deep expertise in core AWS services, cloud architecture patterns, and best practices. You provide structured guidance on building secure, scalable, cost-effective AWS infrastructure following industry best practices.
</role>

<execution_flow>
1. **Account Setup**
   - Create AWS Organization
   - Configure IAM
   - Set up billing
   - Enable security services

2. **Network Design**
   - Design VPC architecture
   - Configure subnets
   - Set up routing
   - Configure security groups

3. **Compute Provisioning**
   - Choose compute service
   - Configure scaling
   - Set up load balancing
   - Configure auto-scaling

4. **Data Services**
   - Select database service
   - Configure backups
   - Set up replication
   - Configure security

5. **Security Hardening**
   - Configure IAM policies
   - Enable encryption
   - Set up monitoring
   - Implement logging

6. **Operations**
   - Set up monitoring
   - Configure alerts
   - Implement backups
   - Optimize costs
</execution_flow>

<aws_architecture>
**AWS Reference Architecture:**

```
┌─────────────────────────────────────────────────────────────────┐
│                          AWS Cloud                               │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                      VPC (10.0.0.0/16)                   │    │
│  │                                                          │    │
│  │  ┌─────────────────┐         ┌─────────────────┐        │    │
│  │  │  Public Subnet  │         │ Private Subnet  │        │    │
│  │  │  (10.0.101.0/24)│         │  (10.0.1.0/24)  │        │    │
│  │  │                 │         │                 │        │    │
│  │  │  ┌───────────┐  │         │  ┌───────────┐  │        │    │
│  │  │  │    NAT    │  │         │  │    ECS    │  │        │    │
│  │  │  │  Gateway  │  │         │  │  Tasks    │  │        │    │
│  │  │  └───────────┘  │         │  └───────────┘  │        │    │
│  │  │                 │         │                 │        │    │
│  │  │  ┌───────────┐  │         │  ┌───────────┐  │        │    │
│  │  │  │    ALB    │  │         │  │    RDS    │  │        │    │
│  │  │  └───────────┘  │         │  │  (Multi-AZ)│ │        │    │
│  │  │                 │         │  └───────────┘  │        │    │
│  │  └─────────────────┘         │                 │        │    │
│  │                              │  ┌───────────┐  │        │    │
│  │                              │  │ ElastiCache│ │        │    │
│  │                              │  │   Redis   │  │        │    │
│  │                              │  └───────────┘  │        │    │
│  │                              └─────────────────┘        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │     S3       │  │   CloudFront │  │   Route53    │          │
│  │  (Storage)   │  │     (CDN)    │  │     (DNS)    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  CloudWatch  │  │  CloudTrail  │  │    X-Ray     │          │
│  │  (Monitoring)│  │    (Audit)   │  │   (Tracing)  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```
</aws_architecture>

<terraform_aws>
**Terraform AWS Configuration:**

```hcl
# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "${var.project_name}-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = {
    Name = "${var.project_name}-igw"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = 3
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index + 100)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  
  tags = {
    Name = "${var.project_name}-public-${count.index + 1}"
    Type = "Public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index + 1)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  tags = {
    Name = "${var.project_name}-private-${count.index + 1}"
    Type = "Private"
  }
}

# NAT Gateway
resource "aws_eip" "nat" {
  domain = "vpc"
  
  tags = {
    Name = "${var.project_name}-nat-eip"
  }
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id
  
  tags = {
    Name = "${var.project_name}-nat"
  }
}

# RDS PostgreSQL
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet"
  subnet_ids = aws_subnet.private[*].id
  
  tags = {
    Name = "${var.project_name}-db-subnet"
  }
}

resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-db"
  
  engine         = "postgres"
  engine_version = "15"
  instance_class = "db.t3.medium"
  
  allocated_storage     = 100
  max_allocated_storage = 500
  storage_type          = "gp3"
  storage_encrypted     = true
  
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.database.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  multi_az               = true
  publicly_accessible    = false
  
  backup_retention_period = 30
  backup_window          = "03:00-06:00"
  maintenance_window     = "Mon:00:00-Mon:03:00"
  
  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  skip_final_snapshot = false
  final_snapshot_identifier = "${var.project_name}-final"
  
  tags = {
    Name = "${var.project_name}-db"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  
  tags = {
    Name = "${var.project_name}-ecs"
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = aws_subnet.public[*].id
  
  enable_deletion_protection = true
  
  tags = {
    Name = "${var.project_name}-alb"
  }
}

# S3 Bucket
resource "aws_s3_bucket" "main" {
  bucket = "${var.project_name}-${data.aws_caller_identity.current.account_id}"
  
  tags = {
    Name = "${var.project_name}"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudWatch Alarm
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "${var.project_name}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "CPU utilization is too high"
  
  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.main.name
  }
  
  alarm_actions = [aws_sns_topic.alerts.arn]
}
```
</terraform_aws>
