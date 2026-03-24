/**
 * EDGE-02: Context Budget Guard
 * 
 * Monitors token usage and provides progressive warnings.
 * Prevents context budget exhaustion that degrades AI quality.
 */

const fs = require('fs');
const path = require('path');

// Model token limits (approximate)
const MODEL_LIMITS = {
  'claude-3-5-sonnet': 200000,
  'claude-3-opus': 200000,
  'claude-3-sonnet': 200000,
  'claude-3-haiku': 200000,
  'gpt-4-turbo': 128000,
  'gpt-4': 8192,
  'gemini-pro': 32000,
  'default': 100000
};

// Warning thresholds
const THRESHOLDS = {
  info: 50,      // Quality degradation begins
  warning: 70,   // Efficiency mode engaged
  error: 80      // Hard stop
};

/**
 * Get token usage from executor context
 * @param {string} contextPath - Path to context file
 * @returns {object} { current: number, max: number, model: string }
 */
function getTokenUsage(contextPath) {
  // Try to read from context file
  if (contextPath && fs.existsSync(contextPath)) {
    try {
      const content = fs.readFileSync(contextPath, 'utf8');
      // Look for token usage markers
      const currentMatch = content.match(/tokens_used[:\s]+(\d+)/i);
      const maxMatch = content.match(/token_limit[:\s]+(\d+)/i);
      const modelMatch = content.match(/model[:\s]+(['"]?)([^'"\s,]+)\1/i);
      
      if (currentMatch && maxMatch) {
        return {
          current: parseInt(currentMatch[1], 10),
          max: parseInt(maxMatch[1], 10),
          model: modelMatch ? modelMatch[2] : 'default'
        };
      }
    } catch (e) {
      // Could not parse context file
    }
  }
  
  // Default: return estimated usage
  return {
    current: 0,
    max: MODEL_LIMITS.default,
    model: 'default'
  };
}

/**
 * Check context budget and return warnings
 * @param {number} tokenUsage - Current token usage
 * @param {number} modelLimit - Model's token limit
 * @returns {object} { percent: number, warnings: array, shouldStop: boolean }
 */
function checkContextBudget(tokenUsage, modelLimit) {
  const percent = (tokenUsage / modelLimit) * 100;
  const warnings = [];
  
  if (percent >= THRESHOLDS.info) {
    warnings.push({
      level: 'info',
      threshold: THRESHOLDS.info,
      message: `Context usage at ${Math.round(percent)}% - quality degradation begins`,
      recommendation: 'Consider splitting task or summarizing context'
    });
  }
  
  if (percent >= THRESHOLDS.warning) {
    warnings.push({
      level: 'warning',
      threshold: THRESHOLDS.warning,
      message: `Context usage at ${Math.round(percent)}% - efficiency mode engaged`,
      recommendation: 'Strongly recommended to split task'
    });
  }
  
  if (percent >= THRESHOLDS.error) {
    warnings.push({
      level: 'error',
      threshold: THRESHOLDS.error,
      message: `Context usage at ${Math.round(percent)}% - hard stop`,
      recommendation: 'Task MUST be split - context budget exhausted'
    });
  }
  
  return {
    percent: Math.round(percent * 100) / 100,
    warnings,
    shouldStop: percent >= THRESHOLDS.error,
    remaining: modelLimit - tokenUsage,
    remainingPercent: Math.round((100 - percent) * 100) / 100
  };
}

/**
 * Determine if execution should stop
 * @param {number} tokenUsage - Current token usage
 * @param {number} modelLimit - Model's token limit
 * @returns {boolean} True if should stop
 */
function shouldStop(tokenUsage, modelLimit) {
  const percent = (tokenUsage / modelLimit) * 100;
  return percent >= THRESHOLDS.error;
}

/**
 * Get recommended action based on context usage
 * @param {number} tokenUsage - Current token usage
 * @param {number} modelLimit - Model's token limit
 * @returns {string} Recommended action
 */
function getRecommendedAction(tokenUsage, modelLimit) {
  const percent = (tokenUsage / modelLimit) * 100;
  
  if (percent >= THRESHOLDS.error) {
    return 'STOP: Split task immediately and start new context';
  } else if (percent >= THRESHOLDS.warning) {
    return 'WARNING: Plan to split task soon - summarize or defer non-essential context';
  } else if (percent >= THRESHOLDS.info) {
    return 'INFO: Monitor context usage - consider being more concise';
  } else {
    return 'OK: Context usage is healthy';
  }
}

/**
 * Full context budget check with auto-detection
 * @param {string} contextPath - Path to context file (optional)
 * @param {string} model - Model name (optional, auto-detected if not provided)
 * @returns {object} Complete context budget status
 */
function checkBudget(contextPath, model) {
  const usage = getTokenUsage(contextPath);
  
  // Override model if provided
  if (model && MODEL_LIMITS[model]) {
    usage.max = MODEL_LIMITS[model];
    usage.model = model;
  }
  
  const budgetCheck = checkContextBudget(usage.current, usage.max);
  
  return {
    model: usage.model,
    limit: usage.max,
    used: usage.current,
    ...budgetCheck,
    action: getRecommendedAction(usage.current, usage.max)
  };
}

/**
 * CLI entry point
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'check' && args[1] && args[2]) {
    const current = parseInt(args[1], 10);
    const max = parseInt(args[2], 10);
    
    console.log(`Context Budget Check`);
    console.log(`====================`);
    console.log(`Current: ${current.toLocaleString()} tokens`);
    console.log(`Limit:   ${max.toLocaleString()} tokens`);
    console.log(`Usage:   ${((current/max)*100).toFixed(1)}%`);
    console.log('');
    
    const result = checkContextBudget(current, max);
    
    if (result.warnings.length > 0) {
      console.log('Warnings:');
      result.warnings.forEach(w => {
        console.log(`  [${w.level.toUpperCase()}] ${w.message}`);
        console.log(`    → ${w.recommendation}`);
      });
    } else {
      console.log('✅ Context usage is healthy');
    }
    
    console.log('');
    console.log(`Remaining: ${result.remaining.toLocaleString()} tokens (${result.remainingPercent}%)`);
    console.log(`Action: ${getRecommendedAction(current, max)}`);
    
    process.exit(result.shouldStop ? 1 : 0);
    
  } else if (command === 'status') {
    const contextPath = args[1];
    const result = checkBudget(contextPath);
    
    console.log(`Context Budget Status`);
    console.log(`=====================`);
    console.log(`Model:  ${result.model}`);
    console.log(`Limit:  ${result.limit.toLocaleString()} tokens`);
    console.log(`Used:   ${result.used.toLocaleString()} tokens`);
    console.log(`Usage:  ${result.percent}%`);
    console.log('');
    
    if (result.warnings.length > 0) {
      console.log('Warnings:');
      result.warnings.forEach(w => {
        console.log(`  [${w.level.toUpperCase()}] ${w.message}`);
      });
    } else {
      console.log('✅ Context usage is healthy');
    }
    
    console.log('');
    console.log(`Action: ${result.action}`);
    
    process.exit(result.shouldStop ? 1 : 0);
    
  } else {
    console.log('Usage: node context-budget-guard.cjs <command> [args]');
    console.log('Commands:');
    console.log('  check <current> <max>  - Check budget with explicit values');
    console.log('  status [contextPath]   - Check budget from context file');
    process.exit(1);
  }
}

module.exports = {
  getTokenUsage,
  checkContextBudget,
  shouldStop,
  getRecommendedAction,
  checkBudget,
  THRESHOLDS,
  MODEL_LIMITS
};
