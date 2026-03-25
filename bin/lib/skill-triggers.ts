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
 *   import { checkTriggers, activateSkillsByTriggers } from './skill-triggers.js';
 *   const shouldActivate = checkTriggers(skill, context);
 */

import { minimatch } from 'minimatch';
import type { Skill } from './skill-registry.js';

/**
 * Trigger context structure
 */
export interface TriggerContext {
  taskDescription?: string;
  codebaseFiles?: string[];
  executedCommands?: string[];
  stack?: string | { language: string; framework: string; version?: string };
  projectType?: string;
  mode?: string;
  [key: string]: unknown;
}

/**
 * Check if a skill's triggers match the context
 * @param skill - Skill object with triggers
 * @param context - Context object
 * @returns True if skill should activate
 */
export function checkTriggers(skill: Skill, context: TriggerContext): boolean {
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
      triggers.filePatterns!.some(pattern => minimatch(f, pattern))
    );
    if (matchingFiles.length > 0) return true;
  }

  // Command matching
  if (triggers.commands && context.executedCommands) {
    const commandMatch = triggers.commands.some(cmd =>
      context.executedCommands!.some(execCmd => execCmd.includes(cmd))
    );
    if (commandMatch) return true;
  }

  // Stack matching
  if (triggers.stack && context.stack) {
    const stackStr =
      typeof context.stack === 'string'
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
 * @param skills - Array of skill objects
 * @param context - Context object
 * @returns Array of skills whose triggers matched
 */
export function activateSkillsByTriggers(
  skills: Skill[],
  context: TriggerContext
): Skill[] {
  return skills.filter(skill => checkTriggers(skill, context));
}
