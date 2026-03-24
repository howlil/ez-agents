---
name: ez:doctor
description: System health check and diagnostics for EZ Agents
argument-hint: "[--fix] [--json]"
---

# EZ ► Doctor

System health check and diagnostics for EZ Agents. Verifies Node.js version, AI tool availability, configuration validity, git status, and API keys.

## Usage

```bash
# Run health check
node ez-agents/bin/ez-tools.cjs doctor

# Auto-fix simple issues
node ez-agents/bin/ez-tools.cjs doctor --fix

# JSON output for CI/CD
node ez-agents/bin/ez-tools.cjs doctor --json
```

## Checks Performed

| Check | Description | Auto-Fix |
|-------|-------------|----------|
| **Node.js Version** | Verifies Node.js >= 16.7.0 | ❌ Manual upgrade required |
| **AI Tool Availability** | Checks for Claude, OpenCode, Gemini CLI | ⚠️ Installation guidance |
| **Config Validity** | Validates `.planning/config.json` structure | ✅ Can regenerate defaults |
| **Git Repository** | Verifies git repo status, uncommitted changes | ⚠️ Guidance only |
| **API Keys** | Checks configured API keys for providers | ⚠️ Setup guidance |
| **Dependencies** | Verifies required npm packages installed | ✅ Can run npm install |
| **Planning Directory** | Checks `.planning/` structure exists | ✅ Can initialize |

## Output

### Normal Mode

```
EZ Agents Health Check
══════════════════════

Node.js Version      ✅ 20.10.0 (>= 16.7.0)
AI Tools             ✅ Claude Code available
Config Validity      ✅ .planning/config.json valid
Git Repository       ✅ Clean working tree
API Keys             ⚠️  Missing: ANTHROPIC_API_KEY
Dependencies         ✅ All packages installed
Planning Directory   ✅ Structure complete

Status: WARNING - 1 issue found

Suggestions:
  - Set ANTHROPIC_API_KEY environment variable or create ~/.ez/anthropic_api_key
```

### JSON Mode

```json
{
  "status": "warning",
  "exit_code": 2,
  "checks": {
    "node_version": { "ok": true, "value": "20.10.0" },
    "ai_tools": { "ok": true, "available": ["claude"] },
    "config": { "ok": true },
    "git": { "ok": true, "clean": true },
    "api_keys": { "ok": false, "missing": ["ANTHROPIC_API_KEY"] },
    "dependencies": { "ok": true },
    "planning_dir": { "ok": true }
  },
  "issues": 1,
  "suggestions": [...]
}
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | ✅ Healthy — all checks passed |
| 1 | ❌ Unhealthy — critical issues found |
| 2 | ⚠️ Warning — non-critical issues found |

## Auto-Fix Capabilities

The `--fix` flag can automatically resolve:

- **Config regeneration** — Recreates `.planning/config.json` with defaults
- **Dependency installation** — Runs `npm install` if packages missing
- **Planning directory** — Creates `.planning/` structure if missing
- **Log directory** — Creates `.planning/logs/` if missing

Cannot auto-fix:
- Node.js version (manual upgrade required)
- AI tool installation (manual setup required)
- API keys (security — must be set by user)

## Configuration

Health check thresholds configured in `.planning/config.json`:

```json
{
  "health_check": {
    "min_node_version": "16.7.0",
    "required_tools": ["claude"],
    "required_api_keys": ["ANTHROPIC_API_KEY"]
  }
}
```

## CI/CD Integration

Use `--json` flag for CI/CD pipeline integration:

```yaml
# GitHub Actions example
- name: Health Check
  run: node ez-agents/bin/ez-tools.cjs doctor --json
```

Exit codes work with standard CI/CD:
- Exit 0: Continue pipeline
- Exit 1: Fail pipeline
- Exit 2: Warning (can be configured to pass or fail)

## Related Commands

- `/ez:health` — Quick health endpoint (legacy)
- `/ez:cost` — Cost tracking dashboard
- `/ez:recover` — Crash recovery operations
