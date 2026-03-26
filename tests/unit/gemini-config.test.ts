/**
 * EZ Tools Tests - Gemini agent conversion
 *
 * Verifies Gemini-specific agent frontmatter conversion removes
 * unsupported fields while preserving converted tools and body text.
 */

process.env.EZ_AGENTS_TEST_MODE = '1';

import { testExports } from '../../bin/install.js';
const { convertClaudeToGeminiAgent } = testExports;

describe('convertClaudeToGeminiAgent', () => {
  test('drops unsupported skills frontmatter while keeping converted tools', () => {
    const input = `---
name: ez-codebase-mapper
description: Explores codebase and writes structured analysis documents.
tools: Read, Bash, Grep, Glob, Write
color: cyan
skills:
  - ez-mapper-workflow
---

<role>
Use \${PHASE} in shell examples.
</role>`;

    const result = convertClaudeToGeminiAgent(input);
    const frontmatter = result.split('---')[1] || '';

    expect(frontmatter.includes('name: ez-codebase-mapper')).toBeTruthy() // 'keeps name';
    expect(frontmatter.includes('description: Explores codebase and writes structured analysis documents.')).toBeTruthy() // 'keeps description';
    expect(frontmatter.includes('tools:')).toBeTruthy() // 'adds Gemini tools array';
    expect(frontmatter.includes('  - read_file')).toBeTruthy() // 'maps Read -> read_file';
    expect(frontmatter.includes('  - run_shell_command')).toBeTruthy() // 'maps Bash -> run_shell_command';
    expect(frontmatter.includes('  - search_file_content')).toBeTruthy() // 'maps Grep -> search_file_content';
    expect(frontmatter.includes('  - glob')).toBeTruthy() // 'maps Glob -> glob';
    expect(frontmatter.includes('  - write_file')).toBeTruthy() // 'maps Write -> write_file';
    expect(!frontmatter.includes('color:')).toBeTruthy() // 'drops unsupported color field';
    expect(!frontmatter.includes('skills:')).toBeTruthy() // 'drops unsupported skills field';
    expect(!frontmatter.includes('ez-mapper-workflow')).toBeTruthy() // 'drops skills list items';
    expect(result.includes('$PHASE')).toBeTruthy() // 'escapes ${PHASE} shell variable for Gemini';
    expect(!result.includes('${PHASE}')).toBeTruthy() // 'removes Gemini template-string pattern';
  });
});
