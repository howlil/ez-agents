# EZ Agents v3.4.0 - Qwen Provider Documentation

🎉 **Release Date:** March 18, 2026

## ✨ What's New

Complete **Qwen Provider** documentation with manual planning, execution, and verification workflows for Alibaba Qwen (DashScope) integration.

---

## 📚 New Documentation

### Core Guides (6 New Files)

1. **[QWEN-PROVIDER.md](docs/QWEN-PROVIDER.md)** - Complete provider setup
   - Authentication methods (3 options)
   - Model selection guide
   - Configuration reference
   - Troubleshooting

2. **[QWEN-PLANNING.md](docs/QWEN-PLANNING.md)** - Planning workflow
   - Manual planning steps
   - Task breakdown templates
   - Model configuration for planning
   - Prompt templates

3. **[QWEN-EXECUTION.md](docs/QWEN-EXECUTION.md)** - Execution workflow
   - Task implementation patterns
   - Parallel execution (waves)
   - Checkpoint tasks
   - Summary templates

4. **[QWEN-VERIFICATION.md](docs/QWEN-VERIFICATION.md)** - Verification workflow
   - Requirements traceability
   - Code quality review
   - Test coverage analysis
   - Security audit guide

5. **[QWEN-CONFIG-EXAMPLES.md](docs/QWEN-CONFIG-EXAMPLES.md)** - Configuration templates
   - 10+ configuration examples
   - Basic to enterprise setups
   - Environment-specific configs
   - Cost control examples

6. **[QWEN-README.md](docs/QWEN-README.md)** - Quick start guide
   - 5-minute setup
   - Model comparison table
   - Best practices
   - Common issues

---

## 🔧 Technical Changes

### Code Updates

- **auth.cjs**: Added `QWEN` provider constant to `PROVIDERS` object
- Supports same authentication as Qwen Code CLI
- System keychain integration for secure storage

### Models Supported

| Model | Use Case | Temperature | Cost |
|-------|----------|-------------|------|
| `qwen-max` | Complex planning, architecture | 0.6-0.8 | $$$$ |
| `qwen-plus` | Code execution, implementation | 0.2-0.4 | $$ |
| `qwen-turbo` | Quick tasks, verification | 0.1-0.3 | $ |

---

## 🚀 Quick Start

### 1. Get API Key

```bash
# Visit DashScope Console
https://dashscope.console.aliyun.com/apiKey
```

### 2. Set Environment Variable

```bash
export DASHSCOPE_API_KEY="sk-your-api-key"
```

### 3. Configure EZ Agents

```json
{
  "provider": {
    "default": "qwen",
    "qwen": {
      "api_key": "env:DASHSCOPE_API_KEY"
    }
  }
}
```

### 4. Start Using

```bash
# Initialize
ez-agents new-project

# Plan
ez-agents plan-phase "Build e-commerce platform"

# Execute
ez-agents execute-phase "1"

# Verify
ez-agents verify-work "1"
```

---

## 📖 Documentation Links

- **Quick Start:** [docs/QWEN-README.md](docs/QWEN-README.md)
- **Provider Guide:** [docs/QWEN-PROVIDER.md](docs/QWEN-PROVIDER.md)
- **Planning:** [docs/QWEN-PLANNING.md](docs/QWEN-PLANNING.md)
- **Execution:** [docs/QWEN-EXECUTION.md](docs/QWEN-EXECUTION.md)
- **Verification:** [docs/QWEN-VERIFICATION.md](docs/QWEN-VERIFICATION.md)
- **Config Examples:** [docs/QWEN-CONFIG-EXAMPLES.md](docs/QWEN-CONFIG-EXAMPLES.md)

---

## ✅ Testing

- All **697 tests** passing
- Pre-commit checks passed
- No breaking changes

---

## 📝 Migration Notes

### From Previous Versions

No migration required. This is a documentation-only release.

### Compatibility

- ✅ Backward compatible with v3.3.0
- ✅ Works with existing configurations
- ✅ No database changes

---

## 🐛 Bug Fixes

- Fixed missing QWEN provider constant in auth.cjs

---

## 📊 Statistics

- **6 new documentation files**
- **3,425+ lines of documentation**
- **10+ configuration examples**
- **3 workflow guides** (planning, execution, verification)

---

## 🔗 Links

- **Full Changelog:** [CHANGELOG.md](CHANGELOG.md)
- **Installation Guide:** [README.md](README.md)
- **User Documentation:** [docs/USER-GUIDE.md](docs/USER-GUIDE.md)
- **GitHub Issue:** [View on GitHub](https://github.com/howlil/ez-agents/releases/tag/v3.4.0)

---

## 🙏 Acknowledgments

Thanks to the community for requesting and supporting Qwen provider integration!

---

## 📞 Support

- **GitHub Issues:** https://github.com/howlil/ez-agents/issues
- **Discussions:** https://github.com/howlil/ez-agents/discussions
- **DashScope Docs:** https://help.aliyun.com/zh/dashscope/

---

**Full release notes:** https://github.com/howlil/ez-agents/releases/tag/v3.4.0
