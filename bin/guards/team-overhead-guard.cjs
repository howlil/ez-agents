/**
 * EDGE-06: Team Overhead Guard
 * 
 * Detects organizational change suggestions.
 * Prevents suggesting team restructuring without explicit need.
 */

// Organizational change keywords
const ORG_CHANGE_KEYWORDS = [
  // Team structure
  'team structure', 'reorganize team', 'restructure team', 'new team',
  'scrum team', 'squad', 'tribe', 'chapter', 'guild',
  
  // Roles and positions
  'new role', 'create role', 'hire', 'recruiting', 'job description',
  'team lead', 'tech lead', 'engineering manager', 'product owner',
  'scrum master', 'architect role', 'dedicated person',
  
  // Meetings and ceremonies
  'daily standup', 'sprint planning', 'retrospective', 'sprint review',
  'new meeting', 'weekly sync', 'bi-weekly', 'ceremony',
  
  // Process changes
  'change process', 'new workflow', 'approval process', 'sign-off',
  'gate keeping', 'code review process', 'pr review requirement',
  
  // Communication
  'communication channel', 'slack channel', 'teams channel',
  'reporting structure', 'escalation path', 'chain of command',
  
  // Documentation overhead
  'documentation requirement', 'design doc', 'rfc process',
  'architecture review board', 'change advisory board'
];

// Legitimate technical suggestions (not org changes)
const TECHNICAL_SUGGESTIONS = [
  'add test', 'write test', 'create component', 'implement feature',
  'refactor', 'optimize', 'fix bug', 'update dependency',
  'add logging', 'add monitoring', 'improve performance'
];

/**
 * Detect organizational changes in text
 * @param {string} output - AI generated text
 * @returns {object} { hasOrgChanges: boolean, suggestions: array, overhead: string }
 */
function detectOrgChanges(output) {
  const lowerOutput = output.toLowerCase();
  const foundKeywords = [];
  const suggestions = [];
  
  // Check for org change keywords
  for (const keyword of ORG_CHANGE_KEYWORDS) {
    if (lowerOutput.includes(keyword)) {
      foundKeywords.push(keyword);
      
      // Extract the surrounding suggestion
      const context = extractContext(output, keyword);
      suggestions.push({
        keyword,
        context: context.trim()
      });
    }
  }
  
  // Check if these are actually org changes vs technical suggestions
  const isTechnicalOnly = TECHNICAL_SUGGESTIONS.some(tech => 
    lowerOutput.includes(tech) && foundKeywords.length === 0
  );
  
  return {
    hasOrgChanges: foundKeywords.length > 0 && !isTechnicalOnly,
    suggestions,
    keywordCount: foundKeywords.length,
    overhead: estimateOverhead(suggestions),
    recommendation: foundKeywords.length > 0
      ? 'Consider if organizational changes are necessary for this task'
      : 'No organizational changes detected'
  };
}

/**
 * Flag team restructuring suggestions
 * @param {string} suggestion - The suggestion text
 * @returns {object} Flagged suggestion details
 */
function flagTeamRestructure(suggestion) {
  const result = detectOrgChanges(suggestion);
  
  return {
    flagged: result.hasOrgChanges,
    ...result,
    severity: result.keywordCount > 3 
      ? 'high' 
      : result.keywordCount > 1 
        ? 'medium' 
        : 'low',
    action: result.hasOrgChanges
      ? 'Requires explicit justification and user approval'
      : 'No action needed'
  };
}

/**
 * Check overhead of organizational changes
 * @param {array} suggestions - Array of organizational suggestions
 * @returns {string} Estimated overhead description
 */
