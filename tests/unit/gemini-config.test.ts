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

    expect(frontmatter.includes('name: ez-codebase-mapper')).toBeTruthy()
    expect(frontmatter.includes('description: Explores codebase and writes structured analysis documents.')).toBeTruthy()
    expect(frontmatter.includes('tools:')).toBeTruthy()
    expect(frontmatter.includes('  - read_file')).toBeTruthy()
    expect(frontmatter.includes('  - run_shell_command')).toBeTruthy()
    expect(frontmatter.includes('  - search_file_content')).toBeTruthy()
    expect(frontmatter.includes('  - glob')).toBeTruthy()
    expect(frontmatter.includes('  - write_file')).toBeTruthy()
    expect(!frontmatter.includes('color:')).toBeTruthy()
    expect(!frontmatter.includes('skills:')).toBeTruthy()
    expect(!frontmatter.includes('ez-mapper-workflow')).toBeTruthy()
    expect(result.includes('$PHASE')).toBeTruthy()
    expect(!result.includes('${PHASE}')).toBeTruthy()
  });
});
