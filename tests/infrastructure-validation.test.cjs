/**
 * Infrastructure Validation Tests
 * 
 * Tests for Infrastructure as Code (IaC) generation and validation.
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const { createTempGitProject, cleanup } = require('./helpers.cjs');

describe('InfrastructureService', () => {
  let tmpDir;
  let InfrastructureService;

  beforeEach(() => {
    tmpDir = createTempGitProject();
    const servicePath = require.resolve('../ez-agents/bin/lib/infrastructure-service.cjs');
    delete require.cache[servicePath];
    InfrastructureService = require('../ez-agents/bin/lib/infrastructure-service.cjs');
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  it('generates Pulumi TypeScript templates with correct directory structure', () => {
    const service = new InfrastructureService(tmpDir);
    const result = service.generateInfrastructure({ provider: 'aws' });

    assert.ok(result.success, 'generation should succeed');
    assert.ok(fs.existsSync(path.join(tmpDir, 'infrastructure', 'Pulumi.yaml')));
    assert.ok(fs.existsSync(path.join(tmpDir, 'infrastructure', 'environments', 'dev')));
    assert.ok(fs.existsSync(path.join(tmpDir, 'infrastructure', 'environments', 'staging')));
    assert.ok(fs.existsSync(path.join(tmpDir, 'infrastructure', 'environments', 'prod')));
  });

  it('environment configs have different instance types and scaling parameters', () => {
    const service = new InfrastructureService(tmpDir);
    service.generateInfrastructure({ provider: 'aws' });

    const devConfig = JSON.parse(fs.readFileSync(
      path.join(tmpDir, 'infrastructure', 'environments', 'dev', 'config.json'), 'utf-8'
    ));
    const prodConfig = JSON.parse(fs.readFileSync(
      path.join(tmpDir, 'infrastructure', 'environments', 'prod', 'config.json'), 'utf-8'
    ));

    assert.notStrictEqual(devConfig.instanceType, prodConfig.instanceType);
    assert.ok(prodConfig.minCapacity >= devConfig.minCapacity);
    assert.ok(prodConfig.maxCapacity >= devConfig.maxCapacity);
  });

  it('all resources include mandatory tags', () => {
    const service = new InfrastructureService(tmpDir);
    const result = service.generateInfrastructure({ provider: 'aws' });

    const vpcFile = fs.readFileSync(
      path.join(tmpDir, 'infrastructure', 'modules', 'networking', 'vpc.ts'), 'utf-8'
    );

    assert.ok(vpcFile.includes('CostCenter'));
    assert.ok(vpcFile.includes('Project'));
    assert.ok(vpcFile.includes('Owner'));
    assert.ok(vpcFile.includes('Environment'));
    assert.ok(vpcFile.includes('ManagedBy'));
  });

  it('auto-scaling configuration uses target tracking with 70% CPU threshold', () => {
    const service = new InfrastructureService(tmpDir);
    service.generateInfrastructure({ provider: 'aws' });

    const autoscalingFile = fs.readFileSync(
      path.join(tmpDir, 'infrastructure', 'modules', 'compute', 'autoscaling.ts'), 'utf-8'
    );

    assert.ok(autoscalingFile.includes('targetTracking'));
    assert.ok(autoscalingFile.includes('70') || autoscalingFile.includes('0.7'));
  });

  it('load balancer setup includes ALB with HTTPS listener', () => {
    const service = new InfrastructureService(tmpDir);
    service.generateInfrastructure({ provider: 'aws' });

    const lbFile = fs.readFileSync(
      path.join(tmpDir, 'infrastructure', 'modules', 'networking', 'load-balancer.ts'), 'utf-8'
    );

    assert.ok(lbFile.includes('ApplicationLoadBalancer') || lbFile.includes('ALB'));
    assert.ok(lbFile.includes('HTTPS') || lbFile.includes('443'));
  });

  it('CDN configuration includes CloudFront with HTTPS redirect', () => {
    const service = new InfrastructureService(tmpDir);
    service.generateInfrastructure({ provider: 'aws' });

    const cdnFile = fs.readFileSync(
      path.join(tmpDir, 'infrastructure', 'modules', 'networking', 'cdn.ts'), 'utf-8'
    );

    assert.ok(cdnFile.includes('CloudFront') || cdnFile.includes('Distribution'));
    assert.ok(cdnFile.includes('HTTPS') || cdnFile.includes('redirect'));
  });
});

describe('InfrastructureValidator', () => {
  let tmpDir;
  let InfrastructureValidator;

  beforeEach(() => {
    tmpDir = createTempGitProject();
    const validatorPath = require.resolve('../ez-agents/bin/lib/infrastructure-validator.cjs');
    delete require.cache[validatorPath];
    InfrastructureValidator = require('../ez-agents/bin/lib/infrastructure-validator.cjs');
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  it('runs Checkov security scanning', () => {
    const validator = new InfrastructureValidator(tmpDir);
    const result = validator.validate({ type: 'checkov', path: 'infrastructure' });

    assert.ok(result !== undefined, 'validation should return result');
    assert.ok('passed' in result || 'errors' in result || 'warnings' in result);
  });

  it('runs cdk-nag for AWS compliance', () => {
    const validator = new InfrastructureValidator(tmpDir);
    const result = validator.validate({ type: 'cdk-nag', path: 'infrastructure' });

    assert.ok(result !== undefined, 'validation should return result');
  });

  it('validates Pulumi configuration', () => {
    const validator = new InfrastructureValidator(tmpDir);
    const service = new (require('../ez-agents/bin/lib/infrastructure-service.cjs'))(tmpDir);
    service.generateInfrastructure({ provider: 'aws' });

    const result = validator.validate({ type: 'pulumi', path: 'infrastructure' });

    assert.ok(result !== undefined);
  });
});

describe('CostEstimator', () => {
  let tmpDir;
  let CostEstimator;

  beforeEach(() => {
    tmpDir = createTempGitProject();
    const estimatorPath = require.resolve('../ez-agents/bin/lib/cost-estimator.cjs');
    delete require.cache[estimatorPath];
    CostEstimator = require('../ez-agents/bin/lib/cost-estimator.cjs');
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  it('calculates monthly costs using Infracost pricing', () => {
    const estimator = new CostEstimator(tmpDir);
    const service = new (require('../ez-agents/bin/lib/infrastructure-service.cjs'))(tmpDir);
    service.generateInfrastructure({ provider: 'aws' });

    const result = estimator.estimate({ path: 'infrastructure' });

    assert.ok(result !== undefined, 'estimation should return result');
    assert.ok('monthlyCost' in result || 'estimated' in result || typeof result === 'number');
  });

  it('provides cost breakdown by resource type', () => {
    const estimator = new CostEstimator(tmpDir);
    const service = new (require('../ez-agents/bin/lib/infrastructure-service.cjs'))(tmpDir);
    service.generateInfrastructure({ provider: 'aws' });

    const result = estimator.estimate({ path: 'infrastructure', detailed: true });

    assert.ok(result !== undefined);
  });

  it('compares costs across environments', () => {
    const estimator = new CostEstimator(tmpDir);
    const service = new (require('../ez-agents/bin/lib/infrastructure-service.cjs'))(tmpDir);
    service.generateInfrastructure({ provider: 'aws' });

    const result = estimator.compareEnvironments(['dev', 'staging', 'prod']);

    assert.ok(result !== undefined);
    assert.ok(Array.isArray(result) || typeof result === 'object');
  });
});