function estimateOverhead(suggestions) {
  if (suggestions.length === 0) {
    return 'No organizational overhead';
  }
  
  const categories = new Set();
  
  for (const suggestion of suggestions) {
    if (['team structure', 'reorganize', 'restructure', 'squad', 'tribe'].some(k => suggestion.keyword.includes(k))) {
      categories.add('team-restructure');
    }
    if (['role', 'hire', 'recruit', 'lead', 'manager'].some(k => suggestion.keyword.includes(k))) {
      categories.add('hiring-roles');
    }
    if (['meeting', 'standup', 'ceremony', 'sync'].some(k => suggestion.keyword.includes(k))) {
      categories.add('meeting-overhead');
    }
    if (['process', 'workflow', 'approval', 'sign-off'].some(k => suggestion.keyword.includes(k))) {
      categories.add('process-overhead');
    }
  }
  
  const overheadEstimates = {
    'team-restructure': 'High: Team restructuring has long-term impact',
    'hiring-roles': 'High: New roles require budget and time',
    'meeting-overhead': 'Medium: Recurring time commitment',
    'process-overhead': 'Medium: Ongoing process overhead'
  };
  
  const estimates = Array.from(categories).map(c => overheadEstimates[c]);
  
  if (estimates.length === 0) {
    return 'Low: Minor organizational impact';
  }
  
  return estimates.join('; ');
}

/**
 * Check for team overhead in task context
 * @param {string} taskContext - Task description
 * @returns {object} Team overhead analysis
 */
function checkOverhead(taskContext) {
  const orgChanges = detectOrgChanges(taskContext);
  const flagged = flagTeamRestructure(taskContext);
  
  return {
    hasOrgChanges: orgChanges.hasOrgChanges,
    suggestions: orgChanges.suggestions,
    overhead: orgChanges.overhead,
    severity: flagged.severity,
    actionable: flagged.flagged,
    recommendation: flagged.flagged
      ? 'Remove organizational suggestions or explicitly justify them'
      : 'Task context is appropriate'
  };
}

/**
 * Extract context around a keyword
 * @param {string} text - Full text
 * @param {string} keyword - Keyword to find context for
 * @returns {string} Context around keyword
 */
function extractContext(text, keyword) {
  const index = text.toLowerCase().indexOf(keyword);
  if (index === -1) return '';
  
  const start = Math.max(0, index - 50);
  const end = Math.min(text.length, index + keyword.length + 100);
  
  return text.substring(start, end)
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Full team overhead check
 * @param {string} output - AI generated output
 * @returns {object} Complete team overhead analysis
 */
function checkTeamOverhead(output) {
  const orgChanges = detectOrgChanges(output);
  
  return {
    ...orgChanges,
    summary: orgChanges.hasOrgChanges
      ? `⚠️  Found ${orgChanges.keywordCount} organizational change suggestion(s)`
      : '✅ No organizational changes detected',
    actionable: orgChanges.hasOrgChanges
  };
}

/**
 * CLI entry point
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'check') {
    const text = args.slice(1).join(' ') || process.stdin.read();
    
    if (!text.trim()) {
      console.log('Usage: node team-overhead-guard.cjs check <text>');
      console.log('  or:  echo "text" | node team-overhead-guard.cjs check');
      process.exit(1);
    }
    
    const result = checkTeamOverhead(text);
    
    console.log('Team Overhead Analysis');
    console.log('======================');
    console.log(result.summary);
    
    if (result.suggestions.length > 0) {
      console.log('');
      console.log('Organizational suggestions found:');
      result.suggestions.forEach((s, i) => {
        console.log(`  ${i + 1}. "${s.context}"`);
        console.log(`     Keyword: ${s.keyword}`);
      });
      
      console.log('');
      console.log(`Estimated overhead: ${result.overhead}`);
      console.log('');
      console.log('Recommendation:');
      console.log(`  ${result.recommendation}`);
    }
    
    process.exit(result.hasOrgChanges ? 1 : 0);
    
  } else if (command === 'keywords') {
    console.log('Organizational change keywords:');
    ORG_CHANGE_KEYWORDS.forEach(k => console.log(`  - ${k}`));
    process.exit(0);
    
  } else {
    console.log('Usage: node team-overhead-guard.cjs <command> [args]');
    console.log('Commands:');
    console.log('  check [text]     - Analyze for organizational changes');
    console.log('  keywords         - List organizational change keywords');
    process.exit(1);
  }
}

module.exports = {
  detectOrgChanges,
  flagTeamRestructure,
  estimateOverhead,
  checkOverhead,
  checkTeamOverhead,
  extractContext,
  ORG_CHANGE_KEYWORDS,
  TECHNICAL_SUGGESTIONS
};
