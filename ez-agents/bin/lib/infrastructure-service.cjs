/**
 * Infrastructure Service — IaC generation for AWS/Azure/GCP
 *
 * Generates Pulumi TypeScript templates for infrastructure provisioning.
 * Supports environment-specific configurations (dev/staging/prod).
 *
 * Usage:
 *   const InfrastructureService = require('./infrastructure-service.cjs');
 *   const service = new InfrastructureService(process.cwd());
 *   const result = service.generateInfrastructure({ provider: 'aws' });
 */

const fs = require('fs');
const path = require('path');
const { safePlanningWriteSync } = require('./planning-write.cjs');
const Logger = require('./logger.cjs');

class InfrastructureService {
  constructor(cwd, options = {}) {
    this.cwd = cwd || process.cwd();
    this.options = options;
    this.logger = new Logger();
    this.infraDir = path.join(this.cwd, 'infrastructure');
  }

  /**
   * Generate complete infrastructure setup
   * @param {object} options - Generation options
   * @param {string} options.provider - Cloud provider (aws, azure, gcp)
   * @returns {object} - Generation result
   */
  generateInfrastructure({ provider = 'aws' } = {}) {
    this.logger.log('INFO', 'Generating infrastructure', { provider });

    try {
      // Create directory structure
      this._createDirectoryStructure();

      // Generate Pulumi configuration
      this._generatePulumiConfig(provider);

      // Generate environment configs
      this._generateEnvironmentConfigs(provider);

      // Generate modules
      this._generateModules(provider);

      // Generate shared utilities
      this._generateSharedUtils();

      // Generate GitHub workflow
      this._generateValidationWorkflow();

      this.logger.log('INFO', 'Infrastructure generation complete', {
        provider,
        directory: this.infraDir
      });

      return {
        success: true,
        provider,
        directory: this.infraDir,
        environments: ['dev', 'staging', 'prod'],
        modules: ['networking', 'compute', 'database']
      };
    } catch (err) {
      this.logger.log('ERROR', 'Infrastructure generation failed', { error: err.message });
      throw err;
    }
  }

