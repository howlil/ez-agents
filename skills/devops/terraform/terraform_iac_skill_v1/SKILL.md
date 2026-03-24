---
name: terraform_iac_skill_v1
description: Infrastructure as Code with Terraform, state management, modules, and cloud resource provisioning for AWS, GCP, and Azure
version: 1.0.0
tags: [terraform, iac, infrastructure, cloud, aws, gcp, azure, devops]
stack: devops/terraform
category: devops
triggers:
  keywords: [terraform, infrastructure as code, iac, provision, tfstate, modules, cloud resources]
  filePatterns: [*.tf, *.tfvars, terraform.tfstate, .terraform.lock.hcl]
  commands: [terraform init, terraform plan, terraform apply, terraform destroy]
  stack: devops/terraform
  projectArchetypes: [cloud-native, microservices, saas, enterprise]
  modes: [greenfield, migration, management]
prerequisites:
  - cloud_basics
  - networking_fundamentals
  - git_fundamentals
recommended_structure:
  directories:
    - terraform/
    - terraform/modules/
    - terraform/environments/
    - terraform/environments/dev/
    - terraform/environments/staging/
    - terraform/environments/prod/
workflow:
  setup:
    - Install Terraform
    - Configure backend (S3 + DynamoDB)
    - Set up providers
    - Configure state locking
  develop:
    - Write Terraform configurations
    - Create reusable modules
    - Define variables and outputs
    - Run terraform fmt and validate
  deploy:
    - Run terraform plan
    - Review changes
    - Apply with approval
    - Verify resources
best_practices:
  - Use remote state with locking (S3 + DynamoDB)
  - Never commit state files to version control
  - Use modules for reusability
  - Pin provider and module versions
  - Use workspaces for environment separation
  - Implement proper tagging strategy
  - Use terraform fmt for consistent formatting
  - Run terraform validate before apply
  - Use import for existing resources
  - Implement state backup strategy
anti_patterns:
  - Never commit terraform.tfstate to git
  - Don't hardcode secrets (use secrets manager)
  - Avoid monolithic state files (split by component)
  - Don't skip state locking
  - Avoid using latest for versions
  - Don't manually modify resources created by Terraform
  - Never share state files insecurely
  - Avoid circular dependencies between modules
  - Don't skip terraform fmt
  - Never run apply without plan review
scaling_notes: |
  For enterprise Terraform:

  **State Management:**
  - Use separate state per environment
  - Implement state locking
  - Enable versioning on state bucket
  - Regular state cleanup

  **Module Design:**
  - Create reusable modules
  - Version modules properly
  - Document module interfaces
  - Test modules independently

  **CI/CD Integration:**
  - Run plan on PR
  - Require approval for apply
  - Use separate workflows per env
  - Implement drift detection

  **Security:**
  - Use OIDC for cloud auth
  - Scan for misconfigurations
  - Implement policy as code (OPA)
  - Audit all changes

when_not_to_use: |
  Terraform may not be suitable for:

  **Rapidly Changing Infrastructure:**
  - Consider immutable infrastructure
  - Use Pulumi for programmatic approach

  **Simple Deployments:**
  - CloudFormation or CDK may suffice
  - Consider managed services

  **Multi-Cloud Complexity:**
  - Evaluate if multi-cloud is necessary
  - Consider cloud-specific tools

output_template: |
  ## Terraform IaC Strategy

  **Backend:** S3 + DynamoDB
  **Modules:** Custom + Registry
  **Workflow:** Plan on PR, Apply with approval
  **State:** Per environment

  ### Key Decisions
  - **State:** Remote with locking
  - **Modules:** Reusable components
  - **Versioning:** Pinned versions
  - **Auth:** OIDC for cloud provider

  ### Trade-offs Considered
  - Monolith vs Modular: Modular for reuse
  - Workspaces vs Separate States: Separate for isolation
  - Custom vs Registry: Mix of both

  ### Next Steps
  1. Configure backend
  2. Create base modules
  3. Write environment configs
  4. Set up CI/CD
  5. Deploy infrastructure
dependencies:
  tools:
    - terraform (infrastructure as code)
    - terragrunt (terraform wrapper)
    - tflint (terraform linter)
    - tfsec (security scanner)
    - infracost (cost estimation)
  providers:
    - aws (Amazon Web Services)
    - google (Google Cloud Platform)
    - azurerm (Microsoft Azure)
    - kubernetes (K8s resources)
    - helm (K8s charts)
  state_backends:
    - S3 + DynamoDB (AWS)
    - GCS (Google)
    - Azure Storage (Azure)
    - Terraform Cloud (managed)
---

<role>
You are a Terraform specialist with deep expertise in infrastructure as code, state management, and cloud resource provisioning. You provide structured guidance on building maintainable, scalable infrastructure following IaC best practices.
</role>

<execution_flow>
1. **Backend Setup**
   - Configure remote state
   - Set up state locking
   - Enable versioning
   - Configure access

2. **Provider Configuration**
   - Select providers
   - Pin versions
   - Configure authentication
   - Set up aliases for multi-region

3. **Module Development**
   - Design module interfaces
   - Implement resources
   - Define variables/outputs
   - Document usage

4. **Environment Setup**
   - Create environment configs
   - Configure variables
   - Set up workspaces (if needed)
   - Implement separation

5. **CI/CD Integration**
   - Configure plan on PR
   - Set up approval gates
   - Implement apply workflow
   - Add drift detection

6. **Operations**
   - Monitor infrastructure
   - Track costs
   - Audit changes
   - Update regularly
</execution_flow>

