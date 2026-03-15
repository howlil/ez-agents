# Instructions for EZ Agents

- Use the ez-agents skill when the user asks for EZ Agents or uses a `ez-*` command.
- Treat `/ez-...` or `ez-...` as command invocations and load the matching file from `.github/skills/ez-*`.
- When a command says to spawn a subagent, prefer a matching custom agent from `.github/agents`.
- Do not apply EZ Agents workflows unless the user explicitly asks for them.
- After completing any `ez-*` command (or any deliverable it triggers: feature, bug fix, tests, docs, etc.), ALWAYS: (1) offer the user the next step by prompting via `ask_user`; repeat this feedback loop until the user explicitly indicates they are done.
