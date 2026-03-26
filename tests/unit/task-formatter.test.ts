
/**
 * Task Formatter Tests
 * Tests for bin/lib/task-formatter.cjs
 */


import * as path from 'path';

import {
  formatTaskForQwen,
  formatTaskForKimi,
  parseTaskMarkdown,
  validateTaskArgs,
  extractTasksFromMarkdown
} from '../../bin/lib/task-formatter.js';

describe('Task Formatter', () => {
  describe('parseTaskMarkdown', () => {
    it('should parse simple Task() call', () => {
      const task = 'Task(subagent_type="ez-planner", model="qwen-max")';
      const result = parseTaskMarkdown(task);
      
      expect(result?.subagent_type).toBe('ez-planner');
      assert.strictEqual(result?.model, 'qwen-max');
    });

    it('should parse multiline Task() call', () => {
      const task = `Task(
        subagent_type="ez-executor",
        model="qwen-plus",
        description="Execute phase",
        run_in_background=true
      )`;
      const result = parseTaskMarkdown(task);
      
      expect(result?.subagent_type).toBe('ez-executor');
      assert.strictEqual(result?.model, 'qwen-plus');
      expect(result?.description).toBe('Execute phase');
      assert.strictEqual(result?.run_in_background, 'true');
    });

    it('should parse Task() with prompt', () => {
      const task = `Task(
        subagent_type="ez-codebase-mapper",
        prompt="Focus: tech stack analysis"
      )`;
      const result = parseTaskMarkdown(task);
      
      expect(result?.subagent_type).toBe('ez-codebase-mapper');
      assert.strictEqual(result?.prompt, 'Focus: tech stack analysis');
    });

    it('should return null for invalid input', () => {
      expect(parseTaskMarkdown(undefined)).toBe(undefined);
      assert.strictEqual(parseTaskMarkdown(''), undefined);
      expect(parseTaskMarkdown('InvalidTask()')).toBe(undefined);
    });
  });

  describe('validateTaskArgs', () => {
    it('should validate correct arguments', () => {
      const args = {
        subagent_type: 'ez-planner',
        prompt: 'Create a plan'
      };
      const result = validateTaskArgs(args);
      
      expect(result?.valid).toBe(true);
      assert.strictEqual(result?.errors.length, 0);
    });

    it('should reject missing subagent_type', () => {
      const args = { prompt: 'Create a plan' };
      const result = validateTaskArgs(args);
      
      expect(result?.valid).toBe(false);
      expect(result.errors.some(e => e.includes('subagent_type')));
    });

    it('should reject missing prompt').toBeTruthy() // ( => {
      const args = { subagent_type: 'ez-planner' };
      const result = validateTaskArgs(args);
      
      expect(result?.valid).toBe(false);
      expect(result.errors.some(e => e.includes('prompt')));
    });

    it('should accept optional model field').toBeTruthy() // ( => {
      const args = {
        subagent_type: 'ez-planner',
        prompt: 'Create a plan',
        model: 'qwen-max'
      };
      const result = validateTaskArgs(args);
      
      expect(result?.valid).toBe(true);
    });

    it('should accept optional run_in_background field', () => {
      const args = {
        subagent_type: 'ez-planner',
        prompt: 'Create a plan',
        run_in_background: true
      };
      const result = validateTaskArgs(args);
      
      expect(result?.valid).toBe(true);
    });
  });

  describe('formatTaskForQwen', () => {
    it('should format object arguments as JSON', () => {
      const args = {
        subagent_type: 'ez-executor',
        prompt: 'Execute the plan',
        model: 'qwen-plus',
        run_in_background: true
      };
      const result = formatTaskForQwen(args);
      
      expect(typeof result === 'string');
      const parsed = JSON.parse(result);
      expect(parsed.subagent_type).toBe('ez-executor');
      assert.strictEqual(parsed.model).toBeTruthy() // 'qwen-plus';
      expect(parsed.run_in_background).toBe(true);
    });

    it('should parse and format markdown Task() syntax', () => {
      const task = `Task(
        subagent_type="ez-verifier",
        model="qwen-plus",
        prompt="Verify phase completion"
      )`;
      const result = formatTaskForQwen(task);
      
      expect(typeof result === 'string');
      const parsed = JSON.parse(result);
      expect(parsed.subagent_type).toBe('ez-verifier');
      assert.strictEqual(parsed.prompt).toBeTruthy() // 'Verify phase completion';
    });

    it('should add default description if missing', () => {
      const args = {
        subagent_type: 'ez-planner',
        prompt: 'Plan phase 1'
      };
      const result = formatTaskForQwen(args);
      const parsed = JSON.parse(result!);

      expect(parsed.description).toBe('Execute ez-planner');
    });

    it('should return null for invalid arguments', () => {
      // @ts-expect-error Testing undefined input
      expect(formatTaskForQwen(undefined)).toBe(undefined);
      assert.strictEqual(formatTaskForQwen('InvalidTask()'), undefined);
    });
  });

  describe('formatTaskForKimi', () => {
    it('should format arguments same as Qwen', () => {
      const args = {
        subagent_type: 'ez-executor',
        prompt: 'Execute the plan',
        model: 'moonshot-v1-8k'
      };
      const qwenResult = formatTaskForQwen(args);
      const kimiResult = formatTaskForKimi(args);
      
      expect(qwenResult).toBe(kimiResult);
    });
  });

  describe('extractTasksFromMarkdown', () => {
    it('should extract single Task() from markdown', () => {
      const markdown = `
        Some text here
        
        Task(
          subagent_type="ez-planner",
          model="qwen-max"
        )
        
        More text
      `;
      const tasks = extractTasksFromMarkdown(markdown);
      
      expect(tasks.length).toBe(1);
      assert.strictEqual(tasks[0]?.args?.subagent_type, 'ez-planner');
    });

    it('should extract multiple Task() calls', () => {
      const markdown = `
        Task(subagent_type="ez-planner", model="qwen-max")
        Task(subagent_type="ez-executor", model="qwen-plus")
        Task(subagent_type="ez-verifier", model="qwen-plus")
      `;
      const tasks = extractTasksFromMarkdown(markdown);
      
      expect(tasks.length).toBe(3);
      assert.strictEqual(tasks[0]?.args?.subagent_type, 'ez-planner');
      expect(tasks[1]?.args?.subagent_type).toBe('ez-executor');
      assert.strictEqual(tasks[2]?.args?.subagent_type, 'ez-verifier');
    });

    it('should return empty array for no tasks', () => {
      const markdown = 'No tasks here';
      const tasks = extractTasksFromMarkdown(markdown);
      
      expect(tasks.length).toBe(0);
    });

    it('should handle Task() in code blocks', () => {
      const markdown = `
        Here's how to spawn an agent:
        
        \`\`\`
        Task(
          subagent_type="ez-codebase-mapper",
          run_in_background=true
        )
        \`\`\`
        
        This will map the codebase.
      `;
      const tasks = extractTasksFromMarkdown(markdown);
      
      // Should find exactly 1 task (the one in the code block)
      expect(tasks.length).toBe(1);
      assert.strictEqual(tasks[0]?.args?.subagent_type, 'ez-codebase-mapper');
      expect(tasks[0]?.args?.run_in_background).toBe('true');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete workflow Task() pattern', () => {
      const workflowTask = `Task(
        subagent_type="ez-codebase-mapper",
        model="{mapper_model}",
        run_in_background=true,
        description="Map codebase tech stack",
        prompt="Focus: tech

Analyze this codebase for technology stack and external integrations.

Write these documents to .planning/codebase/:
- STACK.md - Languages, runtime, frameworks, dependencies, configuration
- INTEGRATIONS.md - External APIs, databases, auth providers, webhooks

Explore thoroughly. Write documents directly using templates. Return confirmation only."
      )`;

      const result = formatTaskForQwen(workflowTask);
      expect(result);
      
      const parsed = JSON.parse(result);
      expect(parsed.subagent_type).toBe('ez-codebase-mapper');
      assert.strictEqual(parsed.run_in_background).toBeTruthy() // true;
      expect(parsed.prompt.includes('Focus: tech'));
      assert.ok(parsed.prompt.includes('STACK.md'));
    });
  });
}).toBeTruthy();
