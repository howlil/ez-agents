#!/usr/bin/env node
'use strict';

/**
 * Output Format Validator
 *
 * Validates agent output against standardized format requirements.
 * Checks for decision logs, trade-off analysis, artifacts, skills, and verification status.
 *
 * @module output-validator
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Required sections in agent output
 */
const REQUIRED_SECTIONS = {
  DECISION_LOG: {
    patterns: [/## Decisions Made/i, /## Decision Log/i, /### Decisions/i],
    name: 'Decision Log'
  },
  TRADE_OFF_ANALYSIS: {
    patterns: [/## Trade-off Analysis/i, /## Tradeoffs/i, /### Trade-offs/i],
    name: 'Trade-off Analysis'
  },
  ARTIFACTS_PRODUCED: {
    patterns: [/## Artifacts Produced/i, /## Artifacts/i, /### Files Created/i, /### Files Modified/i],
    name: 'Artifacts Produced'
  },
  SKILLS_APPLIED: {
    patterns: [/## Skills Applied/i, /## Skills Activated/i, /### Skills/i],
    name: 'Skills Applied'
  },
  VERIFICATION_STATUS: {
    patterns: [/## Verification Status/i, /## Self-Check/i, /### Verification/i],
    name: 'Verification Status'
  }
};

/**
 * Required fields in decision log
 */
const DECISION_FIELDS = {
  CONTEXT: { pattern: /\*\*Context\*\*:/i, name: 'Context' },
  OPTIONS: { pattern: /\*\*Options Considered\*\*:/i, name: 'Options Considered' },
  DECISION: { pattern: /\*\*Decision\*\*:/i, name: 'Decision' },
  RATIONALE: { pattern: /\*\*Rationale\*\*:/i, name: 'Rationale' },
  TRADE_OFFS: { pattern: /\*\*Trade-offs\*\*:/i, name: 'Trade-offs' },
  SKILLS: { pattern: /\*\*Skills Applied\*\*:/i, name: 'Skills Applied' },
  IMPACT: { pattern: /\*\*Impact\*\*:/i, name: 'Impact' }
};

/**
 * Validation severity levels
 */
const SEVERITY = {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate output against standardized format requirements
 *
 * @param {string} output - Agent output text
 * @returns {Object} Validation report: { valid, errors, warnings, suggestions, sections }
 */
function validateOutput(output) {
  const report = {
    valid: true,
    errors: [],
    warnings: [],
    suggestions: [],
    sections: {},
    scores: {}
  };

  if (!output || typeof output !== 'string') {
    report.valid = false;
    report.errors.push({
      section: 'Output',
      message: 'Output is empty or invalid',
      severity: SEVERITY.ERROR
    });
    return report;
  }

  // Check each required section
  for (const [key, section] of Object.entries(REQUIRED_SECTIONS)) {
    const found = section.patterns.some(pattern => pattern.test(output));
    report.sections[key] = found;

    if (!found) {
      report.valid = false;
      report.errors.push({
        section: section.name,
        message: `Missing required section: ${section.name}`,
        severity: SEVERITY.ERROR,
        hint: `Add a section matching one of: ${section.patterns.map(p => p.source).join(', ')}`
      });
    }
  }

  // Calculate section completeness score
  const sectionsFound = Object.values(report.sections).filter(v => v).length;
  report.scores.sectionsComplete = sectionsFound / Object.keys(REQUIRED_SECTIONS).length;

  // Check decision log fields if section exists
  if (report.sections.DECISION_LOG) {
    const decisionValidation = checkDecisionLog(output);
    report.warnings.push(...decisionValidation.warnings);
    report.suggestions.push(...decisionValidation.suggestions);
    report.scores.decisionFields = decisionValidation.score;
  }

  // Check trade-off analysis
  if (report.sections.TRADE_OFF_ANALYSIS) {
    const tradeOffValidation = checkTradeOffs(output);
    report.warnings.push(...tradeOffValidation.warnings);
    report.suggestions.push(...tradeOffValidation.suggestions);
    report.scores.tradeOffComplete = tradeOffValidation.score;
  }

  // Check artifacts section
  if (report.sections.ARTIFACTS_PRODUCED) {
    const artifactsValidation = checkArtifacts(output);
    report.warnings.push(...artifactsValidation.warnings);
    report.suggestions.push(...artifactsValidation.suggestions);
    report.scores.artifactsComplete = artifactsValidation.score;
  }

  // Check skills applied
  if (report.sections.SKILLS_APPLIED) {
    const skillsValidation = checkSkillsApplied(output);
    report.warnings.push(...skillsValidation.warnings);
    report.suggestions.push(...skillsValidation.suggestions);
    report.scores.skillsValid = skillsValidation.valid;
    report.scores.skillCount = skillsValidation.skillCount;
  }

  // Check verification status
  if (report.sections.VERIFICATION_STATUS) {
    const verificationValidation = checkVerificationStatus(output);
    report.warnings.push(...verificationValidation.warnings);
    report.suggestions.push(...verificationValidation.suggestions);
    report.scores.verificationComplete = verificationValidation.score;
  }

  // Calculate overall score
  report.scores.overall = calculateOverallScore(report.scores);

  return report;
}

/**
 * Verify decision log has all required fields
 *
 * @param {string} output - Agent output text
 * @returns {Object} Validation result: { valid, warnings, suggestions, score }
 */
function checkDecisionLog(output) {
  const result = {
    valid: true,
    warnings: [],
    suggestions: [],
    score: 0
  };

  let fieldsFound = 0;
  const totalFields = Object.keys(DECISION_FIELDS).length;

  for (const [key, field] of Object.entries(DECISION_FIELDS)) {
    if (field.pattern.test(output)) {
      fieldsFound++;
    } else {
      result.warnings.push({
        field: field.name,
        message: `Decision log missing field: ${field.name}`,
        severity: SEVERITY.WARNING,
        hint: `Add **${field.name}:** to your decision log`
      });
    }
  }

  result.score = fieldsFound / totalFields;

  // Check for at least one complete decision
  const decisionCount = (output.match(/\*\*Decision\*\*:/gi) || []).length;
  if (decisionCount === 0) {
    result.warnings.push({
      field: 'Decision Count',
      message: 'No decisions documented in decision log',
      severity: SEVERITY.WARNING,
      hint: 'Document at least one decision with full context'
    });
  } else if (decisionCount < 2) {
    result.suggestions.push({
      message: `Only ${decisionCount} decision documented - consider documenting all significant decisions`,
      severity: SEVERITY.INFO
    });
  }

  // Check for options comparison (at least 2 options mentioned)
  const optionsMatch = output.match(/\d+\.\s*\[?[A-Z]/gi);
  if (!optionsMatch || optionsMatch.length < 2) {
    result.suggestions.push({
      message: 'Consider listing at least 2-3 options for each decision',
      severity: SEVERITY.INFO
    });
  }

  return result;
}

/**
 * Verify trade-off analysis is present and complete
 *
 * @param {string} output - Agent output text
 * @returns {Object} Validation result: { valid, warnings, suggestions, score }
 */
function checkTradeOffs(output) {
  const result = {
    valid: true,
    warnings: [],
    suggestions: [],
    score: 0
  };

  let criteriaMet = 0;
  const totalCriteria = 5;

  // Check for comparison table (markdown table with |)
  const hasTable = /\|.*\|.*\|/.test(output);
  if (hasTable) {
    criteriaMet++;
  } else {
    result.warnings.push({
      criterion: 'Comparison Table',
      message: 'Trade-off analysis missing comparison table',
      severity: SEVERITY.WARNING,
      hint: 'Use markdown table format to compare options'
    });
  }

  // Check for pros listed
  const hasPros = /✅?\s*Pros:/i.test(output) || /\*\*Pros\*\*/i.test(output) || /- \[+\]/i.test(output);
  if (hasPros) {
    criteriaMet++;
  } else {
    result.warnings.push({
      criterion: 'Pros',
      message: 'Trade-off analysis missing pros/advantages',
      severity: SEVERITY.WARNING
    });
  }

  // Check for cons listed
  const hasCons = /❌?\s*Cons:/i.test(output) || /\*\*Cons\*\*/i.test(output) || /- \[-\]/i.test(output);
  if (hasCons) {
    criteriaMet++;
  } else {
    result.warnings.push({
      criterion: 'Cons',
      message: 'Trade-off analysis missing cons/disadvantages',
      severity: SEVERITY.WARNING
    });
  }

  // Check for recommendation
  const hasRecommendation = /\*\*Recommendation\*\*:/i.test(output) || /\*\*Decision\*\*:/i.test(output);
  if (hasRecommendation) {
    criteriaMet++;
  } else {
    result.warnings.push({
      criterion: 'Recommendation',
      message: 'Trade-off analysis missing clear recommendation',
      severity: SEVERITY.WARNING
    });
  }

  // Check for rationale
  const hasRationale = /\*\*Why\*\*:/i.test(output) || /\*\*Rationale\*\*:/i.test(output);
  if (hasRationale) {
    criteriaMet++;
  } else {
    result.suggestions.push({
      message: 'Add explicit "Why" explanation for the recommendation',
      severity: SEVERITY.INFO
    });
  }

  result.score = criteriaMet / totalCriteria;

  // Check for confidence level
  const hasConfidence = /\*\*Confidence\*\*:/i.test(output);
  if (!hasConfidence) {
    result.suggestions.push({
      message: 'Consider adding confidence level (High/Medium/Low)',
      severity: SEVERITY.INFO
    });
  }

  return result;
}

/**
 * Verify artifacts section is complete
 *
 * @param {string} output - Agent output text
 * @returns {Object} Validation result: { valid, warnings, suggestions, score }
 */
function checkArtifacts(output) {
  const result = {
    valid: true,
    warnings: [],
    suggestions: [],
    score: 0
  };

  let criteriaMet = 0;
  const totalCriteria = 4;

  // Check for files created
  const hasFilesCreated = /### Files Created/i.test(output) || /Files Created/i.test(output);
  const createdFiles = output.match(/[`']([^`'\s]+\.[^`'\s]+)[`']/g) || [];
  if (hasFilesCreated || createdFiles.length > 0) {
    criteriaMet++;
  } else {
    result.warnings.push({
      criterion: 'Files Created',
      message: 'Artifacts section missing list of created files',
      severity: SEVERITY.WARNING
    });
  }

  // Check for files modified
  const hasFilesModified = /### Files Modified/i.test(output) || /Files Modified/i.test(output);
  if (hasFilesModified) {
    criteriaMet++;
  }

  // Check for documentation
  const hasDocumentation = /### Documentation/i.test(output) || /Documentation/i.test(output);
  if (hasDocumentation) {
    criteriaMet++;
  }

  // Check for purpose descriptions
  const hasPurpose = /Purpose/i.test(output) || /\|.*\|.*\|/.test(output);
  if (hasPurpose) {
    criteriaMet++;
  } else {
    result.suggestions.push({
      message: 'Add purpose descriptions for each artifact',
      severity: SEVERITY.INFO
    });
  }

  result.score = criteriaMet / totalCriteria;

  // Count total artifacts
  const totalArtifacts = createdFiles.length;
  if (totalArtifacts === 0 && !hasFilesModified) {
    result.warnings.push({
      criterion: 'Artifact Count',
      message: 'No artifacts listed - at least one file should be created or modified',
      severity: SEVERITY.WARNING
    });
  } else if (totalArtifacts > 10) {
    result.suggestions.push({
      message: `Large number of artifacts (${totalArtifacts}) - consider splitting task`,
      severity: SEVERITY.INFO
    });
  }

  return result;
}

/**
 * Verify skills section is present and valid
 *
 * @param {string} output - Agent output text
 * @returns {Object} Validation result: { valid, warnings, suggestions, skillCount }
 */
function checkSkillsApplied(output) {
  const result = {
    valid: true,
    warnings: [],
    suggestions: [],
    skillCount: 0
  };

  // Extract skill IDs (pattern: skill_id or 'skill_id' or `skill_id`)
  const skillPattern = /[`']?([a-z]+_[a-z_]+_skill[a-z0-9_]*)(v\d+)?[`']?/gi;
  const skills = new Set();
  let match;

  while ((match = skillPattern.exec(output)) !== null) {
    const skillId = match[1].toLowerCase();
    if (skillId.includes('skill')) {
      skills.add(skillId);
    }
  }

  result.skillCount = skills.size;

  // Check skill count limits (3-7 per task)
  if (skills.size === 0) {
    result.valid = false;
    result.warnings.push({
      criterion: 'Skill Count',
      message: 'No skills documented - must activate 3-7 skills per task',
      severity: SEVERITY.ERROR,
      hint: 'Add skills from categories: Stack, Architecture, Domain, Operational, Governance'
    });
  } else if (skills.size < 3) {
    result.warnings.push({
      criterion: 'Minimum Skills',
      message: `Only ${skills.size} skills activated - minimum is 3`,
      severity: SEVERITY.WARNING,
      hint: 'Add more skills from appropriate categories'
    });
  } else if (skills.size > 7) {
    result.warnings.push({
      criterion: 'Maximum Skills',
      message: `${skills.size} skills activated - maximum is 7 (EDGE-05)`,
      severity: SEVERITY.WARNING,
      hint: `Consider removing ${skills.size - 7} less relevant skills`
    });
  }

  // Check for skill categories
  const hasStackSkill = /stack/i.test(output) || skills.size > 0;
  const hasArchitectureSkill = /architecture/i.test(output);
  const hasDomainSkill = /domain/i.test(output);

  if (!hasArchitectureSkill && skills.size >= 3) {
    result.suggestions.push({
      message: 'Consider adding architecture skill for structural patterns',
      severity: SEVERITY.INFO
    });
  }

  return result;
}

/**
 * Verify verification status section is complete
 *
 * @param {string} output - Agent output text
 * @returns {Object} Validation result: { valid, warnings, suggestions, score }
 */
function checkVerificationStatus(output) {
  const result = {
    valid: true,
    warnings: [],
    suggestions: [],
    score: 0
  };

  let criteriaMet = 0;
  const totalCriteria = 5;

  // Check for checkboxes
  const checkboxes = output.match(/- \[([ x])\]/gi) || [];
  const checkedBoxes = checkboxes.filter(cb => cb.includes('x')).length;
  const totalBoxes = checkboxes.length;

  if (totalBoxes > 0) {
    criteriaMet++;
    const checkRate = checkedBoxes / totalBoxes;
    if (checkRate < 0.8) {
      result.warnings.push({
        criterion: 'Check Completion',
        message: `Only ${checkedBoxes}/${totalBoxes} verification checks passed`,
        severity: SEVERITY.WARNING,
        hint: 'Ensure all verification criteria are met before handoff'
      });
    }
  } else {
    result.warnings.push({
      criterion: 'Checkboxes',
      message: 'Verification status missing checkboxes',
      severity: SEVERITY.WARNING,
      hint: 'Add checkboxes for each verification criterion'
    });
  }

  // Check for quality gates table
  const hasQualityGates = /Quality Gates/i.test(output) || /\| Gate \|/.test(output);
  if (hasQualityGates) {
    criteriaMet++;
  } else {
    result.suggestions.push({
      message: 'Consider adding quality gates status table',
      severity: SEVERITY.INFO
    });
  }

  // Check for self-check
  const hasSelfCheck = /Self-Check/i.test(output) || /self-check/i.test(output);
  if (hasSelfCheck) {
    criteriaMet++;
  }

  // Check for skills alignment
  const hasSkillsAlignment = /Skills.*verified/i.test(output) || /skills alignment/i.test(output);
  if (hasSkillsAlignment) {
    criteriaMet++;
  }

  // Check for handoff readiness
  const hasHandoffReadyiness = /Ready for handoff/i.test(output) || /handoff to/i.test(output);
  if (hasHandoffReadyiness) {
    criteriaMet++;
  } else {
    result.suggestions.push({
      message: 'Add handoff readiness statement',
      severity: SEVERITY.INFO
    });
  }

  result.score = criteriaMet / totalCriteria;

  return result;
}

/**
 * Calculate overall validation score
 *
 * @param {Object} scores - Individual scores
 * @returns {number} Overall score (0-1)
 */
function calculateOverallScore(scores) {
  const weights = {
    sectionsComplete: 0.3,
    decisionFields: 0.2,
    tradeOffComplete: 0.15,
    artifactsComplete: 0.15,
    skillsValid: 0.1,
    verificationComplete: 0.1
  };

  let overall = 0;
  for (const [key, weight] of Object.entries(weights)) {
    const score = scores[key] || 0;
    overall += score * weight;
  }

  return Math.round(overall * 100) / 100;
}

/**
 * Generate validation report in markdown format
 *
 * @param {Object} report - Validation report object
 * @returns {string} Markdown formatted report
 */
function generateValidationReport(report) {
  const lines = [
    '## Validation Report',
    '',
    `**Overall Score:** ${(report.scores.overall * 100).toFixed(0)}%`,
    `**Status:** ${report.valid ? '✅ PASS' : '❌ FAIL'}`,
    '',
    '### Section Completeness',
    ''
  ];

  for (const [section, found] of Object.entries(report.sections)) {
    lines.push(`- [${found ? 'x' : ' '}] ${section}`);
  }

  if (report.errors.length > 0) {
    lines.push('', '### Errors', '');
    for (const error of report.errors) {
      lines.push(`- **${error.section}:** ${error.message}`);
    }
  }

  if (report.warnings.length > 0) {
    lines.push('', '### Warnings', '');
    for (const warning of report.warnings) {
      lines.push(`- **${warning.criterion || warning.field}:** ${warning.message}`);
    }
  }

  if (report.suggestions.length > 0) {
    lines.push('', '### Suggestions', '');
    for (const suggestion of report.suggestions) {
      lines.push(`- ${suggestion.message}`);
    }
  }

  lines.push('', '### Scores', '');
  for (const [key, score] of Object.entries(report.scores)) {
    if (key !== 'overall') {
      lines.push(`- ${key}: ${(score * 100).toFixed(0)}%`);
    }
  }

  return lines.join('\n');
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Main validation function
  validateOutput,

  // Section-specific validators
  checkDecisionLog,
  checkTradeOffs,
  checkArtifacts,
  checkSkillsApplied,
  checkVerificationStatus,

  // Report generation
  generateValidationReport,

  // Constants
  REQUIRED_SECTIONS,
  DECISION_FIELDS,
  SEVERITY
};
