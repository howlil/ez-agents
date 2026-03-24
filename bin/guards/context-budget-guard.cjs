#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Context Budget Guard - Prevents context budget exhaustion with progressive warnings
 * 
 * Monitors token usage and provides warnings at:
 * - 50%: Info - Context degradation begins
 * - 70%: Warning - Efficiency mode engaged
 * - 80%: Error - Hard stop, should stop processing
 * 
 * Exports:
 * - checkContextBudget(tokenUsage, modelLimits) - Calculate usage and warnings
 * - getTokenUsage() - Read current token usage from executor context
 * - shouldStop() - Check if usage >= 80%
 */

/**
 * Warning thresholds for context budget
 */
const THRESHOLDS = {
  INFO: 50,      // 50% - Info warning
  WARNING: 70,   // 70% - Warning level
  ERROR: 80      // 80% - Hard stop
};

/**
 * Warning messages for each threshold level
 */
const WARNING_MESSAGES = {
  [THRESHOLDS.INFO]: 'Context usage at {percent}% - quality degradation begins',
  [THRESHOLDS.WARNING]: 'Context usage at {percent}% - efficiency mode engaged',
  [THRESHOLDS.ERROR]: 'Context usage at {percent}% - hard stop'
};

/**
 * Check context budget and return progressive warnings
 * @param {number} tokenUsage - Current token count
 * @param {number} modelLimits - Maximum token limit for the model
 * @returns {{ 
 *   percent: number, 
 *   level: 'none' | 'info' | 'warning' | 'error',
 *   message: string | null,
 *   warnings: Array<{level: string, message: string}>,
 *   shouldStop: boolean 
 * }}
 */
function checkContextBudget(tokenUsage, modelLimits) {
  if (modelLimits <= 0) {
    return {
      percent: 0,
      level: 'none',
      message: null,
      warnings: [],
      shouldStop: false
    };
  }

  const percent = Math.round((tokenUsage / modelLimits) * 100);
  const warnings = [];
  let level = 'none';
  let message = null;
  let shouldStop = false;

  // Check thresholds and add progressive warnings
  if (percent >= THRESHOLDS.ERROR) {
    level = 'error';
    message = WARNING_MESSAGES[THRESHOLDS.ERROR].replace('{percent}', percent);
    shouldStop = true;
    warnings.push({
      level: 'error',
      message: WARNING_MESSAGES[THRESHOLDS.ERROR].replace('{percent}', percent)
    });
  } else if (percent >= THRESHOLDS.WARNING) {
    level = 'warning';
    message = WARNING_MESSAGES[THRESHOLDS.WARNING].replace('{percent}', percent);
    warnings.push({
      level: 'warning',
      message: WARNING_MESSAGES[THRESHOLDS.WARNING].replace('{percent}', percent)
    });
    // Also include info warning for context
    if (percent >= THRESHOLDS.INFO) {
      warnings.unshift({
        level: 'info',
        message: WARNING_MESSAGES[THRESHOLDS.INFO].replace('{percent}', THRESHOLDS.INFO)
      });
    }
  } else if (percent >= THRESHOLDS.INFO) {
    level = 'info';
    message = WARNING_MESSAGES[THRESHOLDS.INFO].replace('{percent}', percent);
    warnings.push({
      level: 'info',
      message: WARNING_MESSAGES[THRESHOLDS.INFO].replace('{percent}', percent)
    });
  }

  return {
    percent,
    level,
    message,
    warnings,
    shouldStop
  };
}

/**
 * Get current token usage from executor context file
 * @param {string} contextFile - Path to executor context file (optional)
 * @returns {{ currentTokens: number, maxTokens: number, percent: number } | null}
 */
function getTokenUsage(contextFile) {
  // Default context file locations
  const possiblePaths = [
    contextFile,
    path.join(process.cwd(), '.planning', 'context.json'),
    path.join(process.cwd(), '.planning', 'executor-context.json'),
    path.join(process.cwd(), 'ez-agents', 'context.json'),
    path.join(process.cwd(), '.qwen', 'context.json')
  ].filter(Boolean);

  for (const filePath of possiblePaths) {
    if (filePath && fs.existsSync(filePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return {
          currentTokens: data.tokenUsage || data.currentTokens || 0,
          maxTokens: data.modelLimits || data.maxTokens || 0,
          percent: data.percent || 0
        };
      } catch (err) {
        // Continue to next file
      }
    }
  }

  return null;
}

/**
 * Check if context budget has reached the hard stop threshold
 * @param {number} tokenUsage - Current token count
 * @param {number} modelLimits - Maximum token limit
 * @returns {boolean} - True if usage >= 80%
 */
