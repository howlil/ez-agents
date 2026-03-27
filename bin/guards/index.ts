/**
 * Guards Module
 *
 * Consolidated runtime guards for safety and quality.
 * All guards are pure functions for easy testing and composition.
 *
 * @example
 * ```typescript
 * import { checkContextBudget, checkIrreversibleOps, checkToolSprawl } from '../guards';
 *
 * const budgetResult = checkContextBudget(150000, 200000);
 * if (budgetResult.shouldStop) { /* handle error * / }
 * ```
 */

// ─────────────────────────────────────────────
// Type Definitions (Shared)
// ─────────────────────────────────────────────

type WarningLevel = 'none' | 'info' | 'warning' | 'error';

// ─────────────────────────────────────────────
// CONTEXT BUDGET GUARD
// Prevents context budget exhaustion with progressive warnings
// ─────────────────────────────────────────────

export interface ContextBudgetResult {
  percent: number;
  level: WarningLevel;
  message: string | null;
  warnings: Array<{ level: WarningLevel; message: string }>;
  shouldStop: boolean;
}

export interface TokenUsageInfo {
  currentTokens: number;
  maxTokens: number;
  percent: number;
}

/**
 * Warning thresholds for context budget
 */
export const CONTEXT_BUDGET_THRESHOLDS = {
  INFO: 50,      // 50% - Info warning
  WARNING: 70,   // 70% - Warning level
  ERROR: 80      // 80% - Hard stop
} as const;

/**
 * Warning messages for each threshold level
 */
const CONTEXT_BUDGET_MESSAGES: Record<keyof typeof CONTEXT_BUDGET_THRESHOLDS, string> = {
  INFO: 'Context usage at {percent}% - quality degradation begins',
  WARNING: 'Context usage at {percent}% - efficiency mode engaged',
  ERROR: 'Context usage at {percent}% - hard stop'
};

/**
 * Check context budget and return progressive warnings
 *
 * @param tokenUsage - Current token count
 * @param modelLimits - Maximum token limit for the model
 * @returns Context budget result
 */
export function checkContextBudget(tokenUsage: number, modelLimits: number): ContextBudgetResult {
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
  const warnings: Array<{ level: WarningLevel; message: string }> = [];
  let level: WarningLevel = 'none';
  let message: string | null = null;
  let shouldStop = false;

  if (percent >= CONTEXT_BUDGET_THRESHOLDS.ERROR) {
    level = 'error';
    message = CONTEXT_BUDGET_MESSAGES.ERROR.replace('{percent}', percent.toString());
    shouldStop = true;
    warnings.push({ level: 'error', message });
  } else if (percent >= CONTEXT_BUDGET_THRESHOLDS.WARNING) {
    level = 'warning';
    message = CONTEXT_BUDGET_MESSAGES.WARNING.replace('{percent}', percent.toString());
    warnings.push({ level: 'warning', message });
    if (percent >= CONTEXT_BUDGET_THRESHOLDS.INFO) {
      warnings.unshift({
        level: 'info',
        message: CONTEXT_BUDGET_MESSAGES.INFO.replace('{percent}', String(CONTEXT_BUDGET_THRESHOLDS.INFO))
      });
    }
  } else if (percent >= CONTEXT_BUDGET_THRESHOLDS.INFO) {
    level = 'info';
    message = CONTEXT_BUDGET_MESSAGES.INFO.replace('{percent}', percent.toString());
    warnings.push({ level: 'info', message });
  }

  return { percent, level, message, warnings, shouldStop };
}

/**
 * Check if context budget has reached the hard stop threshold
 *
 * @param tokenUsage - Current token count
 * @param modelLimits - Maximum token limit
 * @returns True if usage >= 80%
 */
export function shouldStopContextBudget(tokenUsage: number, modelLimits: number): boolean {
  if (!modelLimits || modelLimits <= 0) return false;
  const percent = (tokenUsage / modelLimits) * 100;
  return percent >= CONTEXT_BUDGET_THRESHOLDS.ERROR;
}

// ─────────────────────────────────────────────
// AUTONOMY GUARD
// Detects irreversible operations requiring human approval
// ─────────────────────────────────────────────

