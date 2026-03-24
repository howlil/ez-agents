/**
 * EDGE-04: Autonomy Guard
 * 
 * Detects irreversible operations requiring human approval.
 * Prevents unbounded autonomy for sensitive operations.
 */

const fs = require('fs');
const path = require('path');

// Operations that require human approval
const IRREVERSIBLE_OPERATIONS = [
  // Database operations
  'drop database',
  'drop table',
  'truncate',
  'delete all',
  'delete from',
  'drop column',
  'drop index',
  'schema migration',
  'data migration',
  
  // File operations
  'rm -rf',
  'del /f',
  'delete directory',
  'remove directory',
  'format',
  
  // Deployment operations
  'production deploy',
  'deploy to production',
  'release to production',
  'push to production',
  
  // Security operations
  'delete user',
  'revoke access',
  'reset credentials',
  'delete api key',
  'rotate secrets',
  
  // Infrastructure
  'terminate instance',
  'delete cluster',
  'destroy environment',
  'scale down to zero'
];

// Operations that are generally safe
const SAFE_OPERATIONS = [
  'read',
  'list',
  'get',
  'fetch',
  'query',
  'select',
  'create',
  'insert',
  'update',
  'build',
  'compile',
  'test',
  'lint',
  'format'
];

/**
 * Check if an operation is irreversible
 * @param {string} operation - Operation description
 * @returns {object} { irreversible: boolean, reason: string, category: string }
 */
function checkIrreversibleOps(operation) {
  const lowerOp = operation.toLowerCase();
  
  for (const irreversible of IRREVERSIBLE_OPERATIONS) {
    if (lowerOp.includes(irreversible)) {
      return {
        irreversible: true,
        requiresApproval: true,
        reason: `Operation contains irreversible action: "${irreversible}"`,
        category: categorizeOperation(irreversible)
      };
    }
  }
  
  // Check for safe operations
  for (const safe of SAFE_OPERATIONS) {
    if (lowerOp.includes(safe)) {
      return {
        irreversible: false,
        requiresApproval: false,
        reason: `Operation is reversible: "${safe}"`,
        category: 'safe'
      };
    }
  }
  
  // Unknown operation - flag for review
  return {
    irreversible: false,
    requiresApproval: false,
    reason: 'Operation not classified - assuming safe',
    category: 'unknown'
  };
}

/**
 * Categorize an operation
 * @param {string} operation - Operation description
 * @returns {string} Category name
 */
function categorizeOperation(operation) {
  const lowerOp = operation.toLowerCase();
  
  if (lowerOp.includes('database') || lowerOp.includes('table') || lowerOp.includes('schema')) {
    return 'database';
  }
  if (lowerOp.includes('file') || lowerOp.includes('directory') || lowerOp.includes('rm ') || lowerOp.includes('del ')) {
    return 'filesystem';
  }
  if (lowerOp.includes('deploy') || lowerOp.includes('production') || lowerOp.includes('release')) {
    return 'deployment';
  }
  if (lowerOp.includes('user') || lowerOp.includes('access') || lowerOp.includes('credential') || lowerOp.includes('secret')) {
    return 'security';
  }
  if (lowerOp.includes('instance') || lowerOp.includes('cluster') || lowerOp.includes('environment')) {
    return 'infrastructure';
  }
  
  return 'general';
}

/**
 * Check if operation requires human approval
 * @param {string} operation - Operation description
 * @returns {boolean} True if approval required
 */
function requiresHumanApproval(operation) {
  const result = checkIrreversibleOps(operation);
  return result.requiresApproval;
}

/**
 * Flag an operation for approval
 * @param {string} operation - Operation description
 * @param {string} reason - Reason for flagging
 * @param {string} approvalFile - Path to write approval request
 * @returns {object} Approval request result
 */