function shouldStop(tokenUsage, modelLimits) {
  if (!modelLimits || modelLimits <= 0) {
    return false;
  }
  const percent = (tokenUsage / modelLimits) * 100;
  return percent >= THRESHOLDS.ERROR;
}

/**
 * Get the current warning level based on usage percentage
 * @param {number} percent - Usage percentage (0-100)
 * @returns {'none' | 'info' | 'warning' | 'error'}
 */
function getWarningLevel(percent) {
  if (percent >= THRESHOLDS.ERROR) {
    return 'error';
  } else if (percent >= THRESHOLDS.WARNING) {
    return 'warning';
  } else if (percent >= THRESHOLDS.INFO) {
    return 'info';
  }
  return 'none';
}

/**
 * Get warning message for a specific threshold
 * @param {number} percent - Current percentage
 * @param {number} threshold - Threshold to get message for
 * @returns {string}
 */
function getWarningMessage(percent, threshold = THRESHOLDS.INFO) {
  const template = WARNING_MESSAGES[threshold] || WARNING_MESSAGES[THRESHOLDS.INFO];
  return template.replace('{percent}', percent);
}

/**
 * CLI entry point
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Context Budget Guard - Token usage monitoring with progressive warnings');
    console.log('');
    console.log('Usage:');
    console.log('  node context-budget-guard.cjs check <current_tokens> <max_tokens>');
    console.log('  node context-budget-guard.cjs status [context-file]');
    console.log('  node context-budget-guard.cjs thresholds');
    console.log('');
    console.log('Commands:');
    console.log('  check      - Check budget for specific token values');
    console.log('  status     - Read and display current context status from file');
    console.log('  thresholds - Show warning threshold configuration');
    console.log('');
    console.log('Thresholds:');
    console.log(`  ${THRESHOLDS.INFO}%  - Info warning (quality degradation begins)`);
    console.log(`  ${THRESHOLDS.WARNING}% - Warning (efficiency mode engaged)`);
    console.log(`  ${THRESHOLDS.ERROR}%  - Error (hard stop)`);
    process.exit(0);
  }

  const command = args[0];

  switch (command) {
    case 'check': {
      const currentTokens = parseInt(args[1], 10);
      const maxTokens = parseInt(args[2], 10);
      
      if (isNaN(currentTokens) || isNaN(maxTokens)) {
        console.error('Error: Both current_tokens and max_tokens must be numbers');
        console.error('Usage: node context-budget-guard.cjs check <current_tokens> <max_tokens>');
        process.exit(1);
      }

      const result = checkContextBudget(currentTokens, maxTokens);
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.shouldStop ? 1 : 0);
    }
    
    case 'status': {
      const contextFile = args[1];
      const usage = getTokenUsage(contextFile);
      
      if (!usage) {
        console.log('No context file found or unable to read token usage');
        process.exit(1);
      }

      const result = checkContextBudget(usage.currentTokens, usage.maxTokens);
      console.log('Context Budget Status:');
      console.log(`  Current: ${usage.currentTokens.toLocaleString()} tokens`);
      console.log(`  Maximum: ${usage.maxTokens.toLocaleString()} tokens`);
      console.log(`  Usage:   ${result.percent}%`);
      console.log(`  Level:   ${result.level.toUpperCase()}`);
      if (result.message) {
        console.log(`  Message: ${result.message}`);
      }
      console.log(`  Stop:    ${result.shouldStop ? 'YES' : 'no'}`);
      process.exit(result.shouldStop ? 1 : 0);
    }
    
    case 'thresholds': {
      console.log('Context Budget Thresholds:');
      console.log(`  ${THRESHOLDS.INFO}%  - Info:    ${WARNING_MESSAGES[THRESHOLDS.INFO].replace('{percent}', THRESHOLDS.INFO)}`);
      console.log(`  ${THRESHOLDS.WARNING}% - Warning: ${WARNING_MESSAGES[THRESHOLDS.WARNING].replace('{percent}', THRESHOLDS.WARNING)}`);
      console.log(`  ${THRESHOLDS.ERROR}%  - Error:   ${WARNING_MESSAGES[THRESHOLDS.ERROR].replace('{percent}', THRESHOLDS.ERROR)}`);
      process.exit(0);
    }
    
    default:
      console.error(`Unknown command: ${command}`);
      console.log('Use "node context-budget-guard.cjs" for usage information');
      process.exit(1);
  }
}

// Export functions for programmatic use
module.exports = {
  checkContextBudget,
  getTokenUsage,
  shouldStop,
  getWarningLevel,
  getWarningMessage,
  THRESHOLDS,
  WARNING_MESSAGES
};

// Run CLI if executed directly
if (require.main === module) {
  main();
}