export interface IrreversibleCheckResult {
  irreversible: boolean;
  requiresApproval: boolean;
  reason: string;
  category: string;
}

export interface FlaggedOperation {
  operation: string;
  irreversible: boolean;
  requiresApproval: boolean;
  reason: string;
  category: string;
}

export interface AutonomyCheckResult {
  requiresApproval: boolean;
  flaggedOperations: FlaggedOperation[];
  safeOperations: FlaggedOperation[];
  recommendation: string;
}

/**
 * Operations that require human approval
 */
const IRREVERSIBLE_OPERATIONS = [
  'drop database', 'drop table', 'truncate', 'delete all', 'delete from',
  'drop column', 'drop index', 'schema migration', 'data migration',
  'rm -rf', 'del /f', 'delete directory', 'remove directory', 'format',
  'production deploy', 'deploy to production', 'release to production', 'push to production',
  'delete user', 'revoke access', 'reset credentials', 'delete api key', 'rotate secrets',
  'terminate instance', 'delete cluster', 'destroy environment', 'scale down to zero'
] as const;

/**
 * Operations that are generally safe
 */
const SAFE_OPERATIONS = [
  'read', 'list', 'get', 'fetch', 'query', 'select', 'create', 'insert',
  'update', 'build', 'compile', 'test', 'lint', 'format'
] as const;

/**
 * Categorize an operation
 */
export function categorizeOperation(operation: string): string {
  const lowerOp = operation.toLowerCase();
  if (lowerOp.includes('database') || lowerOp.includes('table') || lowerOp.includes('schema')) return 'database';
  if (lowerOp.includes('file') || lowerOp.includes('directory') || lowerOp.includes('rm ') || lowerOp.includes('del ')) return 'filesystem';
  if (lowerOp.includes('deploy') || lowerOp.includes('production') || lowerOp.includes('release')) return 'deployment';
  if (lowerOp.includes('user') || lowerOp.includes('access') || lowerOp.includes('credential') || lowerOp.includes('secret')) return 'security';
  if (lowerOp.includes('instance') || lowerOp.includes('cluster') || lowerOp.includes('environment')) return 'infrastructure';
  return 'general';
}

/**
 * Check if an operation is irreversible
 *
 * @param operation - Operation description
 * @returns Check result
 */
export function checkIrreversibleOps(operation: string): IrreversibleCheckResult {
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

  return {
    irreversible: false,
    requiresApproval: false,
    reason: 'Operation not classified - assuming safe',
    category: 'unknown'
  };
}

/**
 * Check if operation requires human approval
 *
 * @param operation - Operation description
 * @returns True if approval required
 */
export function requiresHumanApproval(operation: string): boolean {
  return checkIrreversibleOps(operation).requiresApproval;
}

/**
 * Full autonomy check
 *
 * @param output - AI generated output describing operations
 * @returns Complete autonomy check result
 */
export function checkAutonomy(output: string): AutonomyCheckResult {
  const operationPatterns = [
    /(?:will|would|should|must|need to)\s+(?:then\s+)?([A-Z][^.!?]*(?:database|table|file|directory|deploy|production|user)[^.!?]*)/gi,
    /(?:step \d+[:\s]+)([A-Z][^.!?]+)/gi,
    /(?:command|operation)[:\s]+([A-Z][^.!?]+)/gi
  ];

  const operations = new Set<string>();
  for (const pattern of operationPatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(output)) !== null) {
      const op = (match[1] || '').trim();
      if (op.length > 10 && op.length < 200) operations.add(op);
    }
  }

  const flaggedOperations: FlaggedOperation[] = [];
  const safeOperations: FlaggedOperation[] = [];

  for (const op of operations) {
    const result = checkIrreversibleOps(op);
    if (result.requiresApproval) {
      flaggedOperations.push({ operation: op, ...result });
    } else {
      safeOperations.push({ operation: op, ...result });
    }
  }

  return {
    requiresApproval: flaggedOperations.length > 0,
    flaggedOperations,
    safeOperations,
    recommendation: flaggedOperations.length > 0
      ? `Human approval required for ${flaggedOperations.length} operation(s)`
      : 'All operations are safe to execute autonomously'
  };
}

