#!/usr/bin/env node

/**
 * Skill Triggers — Trigger-based skill auto-activation
 *
 * Checks skill triggers against context:
 * - Keywords in task description
 * - File patterns in codebase
 * - Commands executed
 * - Stack detection
 * - Project archetypes
 * - Mode matching
 *
 * Usage:
 *   const { checkTriggers, activateSkillsByTriggers } = require('./skill-triggers.cjs');
 *   const shouldActivate = checkTriggers(skill, context);
 */

const minimatch = require('minimatch');

/**
 * Check if a skill's triggers match the context
 * @param {Object} skill - Skill object with triggers
 * @param {Object} context - Context object
 * @returns {boolean} True if skill should activate
 */
function checkTriggers(skill, context) {
  const { triggers } = skill;
  if (!triggers) return false;

  // Keyword matching in task description
  if (triggers.keywords) {
    const taskText = (context.taskDescription || '').toLowerCase();
    const keywordMatch = triggers.keywords.some(k =>
      taskText.includes(k.toLowerCase())
    );
    if (keywordMatch) return true;
  }

  // File pattern matching (requires codebase scan)
  if (triggers.filePatterns && context.codebaseFiles) {
    const matchingFiles = context.codebaseFiles.filter(f =>
      triggers.filePatterns.some(pattern => minimatch(f, pattern))
    );
    if (matchingFiles.length > 0) return true;
  }

  // Command matching
  if (triggers.commands && context.executedCommands) {
    const commandMatch = triggers.commands.some(cmd =>
      context.executedCommands.some(execCmd => execCmd.includes(cmd))
    );
    if (commandMatch) return true;
  }

  // Stack matching
  if (triggers.stack && context.stack) {
    const stackStr = typeof context.stack === 'string'
      ? context.stack
      : `${context.stack.language}/${context.stack.framework}`;
    if (triggers.stack === stackStr) return true;
  }

  // Project archetype matching
  if (triggers.projectArchetypes && context.projectType) {
    if (triggers.projectArchetypes.includes(context.projectType)) return true;
  }

  // Mode matching
  if (triggers.modes && context.mode) {
    if (triggers.modes.includes(context.mode)) return true;
  }

  return false;
}

/**
 * Activate skills whose triggers match the context
 * @param {Object[]} skills - Array of skill objects
 * @param {Object} context - Context object
 * @returns {Object[]} Array of skills whose triggers matched
 */
function activateSkillsByTriggers(skills, context) {
  return skills.filter(skill => checkTriggers(skill, context));
}

module.exports = {
  checkTriggers,
  activateSkillsByTriggers
};