<terraform_config>
**Terraform Configuration:**

```hcl
# terraform/main.tf
terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
  
  backend "s3" {
    bucket         = "myapp-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "myapp-terraform-locks"
    
    # Enable locking
    skip_credentials_validation = false
    skip_metadata_api_check     = false
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
    }
  }
}

# VPC Module
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"
  
  name = "${var.project_name}-vpc"
  cidr = var.vpc_cidr
  
  azs             = var.availability_zones
  private_subnets = var.private_subnets
  public_subnets  = var.public_subnets
  
  enable_nat_gateway = true
  single_nat_gateway = false
  
  tags = {
    Name = "${var.project_name}-vpc"
  }
}

# EKS Module
module "eks" {
  source = "terraform-aws-modules/eks/aws"
  version = "19.0.0"
  
  cluster_name    = "${var.project_name}-cluster"
  cluster_version = "1.28"
  
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets
  
  eks_managed_node_groups = {
    default = {
      min_size     = 2
      max_size     = 10
      desired_size = 3
      
      instance_types = ["t3.medium"]
      capacity_type  = "ON_DEMAND"
    }
    
    spot = {
      min_size     = 1
      max_size     = 5
      desired_size = 2
      
      instance_types = ["t3.medium", "t3.large"]
      capacity_type  = "SPOT"
    }
  }
  
  tags = {
    Name = "${var.project_name}-eks"
  }
}

# RDS Module
module "database" {
  source = "terraform-aws-modules/rds/aws"
  version = "5.0.0"
  
  identifier = "${var.project_name}-db"
  
  engine            = "postgres"
  engine_version    = "15"
  family            = "postgres15"
  major_engine_version = "15"
  instance_class    = "db.t3.medium"
  
  allocated_storage     = 100
  max_allocated_storage = 500
  storage_encrypted     = true
  
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  port     = 5432
  
  multi_az               = true
  db_subnet_group_name   = module.vpc.database_subnet_group_name
  vpc_security_group_ids = [module.security_group.database_security_group_id]
  
  maintenance_window              = "Mon:00:00-Mon:03:00"
  backup_window                   = "03:00-06:00"
  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  backup_retention_period = 30
  skip_final_snapshot     = false
  final_snapshot_identifier = "${var.project_name}-final-snapshot"
  
  tags = {
    Name = "${var.project_name}-rds"
  }
}

# Security Group Module
module "security_group" {
  source = "terraform-aws-modules/security-group/aws"
  version = "5.0.0"
  
  name        = "${var.project_name}-sg"
  description = "Security group for ${var.project_name}"
  vpc_id      = module.vpc.vpc_id
  
  ingress_cidr_blocks = ["10.0.0.0/8"]
  ingress_rules       = ["https-443-tcp", "http-80-tcp"]
  
  tags = {
    Name = "${var.project_name}-sg"
  }
}
```
</terraform_config>

<variables_and_outputs>
**Variables and Outputs:**

```hcl
# terraform/variables.tf
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "private_subnets" {
  description = "List of private subnet CIDRs"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnets" {
  description = "List of public subnet CIDRs"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "db_name" {
  description = "Database name"
  type        = string
  sensitive   = true
}

variable "db_username" {
  description = "Database username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

# terraform/outputs.tf
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "eks_cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "database_endpoint" {
  description = "RDS endpoint"
  value       = module.database.db_instance_endpoint
}

output "database_port" {
  description = "RDS port"
  value       = module.database.db_instance_port
}
```
</variables_and_outputs>

<ci_cd_integration>
**Terraform CI/CD (GitHub Actions):**

```yaml
# .github/workflows/terraform.yml
name: Terraform

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  TF_VERSION: '1.6.0'
  AWS_REGION: 'us-east-1'

jobs:
  terraform:
    runs-on: ubuntu-latest
    defaults:
      run:
        shell: bash
        working-directory: ./terraform
    
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/GitHubActionsTerraform
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Terraform Init
        id: init
        run: terraform init -input=false
      
      - name: Terraform Format Check
        id: fmt
        run: terraform fmt -check -recursive
      
      - name: Terraform Validate
        id: validate
        run: terraform validate -no-color
      
      - name: Setup TFLint
        uses: terraform-linters/setup-tflint@v3
        with:
          tflint_version: latest
      
      - name: Run TFLint
        run: tflint --init && tflint
      
      - name: Run tfsec
        uses: aquasecurity/tfsec-action@v1.0.3
        with:
          working_directory: ./terraform
      
      - name: Terraform Plan
        id: plan
        run: terraform plan -no-color -input=false
        continue-on-error: true
      
      - name: Update Pull Request
        uses: actions/github-script@v6
        if: github.event_name == 'pull_request'
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            const output = `#### Terraform Format and Style: \`${{ steps.fmt.outcome }}\`
            #### Terraform Initialization: \`${{ steps.init.outcome }}\`
            #### Terraform Validation: \`${{ steps.validate.outcome }}\`
            #### Terraform Plan: \`${{ steps.plan.outcome }}\`
            
            <details>
            <summary>Show Plan</summary>
            
            \`\`\`\n
            ${process.env.PLAN}
            \`\`\`
            
            </details>
            
            *Pusher: @${{ github.actor }}, Action: \`${{ github.event_name }}\`*`;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: output
            })
      
      - name: Terraform Plan Status
        if: steps.plan.outcome == 'failure'
        run: exit 1
      
      - name: Terraform Apply
        if: github.ref == 'refs/heads/main' && github.event_name == 'push'
        run: terraform apply -auto-approve -input=false
```
</ci_cd_integration>