// ─────────────────────────────────────────────
// HALLUCINATION GUARD
// Prevents AI hallucinations by requiring citations
// ─────────────────────────────────────────────

export interface Citation {
  source: string;
  evidence: string;
  line?: number;
  verified?: boolean;
}

export interface CitationCheckResult {
  cited: boolean;
  citations: Citation[];
  uncertainty: boolean;
}

export interface UncertaintyFlagResult {
  flagged: boolean;
  markers: Array<{ marker: string; position: number }>;
  confidence: number;
}

/**
 * Uncertainty markers that indicate potential hallucinations
 */
export const UNCERTAINTY_MARKERS = [
  'might', 'could', 'possibly', 'perhaps', 'may', 'probably', 'likely',
  'seems', 'appears', 'suggests', 'presumably', 'potentially', 'i think',
  'i believe', 'in my opinion', 'as far as i know', 'to the best of my knowledge',
  'not sure', 'uncertain', 'maybe'
] as const;

/**
 * Check if text contains uncertainty markers
 *
 * @param text - Text to check
 * @returns True if contains uncertainty
 */
export function hasUncertainty(text: string): boolean {
  const lowerText = text.toLowerCase();
  return UNCERTAINTY_MARKERS.some(marker => lowerText.includes(marker));
}

/**
 * Scan AI output for uncertainty markers and flag for review
 *
 * @param output - AI-generated text to scan
 * @returns Uncertainty flag result
 */
export function flagUncertainty(output: string): UncertaintyFlagResult {
  const markers: Array<{ marker: string; position: number }> = [];
  const lowerOutput = output.toLowerCase();

  for (const marker of UNCERTAINTY_MARKERS) {
    let position = lowerOutput.indexOf(marker);
    while (position !== -1) {
      markers.push({ marker, position });
      position = lowerOutput.indexOf(marker, position + 1);
    }
  }

  const uncertaintyRatio = markers.length / Math.max(1, output.split(/\s+/).length);
  const confidence = Math.max(0, 1 - (uncertaintyRatio * 10));

  return {
    flagged: markers.length > 0,
    markers,
    confidence: Math.round(confidence * 100) / 100
  };
}

/**
 * Check if claim has citations in codebase
 *
 * @param claim - The claim to search for
 * @param context - Optional context directory path (default: process.cwd())
 * @returns Citation check result
 */
export function checkCitation(claim: string, context = process.cwd()): CitationCheckResult {
  const citations: Citation[] = [];
  const normalizedClaim = claim.trim().toLowerCase();

  if (!normalizedClaim) {
    return { cited: false, citations: [], uncertainty: false };
  }

  const uncertainty = hasUncertainty(claim);

  // Simple search: check if claim keywords appear in common files
  const searchFiles = ['package.json', 'README.md', 'tsconfig.json'];
  for (const file of searchFiles) {
    const filePath = `${context}/${file}`;
    try {
      const fs = require('fs');
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8').toLowerCase();
        const claimWords = normalizedClaim.split(/\s+/).filter((w: string) => w.length > 3);
        const matches = claimWords.filter((word: string) => content.includes(word));
        if (matches.length >= Math.min(2, claimWords.length)) {
          citations.push({
            source: file,
            evidence: matches.join(', '),
            verified: true
          });
        }
      }
    } catch {
      // Skip unreadable files
    }
  }

  return { cited: citations.length > 0, citations, uncertainty };
}

// ─────────────────────────────────────────────
// HIDDEN STATE GUARD
// Detects state not persisted to .planning/ files
// ─────────────────────────────────────────────

export interface HiddenStateResult {
  hasHiddenState: boolean;
  stateFiles: string[];
  stateReferences: string[];
  missing: string[];
  recommendation: string;
}

/**
 * Extract state references from text
 *
 * @param text - Text to analyze
 * @returns Array of state references
 */
