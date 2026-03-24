/**
 * EDGE-05: Tool Sprawl Guard
 * 
 * Enforces 3-7 skills/tools per task limit.
 * Prevents cognitive overload and maintains focus.
 */

// Recommended skill/tool categories
const SKILL_CATEGORIES = {
  core: ['runtime', 'framework', 'language'],
  testing: ['test-runner', 'assertion', 'mocking', 'coverage'],
  database: ['orm', 'query-builder', 'migration', 'driver'],
  ui: ['component-library', 'styling', 'state-management', 'routing'],
  devops: ['bundler', 'linter', 'formatter', 'ci-cd']
};

/**
 * Get active tools/skills from task context
 * @param {string} taskContext - Task description or context
 * @returns {string[]} Array of active tools/skills
 */
function getActiveTools(taskContext) {
  const toolPatterns = [
    /(?:using|with|via|through|use|via)\s+(?:the\s+)?(['"]?)([^'"\s,]+)\1(?:\s+(?:library|tool|package|framework|skill))?/gi,
    /(?:tool|library|package|framework|skill)[:\s]+(['"]?)([^'"\s,]+)\1/gi,
    /@([a-z0-9_-]+\/[a-z0-9_-]+)/gi,  // npm scoped packages
    /(?:npm|yarn|pnpm)\s+(?:install|add)\s+([^&|;\n]+)/gi
  ];
  
  const tools = new Set();
  
  for (const pattern of toolPatterns) {
    let match;
    while ((match = pattern.exec(taskContext)) !== null) {
      // Extract the tool name (group 2 for most patterns, group 1 for scoped)
      const toolName = match[2] || match[1];
      if (toolName) {
        tools.add(toolName.toLowerCase().replace(/['"]/g, ''));
      }
    }
  }
  
  return Array.from(tools);
}

/**
 * Check tool count against limits
 * @param {string[]} activeTools - Array of active tools/skills
 * @returns {object} { count: number, withinLimit: boolean, exceeded: number }
 */
function checkToolCount(activeTools) {
  const count = activeTools.length;
  const minRecommended = 3;
  const maxRecommended = 7;
  
  let withinLimit = true;
  let exceeded = 0;
  
  if (count > maxRecommended) {
    withinLimit = false;
    exceeded = count - maxRecommended;
  }
  
  return {
    count,
    withinLimit,
    exceeded,
    minRecommended,
    maxRecommended,
    status: count < minRecommended 
      ? 'below-recommended' 
      : count > maxRecommended 
        ? 'exceeded' 
        : 'optimal'
  };
}

/**
 * Enforce skill limit on a task
 * @param {string} taskContext - Task description
 * @returns {object} Enforcement result with recommendations
 */
function enforceSkillLimit(taskContext) {
  const activeTools = getActiveTools(taskContext);
  const toolCheck = checkToolCount(activeTools);
  
  if (toolCheck.withinLimit) {
    return {
      enforced: true,
      tools: activeTools,
      ...toolCheck,
      recommendation: 'Tool count is within recommended limits'
    };
  }
  
  // Categorize tools
  const categorized = categorizeTools(activeTools);
  
  // Recommend which tools to keep
  const recommended = recommendTools(categorized, taskContext);
  
  return {
    enforced: false,
    tools: activeTools,
    ...toolCheck,
    categorized,
    recommended,
    recommendation: `Reduce from ${toolCheck.count} to ${toolCheck.maxRecommended} tools. Consider removing: ${activeTools.filter(t => !recommended.includes(t)).join(', ')}`
  };
}

/**
 * Categorize tools by function
 * @param {string[]} tools - Array of tools
 * @returns {object} Categorized tools
 */
function categorizeTools(tools) {
  const categories = {
    core: [],
    testing: [],
    database: [],
    ui: [],
    devops: [],
    other: []
  };
  
  // Simple categorization based on tool name patterns
  const categoryPatterns = {
    testing: ['jest', 'vitest', 'mocha', 'chai', 'sinon', 'playwright', 'cypress', 'test'],
    database: ['prisma', 'mongoose', 'sequelize', 'typeorm', 'knex', 'mongo', 'postgres', 'mysql'],
    ui: ['react', 'vue', 'angular', 'svelte', 'tailwind', 'bootstrap', 'material', 'chakra'],
    devops: ['webpack', 'vite', 'rollup', 'eslint', 'prettier', 'husky', 'lint']
  };
  
  for (const tool of tools) {
    let categorized = false;
    
    for (const [category, patterns] of Object.entries(categoryPatterns)) {
      if (patterns.some(p => tool.toLowerCase().includes(p))) {
        categories[category].push(tool);
        categorized = true;
        break;
      }
    }
    
    if (!categorized) {
      categories.other.push(tool);
    }
  }
  
  return categories;
}

/**
 * Recommend which tools to keep based on task context
 * @param {object} categorized - Categorized tools
 * @param {string} taskContext - Task description
 * @returns {string[]} Recommended tools to keep
 */
function recommendTools(categorized, taskContext) {
  const recommended = [];
  const lowerContext = taskContext.toLowerCase();
  
  // Always keep core tools
  recommended.push(...categorized.core);
  
  // Add category based on task context
  if (lowerContext.includes('test') || lowerContext.includes('spec')) {
    recommended.push(...categorized.testing.slice(0, 2));
  }
  if (lowerContext.includes('database') || lowerContext.includes('model') || lowerContext.includes('schema')) {
    recommended.push(...categorized.database.slice(0, 2));
  }
  if (lowerContext.includes('ui') || lowerContext.includes('component') || lowerContext.includes('render')) {
    recommended.push(...categorized.ui.slice(0, 2));
  }
  if (lowerContext.includes('build') || lowerContext.includes('bundle') || lowerContext.includes('deploy')) {
    recommended.push(...categorized.devops.slice(0, 2));
  }
  
  // Add some other tools if space allows
  const remaining = 7 - recommended.length;
  if (remaining > 0) {
    recommended.push(...categorized.other.slice(0, remaining));
  }
  
  // Deduplicate
  return [...new Set(recommended)];
}

/**
 * Full tool sprawl check
 * @param {string} taskContext - Task description
 * @returns {object} Complete tool sprawl analysis
 */
function checkToolSprawl(taskContext) {
  const activeTools = getActiveTools(taskContext);
  const toolCheck = checkToolCount(activeTools);
  const enforcement = enforceSkillLimit(taskContext);
  
  return {
    ...toolCheck,
    tools: activeTools,
    enforcement,
    actionable: !toolCheck.withinLimit,
    summary: toolCheck.withinLimit
      ? `✅ Using ${toolCheck.count} tools (optimal: 3-7)`
      : `⚠️  Using ${toolCheck.count} tools (${toolCheck.exceeded} over limit)`
  };
}

/**
 * CLI entry point
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'check') {
    const context = args.slice(1).join(' ') || process.stdin.read();
    
    if (!context.trim()) {
      console.log('Usage: node tool-sprawl-guard.cjs check <task context>');
      console.log('  or:  echo "task context" | node tool-sprawl-guard.cjs check');
      process.exit(1);
    }
    
    const result = checkToolSprawl(context);
    
    console.log('Tool Sprawl Analysis');
    console.log('====================');
    console.log(`Tools found: ${result.count}`);
    console.log(`Status: ${result.status}`);
    console.log('');
    
    if (result.tools.length > 0) {
      console.log('Active tools:');
      result.tools.forEach(t => console.log(`  - ${t}`));
    }
    
    console.log('');
    console.log(result.summary);
    
    if (!result.withinLimit) {
      console.log('');
      console.log('Recommendation:');
      console.log(`  ${result.enforcement.recommendation}`);
      console.log('');
      console.log('Recommended tools to keep:');
      result.enforcement.recommended.forEach(t => console.log(`  - ${t}`));
    }
    
    process.exit(result.withinLimit ? 0 : 1);
    
  } else {
    console.log('Usage: node tool-sprawl-guard.cjs <command> [args]');
    console.log('Commands:');
    console.log('  check [context]  - Analyze tool usage (reads from stdin if no args)');
    process.exit(1);
  }
}

module.exports = {
  getActiveTools,
  checkToolCount,
  enforceSkillLimit,
  categorizeTools,
  recommendTools,
  checkToolSprawl,
  SKILL_CATEGORIES
};
