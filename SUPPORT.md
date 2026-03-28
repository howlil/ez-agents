# Support

Welcome to EZ Agents support! This document provides information on how to get help with EZ Agents.

---

## 📚 Documentation

Before seeking support, please check our documentation:

- [Getting Started](README.md#quick-start) — Install and run your first phase
- [Commands Reference](docs/INDEX.md#commands-reference) — All available commands
- [Workflow Guide](WORKFLOW_LIFECYCLE.md) — Complete workflow documentation
- [Architecture](docs/ARCHITECTURE.md) — System architecture
- [FAQ](#faq) — Frequently asked questions

---

## 🆘 Getting Help

### Community Support (Free)

**GitHub Discussions:**
- [Ask a question](https://github.com/howlil/ez-agents/discussions/categories/q-a)
- [Share ideas](https://github.com/howlil/ez-agents/discussions/categories/ideas)
- [Show and tell](https://github.com/howlil/ez-agents/discussions/categories/show-and-tell)

**Response Time:** 1-3 business days

### Bug Reports

**GitHub Issues:**
- [Report a bug](https://github.com/howlil/ez-agents/issues/new?template=bug_report.md)
- [Feature request](https://github.com/howlil/ez-agents/issues/new?template=feature_request.md)

**Response Time:** 2-5 business days

### Security Issues

**Private Reporting:**
- Email: [security email]
- [Security advisory](https://github.com/howlil/ez-agents/security/advisories/new)

**Response Time:** Within 48 hours

---

## 📋 Before You Ask

### Check These First

1. **Search existing discussions** — Your question may already be answered
2. **Read the documentation** — Check [docs/INDEX.md](docs/INDEX.md)
3. **Check FAQ** — See [FAQ section](#faq) below
4. **Update EZ Agents** — Ensure you're on the latest version

### How to Ask Good Questions

**Provide Context:**
- What are you trying to achieve?
- What have you tried so far?
- What's your environment (Node version, AI runtime)?

**Include Details:**
- Error messages (full text)
- Steps to reproduce
- Expected vs actual behavior
- Code snippets (if relevant)

**Example:**
```markdown
**What I'm trying to do:**
Execute phase 1 with product discovery

**What I tried:**
1. /ez:new-project
2. /ez:product-discovery
3. /ez:run-phase 1

**Error:**
[Full error message here]

**Environment:**
- Node: v18.16.0
- Runtime: Claude Code
- EZ Agents: v5.0.0
```

---

## 🔧 Troubleshooting

### Common Issues

#### "Command not found: /ez:*"

**Cause:** EZ Agents not installed or configured

**Solution:**
```bash
# Install EZ Agents
npm install -g @howlil/ez-agents@latest

# Configure for your runtime
ez-agents --claude --global

# Verify installation
ez-agents --version
```

---

#### "No ROADMAP.md found"

**Cause:** Project not initialized

**Solution:**
```bash
# Initialize project
/ez:new-project

# Or if codebase exists
/ez:map-codebase
/ez:new-milestone
```

---

#### "Phase execution failed"

**Cause:** Missing dependencies or configuration

**Solution:**
```bash
# Check project setup
/ez:health

# Review error in SUMMARY.md
cat .planning/phases/XX-name/*-SUMMARY.md

# Retry with verbose output
/ez:execute-phase N --verbose
```

---

#### "Product discovery takes too long"

**Cause:** Large scope or complex domain

**Solution:**
```bash
# Skip research if you know the domain
/ez:product-discovery --skip-research

# Or use quick mode for small features
/ez:quick "Add login button"
```

---

#### "Metrics not showing"

**Cause:** Metrics tracking not enabled

**Solution:**
```bash
# Check config
cat .planning/config.json

# Enable metrics
node ez-tools.cjs config-set workflow.metrics true

# View metrics
/ez:stats
```

---

## 📖 FAQ

### General Questions

**Q: What AI runtimes are supported?**

A: EZ Agents supports:
- Claude Code (Anthropic)
- Qwen Code (Alibaba)
- OpenCode (OpenAI)
- Gemini CLI (Google)
- Codex (OpenAI)
- Copilot (GitHub)
- Kimi Code (Moonshot)

---

**Q: Do I need to pay for AI usage?**

A: Yes, AI runtimes have usage costs. EZ Agents tracks costs:
```bash
# View cost tracking
/ez:stats

# Set budget alerts
node ez-tools.cjs config-set budget.alerts true
```

---

**Q: Can I use EZ Agents with existing codebases?**

A: Yes! Use:
```bash
# Map existing codebase
/ez:map-codebase

# Then start milestone
/ez:new-milestone
```

---

**Q: How do I update EZ Agents?**

A:
```bash
# Update globally
npm install -g @howlil/ez-agents@latest

# Or use built-in command
/ez:update
```

---

### Product Discovery

**Q: When should I use product discovery?**

A: Use `/ez:product-discovery` when:
- Problem is unclear
- Team disagrees on priorities
- Before major investment
- Validating new feature ideas

---

**Q: What if I already know the problem?**

A: Skip product discovery:
```bash
/ez:new-milestone
/ez:plan-phase 1
```

---

**Q: How long does product discovery take?**

A: Typically 30-60 minutes depending on:
- Domain complexity
- Number of personas
- Feature count

---

### Metrics

**Q: What are 10x Engineer Metrics?**

A: Engineering excellence metrics:
- **Speed:** Lead Time, Cycle Time, Deployment Frequency
- **Quality:** Code Review Coverage, Defect Density
- **Maintainability:** Code Churn, Tech Debt Ratio

---

**Q: What are Product Metrics?**

A: Product success metrics:
- **North Star:** Single metric that matters
- **HEART:** Happiness, Engagement, Adoption, Retention, Task Success
- **OKRs:** Objectives & Key Results

---

**Q: How do I view metrics?**

A:
```bash
# View dashboard
/ez:stats

# Or check metrics file
cat .planning/metrics.json
```

---

### Contributing

**Q: How do I contribute?**

A: See [CONTRIBUTING.md](CONTRIBUTING.md):
1. Fork repository
2. Create branch
3. Make changes
4. Run tests
5. Submit PR

---

**Q: Can I add new agents?**

A: Yes! Guidelines:
- Must be actively used
- Clear single responsibility
- Documented in agents/ folder
- Tests included

---

## 🎓 Learning Resources

### Tutorials

- [Quick Start](README.md#quick-start) — 5-minute tutorial
- [First Project](README.md#3-initialize-a-project) — Step-by-step guide
- [Phase Execution](README.md#4-execute-phases) — Execute your first phase

### Guides

- [Workflow & Lifecycle](WORKFLOW_LIFECYCLE.md) — Complete workflow
- [Product Discovery](ez-agents/workflows/product-discovery.md) — Product thinking
- [Code Review](skills/operational/code-review-checklist/) — Code quality

### Examples

- [Example Projects](examples/) — Sample projects
- [Templates](ez-agents/templates/) — Output templates
- [Skills](skills/) — Domain skills examples

---

## 📞 Contact

### Support Channels

| Channel | Use For | Response Time |
|---------|---------|---------------|
| **GitHub Discussions** | Questions, ideas, discussions | 1-3 days |
| **GitHub Issues** | Bug reports, feature requests | 2-5 days |
| **Security Email** | Security vulnerabilities | 48 hours |

### What to Expect

**Community Support:**
- Best-effort response
- Community-driven answers
- Public discussions

**Bug Reports:**
- Triage within 2-5 days
- Assigned to milestone
- Fixed in future release

**Security Issues:**
- Private handling
- Coordinated disclosure
- Priority fixes

---

## 🙏 Acknowledgments

Thank you to all contributors who help make EZ Agents better!

[Contributors List](https://github.com/howlil/ez-agents/graphs/contributors)

---

**Last Updated:** March 28, 2026
**Support Version:** 1.0