  _createDirectoryStructure() {
    const dirs = [
      this.infraDir,
      path.join(this.infraDir, 'modules', 'networking'),
      path.join(this.infraDir, 'modules', 'compute'),
      path.join(this.infraDir, 'modules', 'database'),
      path.join(this.infraDir, 'environments', 'dev'),
      path.join(this.infraDir, 'environments', 'staging'),
      path.join(this.infraDir, 'environments', 'prod'),
      path.join(this.infraDir, 'shared')
    ];

    for (const dir of dirs) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  _generatePulumiConfig(provider) {
    const config = {
      name: 'ez-agents-infrastructure',
      runtime: 'nodejs',
      description: 'EZ Agents Infrastructure as Code',
      config: {
        'aws:region': 'us-east-1',
        'azure-native:location': 'East US',
        'gcp:project': 'ez-agents',
        'gcp:region': 'us-central1'
      }
    };

    const pulumiPath = path.join(this.infraDir, 'Pulumi.yaml');
    safePlanningWriteSync(pulumiPath, JSON.stringify(config, null, 2));
  }

  _generateEnvironmentConfigs(provider) {
    const environments = {
      dev: {
        instanceType: 't3.small',
        minCapacity: 1,
        maxCapacity: 2,
        cpuThreshold: 70,
        multiAz: false,
        backupRetention: 7
      },
      staging: {
        instanceType: 't3.medium',
        minCapacity: 2,
        maxCapacity: 4,
        cpuThreshold: 70,
        multiAz: true,
        backupRetention: 14
      },
      prod: {
        instanceType: 't3.large',
        minCapacity: 3,
        maxCapacity: 10,
        cpuThreshold: 70,
        multiAz: true,
        backupRetention: 30
      }
    };

    for (const [env, config] of Object.entries(environments)) {
      const configPath = path.join(this.infraDir, 'environments', env, 'config.json');
      safePlanningWriteSync(configPath, JSON.stringify({
        ...config,
        provider,
        tags: {
          CostCenter: 'engineering',
          Project: 'ez-agents',
          Owner: 'platform-team',
          Environment: env,
          ManagedBy: 'pulumi'
        }
      }, null, 2));
    }
  }

  _generateModules(provider) {
    // VPC Module
    const vpcPath = path.join(this.infraDir, 'modules', 'networking', 'vpc.ts');
    safePlanningWriteSync(vpcPath, this._generateVpcModule(provider));

    // Auto-scaling Module
    const autoscalingPath = path.join(this.infraDir, 'modules', 'compute', 'autoscaling.ts');
    safePlanningWriteSync(autoscalingPath, this._generateAutoScalingModule(provider));

    // Load Balancer Module
    const lbPath = path.join(this.infraDir, 'modules', 'networking', 'load-balancer.ts');
    safePlanningWriteSync(lbPath, this._generateLoadBalancerModule(provider));

    // CDN Module
    const cdnPath = path.join(this.infraDir, 'modules', 'networking', 'cdn.ts');
    safePlanningWriteSync(cdnPath, this._generateCdnModule(provider));

    // RDS Module
    const rdsPath = path.join(this.infraDir, 'modules', 'database', 'rds.ts');
    safePlanningWriteSync(rdsPath, this._generateRdsModule(provider));
  }

  _generateVpcModule(provider) {
    return `/**
 * VPC Module - Network infrastructure
 * Generated by EZ Agents Infrastructure Service
 */

import * as pulumi from "@pulumi/pulumi";
${provider === 'aws' ? 'import * as aws from "@pulumi/aws";' : ''}

// Mandatory tags for all resources
const commonTags = {
  CostCenter: "engineering",
  Project: "ez-agents",
  Owner: "platform-team",
  ManagedBy: "pulumi"
};

// VPC Configuration
export interface VpcConfig {
  cidrBlock: string;
  enableDnsHostnames: boolean;
  enableDnsSupport: boolean;
  environment: string;
}

export function createVpc(name: string, config: VpcConfig, tags?: Record<string, string>) {
  ${provider === 'aws' ? `
  const vpc = new aws.ec2.Vpc(name, {
    cidrBlock: config.cidrBlock,
    enableDnsHostnames: config.enableDnsHostnames,
    enableDnsSupport: config.enableDnsSupport,
    tags: {
      Name: name,
      Environment: config.environment,
      ...commonTags,
      ...tags
    }
  });

  return vpc;
  ` : '// Add provider-specific VPC implementation'}
}

// Subnet configuration
export interface SubnetConfig {
  vpcId: pulumi.Input<string>;
  cidrBlock: string;
  availabilityZone: string;
  type: 'public' | 'private';
}

export function createSubnet(name: string, config: SubnetConfig, tags?: Record<string, string>) {
  ${provider === 'aws' ? `
  const subnet = new aws.ec2.Subnet(name, {
    vpcId: config.vpcId,
    cidrBlock: config.cidrBlock,
    availabilityZone: config.availabilityZone,
    mapPublicIpOnLaunch: config.type === 'public',
    tags: {
      Name: name,
      Type: config.type,
      Environment: config.type === 'public' ? 'public' : 'private',
      ...commonTags,
      ...tags
    }
  });

  return subnet;
  ` : '// Add provider-specific subnet implementation'}
}
`;
  }

  _generateAutoScalingModule(provider) {
    return `/**
 * Auto-scaling Module - Compute scaling configuration
 * Generated by EZ Agents Infrastructure Service
 * 
 * Uses target tracking with CPU threshold of 70%
 */

import * as pulumi from "@pulumi/pulumi";
${provider === 'aws' ? 'import * as aws from "@pulumi/aws";' : ''}

const commonTags = {
  CostCenter: "engineering",
  Project: "ez-agents",
  Owner: "platform-team",
  ManagedBy: "pulumi"
};

export interface AutoScalingConfig {
  minCapacity: number;
  maxCapacity: number;
  desiredCapacity?: number;
  instanceType: string;
  cpuThreshold?: number; // Target CPU utilization (default: 70%)
  environment: string;
}

export function createAutoScalingGroup(
  name: string,
  config: AutoScalingConfig,
  vpcId: pulumi.Input<string>,
  subnets: pulumi.Input<string>[],
  tags?: Record<string, string>
) {
  ${provider === 'aws' ? `
  const launchConfig = new aws.ec2.LaunchConfiguration(\`\${name}-launch\`, {
    instanceType: config.instanceType,
    // Add AMI, security group, user data as needed
    tags: [
      { key: "Name", value: name, propagateAtLaunch: true },
      { key: "Environment", value: config.environment, propagateAtLaunch: true },
      ...Object.entries({ ...commonTags, ...tags }).map(([key, value]) => ({
        key,
        value,
        propagateAtLaunch: true
      }))
    ]
  });

  const asg = new aws.autoscaling.Group(name, {
    minSize: config.minCapacity,
    maxSize: config.maxCapacity,
    desiredCapacity: config.desiredCapacity || config.minCapacity,
    launchConfiguration: launchConfig.name,
    vpcZoneIdentifiers: subnets,
    targetGroupArn: config.targetGroupArn,
    tags: [
      { key: "Name", value: name, propagateAtLaunch: true },
      { key: "Environment", value: config.environment, propagateAtLaunch: true },
      ...Object.entries({ ...commonTags, ...tags }).map(([key, value]) => ({
        key,
        value,
        propagateAtLaunch: true
      }))
    ]
  });

  // Target tracking scaling policy with 70% CPU threshold
  const scalingPolicy = new aws.autoscaling.Policy(\`\${name}-scaling\`, {
    autoscalingGroupName: asg.name,
    policyType: "TargetTrackingScaling",
    targetTrackingConfiguration: {
      predefinedMetricSpecification: {
        predefinedMetricType: "ASGAverageCPUUtilization"
      },
      targetValue: config.cpuThreshold || 70
    }
  });

  return { asg, launchConfig, scalingPolicy };
  ` : '// Add provider-specific auto-scaling implementation'}
}
`;
  }

  _generateLoadBalancerModule(provider) {
    return `/**
 * Load Balancer Module - ALB/NLB configuration
 * Generated by EZ Agents Infrastructure Service
 */

import * as pulumi from "@pulumi/pulumi";
${provider === 'aws' ? 'import * as aws from "@pulumi/aws";' : ''}

const commonTags = {
  CostCenter: "engineering",
  Project: "ez-agents",
  Owner: "platform-team",
  ManagedBy: "pulumi"
};

export interface LoadBalancerConfig {
  type: 'application' | 'network'; // ALB or NLB
  internal?: boolean;
  subnets: pulumi.Input<string>[];
  environment: string;
}

export function createLoadBalancer(name: string, config: LoadBalancerConfig, tags?: Record<string, string>) {
  ${provider === 'aws' ? `
  const lb = new aws.lb.LoadBalancer(name, {
    internal: config.internal || false,
    loadBalancerType: config.type === 'application' ? 'application' : 'network',
    subnets: config.subnets,
    enableDeletionProtection: config.environment === 'prod',
    tags: {
      Name: name,
      Type: config.type === 'application' ? 'ALB' : 'NLB',
      Environment: config.environment,
      ...commonTags,
      ...tags
    }
  });

  // HTTPS Listener for ALB
  let httpsListener: aws.lb.Listener | undefined;
  if (config.type === 'application') {
    httpsListener = new aws.lb.Listener(\`\${name}-https\`, {
      loadBalancerArn: lb.arn,
      port: 443,
      protocol: "HTTPS",
      // Add certificate ARN and SSL policy as needed
      defaultActions: [{
        type: "fixed-response",
        fixedResponse: {
          contentType: "text/plain",
          statusCode: "200",
          messageBody: "OK"
        }
      }]
    });
  }

  return { lb, httpsListener };
  ` : '// Add provider-specific load balancer implementation'}
}
`;
  }

  _generateCdnModule(provider) {
    return `/**
 * CDN Module - CloudFront distribution configuration
 * Generated by EZ Agents Infrastructure Service
 */

import * as pulumi from "@pulumi/pulumi";
${provider === 'aws' ? 'import * as aws from "@pulumi/aws";' : ''}

const commonTags = {
  CostCenter: "engineering",
  Project: "ez-agents",
  Owner: "platform-team",
  ManagedBy: "pulumi"
};

export interface CdnConfig {
  originDomain: string;
  priceClass?: 'PriceClass_100' | 'PriceClass_200' | 'PriceClass_All';
  environment: string;
}

export function createCdnDistribution(name: string, config: CdnConfig, tags?: Record<string, string>) {
  ${provider === 'aws' ? `
  const distribution = new aws.cloudfront.Distribution(name, {
    enabled: true,
    priceClass: config.priceClass || 'PriceClass_100',
    origins: [{
      originId: config.originDomain,
      domainName: config.originDomain,
      customOriginConfig: {
        httpPort: 80,
        httpsPort: 443,
        originProtocolPolicy: "https-only", // HTTPS redirect
        originSslProtocols: ["TLSv1.2"]
      }
    }],
    defaultCacheBehavior: {
      targetOriginId: config.originDomain,
      viewerProtocolPolicy: "redirect-to-https", // HTTPS redirect
      allowedMethods: ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
      cachedMethods: ["GET", "HEAD"],
      forwardedValues: {
        queryString: false,
        cookies: { forward: "none" }
      },
      minTtl: 0,
      defaultTtl: 3600,
      maxTtl: 86400
    },
    restrictions: {
      geoRestriction: {
        restrictionType: "none",
        locations: []
      }
    },
    viewerCertificate: {
      cloudfrontDefaultCertificate: true
    },
    tags: {
      Name: name,
      Environment: config.environment,
      ...commonTags,
      ...tags
    }
  });

  return distribution;
  ` : '// Add provider-specific CDN implementation'}
}
`;
  }

  _generateRdsModule(provider) {
    return `/**
 * RDS Module - Database infrastructure
 * Generated by EZ Agents Infrastructure Service
 */

import * as pulumi from "@pulumi/pulumi";
${provider === 'aws' ? 'import * as aws from "@pulumi/aws";' : ''}

const commonTags = {
  CostCenter: "engineering",
  Project: "ez-agents",
  Owner: "platform-team",
  ManagedBy: "pulumi"
};

export interface RdsConfig {
  instanceClass: string;
  engine: string;
  engineVersion: string;
  allocatedStorage: number;
  multiAz: boolean;
  backupRetentionPeriod: number;
  environment: string;
}

export function createRdsInstance(
  name: string,
  config: RdsConfig,
  subnetIds: pulumi.Input<string>[],
  vpcId: pulumi.Input<string>,
  tags?: Record<string, string>
) {
  ${provider === 'aws' ? `
  // Subnet group for RDS
  const subnetGroup = new aws.rds.SubnetGroup(\`\${name}-subnet-group\`, {
    subnetIds,
    tags: {
      Name: \`\${name}-subnets\`,
      Environment: config.environment,
      ...commonTags,
      ...tags
    }
  });

  // Security group for RDS
  const securityGroup = new aws.ec2.SecurityGroup(\`\${name}-sg\`, {
    vpcId,
    ingress: [{
      protocol: "tcp",
      fromPort: 5432, // PostgreSQL default
      toPort: 5432,
      cidrBlocks: ["10.0.0.0/8"] // Internal VPC only
    }],
    egress: [{
      protocol: "-1",
      fromPort: 0,
      toPort: 0,
      cidrBlocks: ["0.0.0.0/0"]
    }],
    tags: {
      Name: name,
      Environment: config.environment,
      ...commonTags,
      ...tags
    }
  });

  // RDS Instance
  const instance = new aws.rds.Instance(name, {
    instanceClass: config.instanceClass,
    engine: config.engine,
    engineVersion: config.engineVersion,
    allocatedStorage: config.allocatedStorage,
    storageType: "gp3",
    multiAz: config.multiAz,
    backupRetentionPeriod: config.backupRetentionPeriod,
    dbSubnetGroupName: subnetGroup.name,
    vpcSecurityGroupIds: [securityGroup.id],
    skipFinalSnapshot: config.environment !== 'prod',
    deletionProtection: config.environment === 'prod',
    tags: {
      Name: name,
      Environment: config.environment,
      ...commonTags,
      ...tags
    }
  });

  return { instance, subnetGroup, securityGroup };
  ` : '// Add provider-specific RDS implementation'}
}
`;
  }

  _generateSharedUtils() {
    const tagsPath = path.join(this.infraDir, 'shared', 'tags.ts');
    safePlanningWriteSync(tagsPath, `/**
 * Shared Tags - Common tagging utilities
 * Generated by EZ Agents Infrastructure Service
 */

export const commonTags = {
  CostCenter: "engineering",
  Project: "ez-agents",
  Owner: "platform-team",
  ManagedBy: "pulumi"
};

export function mergeTags(baseTags: Record<string, string>, additionalTags?: Record<string, string>) {
  return {
    ...commonTags,
    ...baseTags,
    ...additionalTags
  };
}

export function validateTags(tags: Record<string, string>): boolean {
  const requiredKeys = ['CostCenter', 'Project', 'Owner', 'Environment', 'ManagedBy'];
  return requiredKeys.every(key => key in tags);
}
`);
  }

  _generateValidationWorkflow() {
    const workflowDir = path.join(this.cwd, '.github', 'workflows');
    fs.mkdirSync(workflowDir, { recursive: true });

    const workflowPath = path.join(workflowDir, 'validate-infra.yml');
    safePlanningWriteSync(workflowPath, `name: Validate Infrastructure

on:
  pull_request:
    paths:
      - 'infrastructure/**'
  push:
    branches: [main, develop]
    paths:
      - 'infrastructure/**'

concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd infrastructure
          npm ci

      - name: Pulumi preview
        uses: pulumi/actions@v5
        with:
          command: preview
          work-dir: infrastructure
          comment-on-pr: true
        env:
          PULUMI_ACCESS_TOKEN: \${{ secrets.PULUMI_ACCESS_TOKEN }}
          AWS_ACCESS_KEY_ID: \${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: \${{ secrets.AWS_SECRET_ACCESS_KEY }}

      - name: Run Checkov security scan
        uses: bridgecrewio/checkov-action@v12
        with:
          directory: infrastructure
          framework: terraform,cloudformation
          output: sarif
          soft_fail: true

      - name: Run cdk-nag AWS compliance
        run: |
          cd infrastructure
          npm install -D cdk-nag @aws-cdk/aws-cdk
          # Add cdk-nag rules execution
`);
  }
}

module.exports = InfrastructureService;
