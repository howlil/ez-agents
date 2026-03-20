#!/usr/bin/env node

/**
 * EZ Security Secret Rotation — Provider-backed rotation with manual fallback
 *
 * Provides secret rotation with:
 * - AWS Secrets Manager integration for automated rotation
 * - Generic/manual fallback for providers requiring human action
 * - No logging or returning of raw secret values
 * - Structured result with rotation commands and setup steps
 *
 * Usage:
 *   const { rotateSecret } = require('./security-secret-rotation.cjs');
 *   const result = rotateSecret({ provider: 'aws', secretName: 'prod/api-key' });
 */

const path = require('path');
const fs = require('fs');
const { SecurityOpsError } = require('./security-errors.cjs');
const { loadCredential } = require('./auth.cjs');
const Logger = require('./logger.cjs');
const logger = new Logger();

/**
 * Generate timestamp for rotation reference
 * @returns {string} - Timestamp string
 */
function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
}

/**
 * Build AWS rotation command payload
 * @param {string} secretName - Secret name in AWS Secrets Manager
 * @returns {Object} - AWS rotation command payload
 */
function buildAwsRotationPayload(secretName) {
  // AWS Secrets Manager rotation command
  // Reference: https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_RotateSecret.html
  return {
    provider: 'aws',
    service: 'secretsmanager',
    rotationType: 'automated',
    command: `aws secretsmanager rotate-secret --secret-id "${secretName}"`,
    payload: {
      SecretId: secretName,
      RotationLambdaARN: '${rotation_lambda_arn}',
      RotationRules: {
        AutomaticallyAfterDays: 30
      }
    },
    setupSteps: [
      'Ensure AWS credentials are configured (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)',
      'Verify the secret exists in AWS Secrets Manager',
      'Configure Lambda rotation function if using custom rotation',
      'Run the rotation command or use AWS Console'
    ]
  };
}

/**
 * Build generic/manual rotation payload
 * @param {string} secretName - Secret identifier
 * @returns {Object} - Manual rotation payload with human action required
 */
function buildManualRotationPayload(secretName) {
  const steps = [
    `Identify the secret: ${secretName}`,
    'Determine the target system/service requiring the secret',
    'Generate a new secret value using a secure random generator',
    'Update the secret in the target system/service',
    'Update any applications or configurations using the old secret',
    'Verify the new secret works correctly',
    'Revoke or delete the old secret',
    'Document the rotation in audit logs'
  ];

  return {
    provider: 'generic',
    rotationType: 'manual',
    requires_human_action: true,
    steps,
    setupSteps: steps,
    instructions: `
Manual Secret Rotation Steps for: ${secretName}

1. PREPARATION
   - Notify affected service owners
   - Schedule maintenance window if needed
   - Prepare rollback plan

2. GENERATE NEW SECRET
   - Use a secure random generator (e.g., openssl rand -base64 32)
   - Ensure the secret meets complexity requirements

3. UPDATE TARGET SYSTEM
   - Access the service dashboard or API
   - Replace the old secret with the new one
   - Test connectivity with new credentials

4. UPDATE APPLICATIONS
   - Update environment variables or secret stores
   - Restart affected services
   - Verify functionality

5. CLEANUP
   - Revoke the old secret
   - Update documentation
   - Log the rotation event
`.trim()
  };
}

/**
 * Rotate secret with provider-backed automation or manual fallback
 * @param {Object} options - Rotation options
 * @param {'aws'|'generic'|'manual'} options.provider - Secret provider
 * @param {string} options.secretName - Name/identifier of the secret
 * @param {string} options.secretValue - (Optional) New secret value - NEVER logged or returned
 * @returns {Object} - Rotation result with provider, command/payload, steps
 * @throws {SecurityOpsError} - If secret name is missing
 */
function rotateSecret(options = {}) {
  const { provider = 'generic', secretName, secretValue } = options;

  // Validate secret name
  if (!secretName) {
    throw new SecurityOpsError('Secret name is required', {
      code: 'MISSING_SECRET_NAME',
      provided: options
    });
  }

  // NEVER log or return the secret value
  if (secretValue) {
    logger.info('Secret rotation requested', {
      provider,
      secretName,
      hasSecretValue: true,
      timestamp: new Date().toISOString()
    });
  } else {
    logger.info('Secret rotation requested', {
      provider,
      secretName,
      timestamp: new Date().toISOString()
    });
  }

  let result;

  // Route based on provider
  switch (provider) {
    case 'aws':
      result = buildAwsRotationPayload(secretName);
      break;
    case 'generic':
    case 'manual':
    default:
      result = buildManualRotationPayload(secretName);
      break;
  }

  // Add common fields
  result.secretName = secretName;
  result.ok = true;
  result.timestamp = new Date().toISOString();

  // Redact any potential secret values from result
  // This is a safety measure - the implementation should never include them
  if (result.payload && result.payload.SecretString) {
    delete result.payload.SecretString;
  }

  return result;
}

module.exports = {
  rotateSecret
};