export function extractStateReferences(text: string): string[] {
  const statePatterns = [
    /(?:state|status|progress|phase|step|current)[\s:]+([A-Z_]+\d*(?:\.\d+)?)/gi,
    /(?:task|plan|gate|edge)[\s:]+(\d+(?:-\d+)?)/gi,
    /(?:completed|finished|done|pending|blocked)[\s:]+([A-Z_]+)/gi
  ];

  const references = new Set<string>();
  for (const pattern of statePatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      references.add(match[0].toLowerCase());
    }
  }

  return Array.from(references);
}

/**
 * Check for hidden state (state not persisted to files)
 *
 * @param output - AI generated output
 * @param stateContents - Current persisted state content (concatenated)
 * @returns Hidden state result
 */
export function checkHiddenState(output: string, stateContents: string): HiddenStateResult {
  const stateReferences = extractStateReferences(output);

  const missing = stateReferences.filter(ref => {
    if (['state', 'status', 'phase', 'plan'].includes(ref)) return false;
    return !stateContents.toLowerCase().includes(ref);
  });

  return {
    hasHiddenState: missing.length > 0,
    stateFiles: [],
    stateReferences,
    missing,
    recommendation: missing.length > 0
      ? `Persist the following state to .planning/ files: ${missing.join(', ')}`
      : 'All state appears to be persisted'
  };
}

// ─────────────────────────────────────────────
// TEAM OVERHEAD GUARD
// Detects organizational change suggestions
// ─────────────────────────────────────────────

export interface OrgChangeSuggestion {
  keyword: string;
  context: string;
}

export interface OrgChangeDetectionResult {
  hasOrgChanges: boolean;
  suggestions: OrgChangeSuggestion[];
  keywordCount: number;
  overhead: string;
  recommendation: string;
}

export interface TeamOverheadCheckResult extends OrgChangeDetectionResult {
  summary: string;
  actionable: boolean;
  severity?: 'low' | 'medium' | 'high';
}

/**
 * Organizational change keywords
 */
const ORG_CHANGE_KEYWORDS = [
  'team structure', 'reorganize team', 'restructure team', 'new team', 'scrum team', 'squad', 'tribe',
  'new role', 'create role', 'hire', 'recruiting', 'job description', 'team lead', 'tech lead',
  'engineering manager', 'product owner', 'scrum master', 'architect role', 'dedicated person',
  'daily standup', 'sprint planning', 'retrospective', 'sprint review', 'new meeting', 'weekly sync',
  'change process', 'new workflow', 'approval process', 'sign-off', 'gate keeping', 'code review process',
  'communication channel', 'slack channel', 'teams channel', 'reporting structure', 'escalation path',
  'documentation requirement', 'design doc', 'rfc process', 'architecture review board'
] as const;

/**
 * Extract context around a keyword
 */
export function extractContext(text: string, keyword: string): string {
  const index = text.toLowerCase().indexOf(keyword);
  if (index === -1) return '';
  const start = Math.max(0, index - 50);
  const end = Math.min(text.length, index + keyword.length + 100);
  return text.substring(start, end).replace(/\s+/g, ' ').trim();
}

/**
 * Detect organizational changes in text
 *
 * @param output - AI generated text
 * @returns Org change detection result
 */
export function detectOrgChanges(output: string): OrgChangeDetectionResult {
  const lowerOutput = output.toLowerCase();
  const foundKeywords: string[] = [];
  const suggestions: OrgChangeSuggestion[] = [];

  for (const keyword of ORG_CHANGE_KEYWORDS) {
    if (lowerOutput.includes(keyword)) {
      foundKeywords.push(keyword);
      suggestions.push({ keyword, context: extractContext(output, keyword).trim() });
    }
  }

  return {
    hasOrgChanges: foundKeywords.length > 0,
    suggestions,
    keywordCount: foundKeywords.length,
    overhead: foundKeywords.length > 0 ? `${foundKeywords.length} organizational change(s) detected` : 'No organizational overhead',
    recommendation: foundKeywords.length > 0
      ? 'Consider if organizational changes are necessary for this task'
      : 'No organizational changes detected'
  };
}

/**
 * Check for team overhead in task context
 *
 * @param taskContext - Task description
 * @returns Team overhead analysis
 */