function flagOperation(operation, reason, approvalFile) {
  const approvalRequest = {
    timestamp: new Date().toISOString(),
    operation,
    reason,
    status: 'pending',
    category: categorizeOperation(operation)
  };
  
  try {
    // Ensure directory exists
    const dir = path.dirname(approvalFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write approval request
    fs.writeFileSync(
      approvalFile,
      `# Approval Request

**Created:** ${approvalRequest.timestamp}
**Category:** ${approvalRequest.category}
**Status:** ${approvalRequest.status}

## Operation

\`\`\`
${operation}
\`\`\`

## Reason for Approval

${reason}

## Approval

- [ ] Approved by: _______________
- [ ] Date: _______________
- [ ] Comments: _______________
`
    );
    
    return {
      success: true,
      file: approvalFile,
      request: approvalRequest
    };
  } catch (e) {
    return {
      success: false,
      error: e.message,
      request: approvalRequest
    };
  }
}

/**
 * Full autonomy check
 * @param {string} output - AI generated output describing operations
 * @param {string} phaseDir - Phase directory
 * @returns {object} Complete autonomy check result
 */
function checkAutonomy(output, phaseDir) {
  const operations = extractOperations(output);
  const flaggedOperations = [];
  const safeOperations = [];
  
  for (const op of operations) {
    const result = checkIrreversibleOps(op);
    if (result.requiresApproval) {
      flaggedOperations.push({
        operation: op,
        ...result
      });
    } else {
      safeOperations.push({
        operation: op,
        ...result
      });
    }
  }
  
  // Flag operations if any need approval
  const approvalFiles = [];
  if (flaggedOperations.length > 0 && phaseDir) {
    const approvalsDir = path.join(phaseDir, '.planning', 'approvals');
    for (let i = 0; i < flaggedOperations.length; i++) {
      const flag = flaggedOperations[i];
      const approvalFile = path.join(approvalsDir, `approval-${Date.now()}-${i}.md`);
      const result = flagOperation(flag.operation, flag.reason, approvalFile);
      if (result.success) {
        approvalFiles.push(result.file);
      }
    }
  }
  
  return {
    requiresApproval: flaggedOperations.length > 0,
    flaggedOperations,
    safeOperations,
    approvalFiles,
    recommendation: flaggedOperations.length > 0
      ? `Human approval required for ${flaggedOperations.length} operation(s). Check .planning/approvals/`
      : 'All operations are safe to execute autonomously'
  };
}

/**
 * Extract operations from text
 * @param {string} text - Text to analyze
 * @returns {string[]} Array of operations
 */
function extractOperations(text) {
  const operationPatterns = [
    /(?:will|would|should|must|need to)\s+(?:then\s+)?([A-Z][^.!?]*(?:database|table|file|directory|deploy|production|user)[^.!?]*)/gi,
    /(?:step \d+[:\s]+)([A-Z][^.!?]+)/gi,
    /(?:command|operation)[:\s]+([A-Z][^.!?]+)/gi
  ];
  
  const operations = new Set();
  
  for (const pattern of operationPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const op = match[1].trim();
      if (op.length > 10 && op.length < 200) {
        operations.add(op);
      }
    }
  }
  
  return Array.from(operations);
}

/**
 * CLI entry point
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'check' && args[1]) {
    const operation = args.slice(1).join(' ');
    console.log(`Checking operation: "${operation}"`);
    
    const result = checkIrreversibleOps(operation);
    
    if (result.requiresApproval) {
      console.log(`⚠️  Requires human approval`);
      console.log(`   Category: ${result.category}`);
      console.log(`   Reason: ${result.reason}`);
      process.exit(1);
    } else {
      console.log(`✅ Safe to execute autonomously`);
      console.log(`   Category: ${result.category}`);
      console.log(`   Reason: ${result.reason}`);
      process.exit(0);
    }
    
  } else if (command === 'flag' && args[1]) {
    const operation = args[2] || args[1];
    const reason = args[3] || 'Flagged for review';
    const approvalFile = args[4] || `.planning/approvals/approval-${Date.now()}.md`;
    
    const result = flagOperation(operation, reason, approvalFile);
    
    if (result.success) {
      console.log(`✅ Approval request created: ${result.file}`);
      process.exit(0);
    } else {
      console.log(`❌ Failed to create approval request: ${result.error}`);
      process.exit(1);
    }
    
  } else {
    console.log('Usage: node autonomy-guard.cjs <command> [args]');
    console.log('Commands:');
    console.log('  check <operation>              - Check if operation requires approval');
    console.log('  flag <operation> [reason]      - Create approval request');
    process.exit(1);
  }
}

module.exports = {
  checkIrreversibleOps,
  requiresHumanApproval,
  flagOperation,
  checkAutonomy,
  extractOperations,
  categorizeOperation,
  IRREVERSIBLE_OPERATIONS,
  SAFE_OPERATIONS
};
