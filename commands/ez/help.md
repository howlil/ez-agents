---
name: ez:help
description: Show available EZ Agents commands and usage guide
---
<objective>
Display the complete EZ Agents command reference.

Output ONLY the reference content below. Do NOT add:
- Project-specific analysis
- Git status or file context
- Next-step suggestions
- Any commentary beyond the reference
</objective>

<execution_context>
@~/.claude/ez-agents/workflows/help.md
</execution_context>

<process>
Output the complete EZ Agents command reference from @~/.claude/ez-agents/workflows/help.md.
Display the reference content directly — no additions or modifications.
</process>