export function checkTeamOverhead(taskContext: string): TeamOverheadCheckResult {
  const orgChanges = detectOrgChanges(taskContext);

  return {
    ...orgChanges,
    summary: orgChanges.hasOrgChanges
      ? `⚠️ Found ${orgChanges.keywordCount} organizational change suggestion(s)`
      : '✅ No organizational changes detected',
    actionable: orgChanges.hasOrgChanges,
    severity: orgChanges.keywordCount > 3 ? 'high' : orgChanges.keywordCount > 1 ? 'medium' : 'low'
  };
}

// ─────────────────────────────────────────────
// TOOL SPRAWL GUARD
// Enforces 3-7 skills/tools per task limit
// ─────────────────────────────────────────────

export interface ToolCountCheckResult {
  count: number;
  withinLimit: boolean;
  exceeded: number;
  minRecommended: number;
  maxRecommended: number;
  status: 'below-recommended' | 'optimal' | 'exceeded';
}

export interface ToolSprawlAnalysisResult extends ToolCountCheckResult {
  tools: string[];
  actionable: boolean;
  summary: string;
}

/**
 * Get active tools/skills from task context
 *
 * @param taskContext - Task description or context
 * @returns Array of active tools/skills
 */
export function getActiveTools(taskContext: string): string[] {
  const toolPatterns = [
    /(?:using|with|via|through|use)\s+(?:the\s+)?(['"]?)([^'"\s,]+)\1(?:\s+(?:library|tool|package|framework|skill))?/gi,
    /(?:tool|library|package|framework|skill)[:\s]+(['"]?)([^'"\s,]+)\1/gi,
    /@([a-z0-9_-]+\/[a-z0-9_-]+)/gi
  ];

  const tools = new Set<string>();
  for (const pattern of toolPatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(taskContext)) !== null) {
      const toolName = match[2] || match[1];
      if (toolName) tools.add(toolName.toLowerCase().replace(/['"]/g, ''));
    }
  }

  return Array.from(tools);
}

/**
 * Check tool count against limits
 *
 * @param activeTools - Array of active tools/skills
 * @returns Tool count check result
 */
export function checkToolCount(activeTools: readonly string[]): ToolCountCheckResult {
  const count = activeTools.length;
  const minRecommended = 3;
  const maxRecommended = 7;

  return {
    count,
    withinLimit: count <= maxRecommended,
    exceeded: Math.max(0, count - maxRecommended),
    minRecommended,
    maxRecommended,
    status: count < minRecommended ? 'below-recommended' : count > maxRecommended ? 'exceeded' : 'optimal'
  };
}

/**
 * Full tool sprawl check
 *
 * @param taskContext - Task description
 * @returns Complete tool sprawl analysis
 */
export function checkToolSprawl(taskContext: string): ToolSprawlAnalysisResult {
  const activeTools = getActiveTools(taskContext);
  const toolCheck = checkToolCount(activeTools);

  return {
    ...toolCheck,
    tools: activeTools,
    actionable: !toolCheck.withinLimit,
    summary: toolCheck.withinLimit
      ? `✅ Using ${toolCheck.count} tools (optimal: 3-7)`
      : `⚠️ Using ${toolCheck.count} tools (${toolCheck.exceeded} over limit)`
  };
}

// ─────────────────────────────────────────────
// Default Export (All Guards)
// ─────────────────────────────────────────────

export default {
  // Context Budget
  checkContextBudget,
  shouldStopContextBudget,
  CONTEXT_BUDGET_THRESHOLDS,

  // Autonomy
  checkIrreversibleOps,
  requiresHumanApproval,
  checkAutonomy,
  categorizeOperation,

  // Hallucination
  checkCitation,
  hasUncertainty,
  flagUncertainty,
  UNCERTAINTY_MARKERS,

  // Hidden State
  checkHiddenState,
  extractStateReferences,

  // Team Overhead
  checkTeamOverhead,
  detectOrgChanges,
  extractContext,

  // Tool Sprawl
  checkToolSprawl,
  checkToolCount,
  getActiveTools
};
