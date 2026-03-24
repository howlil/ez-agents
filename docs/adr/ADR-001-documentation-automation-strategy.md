# ADR-001: Documentation Automation Strategy

## Status

Accepted

## Context

EZ Agents projects require comprehensive documentation to be maintainable and usable. Manual documentation updates are error-prone and often neglected. We need an automated approach to keep documentation current with minimal manual effort.

## Decision

We will implement documentation automation with the following principles:

1. **Single Source of Truth** - Documentation is generated from code, commits, and configuration where possible
2. **Convention over Configuration** - Use conventional commits, JSDoc standards, and established patterns
3. **Automated Generation** - Changelog, API docs, and runbooks are auto-generated
4. **Human Review** - Auto-generated docs are reviewed before release
5. **Living Documents** - ADRs and runbooks evolve with the project

### Implementation

- **Changelog**: Generated from git conventional commits using `changelog-generator.cjs`
- **ADRs**: Managed with `adr-manager.cjs`, auto-indexed in `docs/adr/README.md`
- **Runbooks**: Generated from templates using `runbook-generator.cjs`
- **API Docs**: OpenAPI spec generated from code using `doc-generator.cjs`
- **Troubleshooting**: Auto-generated from log analysis using `troubleshooting-generator.cjs`

## Consequences

### Positive

- Documentation stays current with code changes
- Reduced manual effort for routine documentation
- Consistent format across all documentation types
- Easier onboarding for new contributors
- Better incident response with pre-generated runbooks

### Negative

- Initial setup complexity
- Learning curve for conventional commits
- Some documentation still requires manual updates
- Additional dependencies for documentation generation

### Neutral

- Documentation generation adds ~30 seconds to CI/CD pipeline
- Requires discipline in writing meaningful commit messages

## Related Records

- DOC-01 to DOC-08 requirements in `.planning/REQUIREMENTS.md`
- Phase 26 implementation plan in `.planning/phases/26-documentation-automation/26-PLAN.md`
- Changelog configuration in `cliff.toml`

## Implementation Notes

1. All documentation generators are available via `ez-tools.cjs docs` commands
2. Health checks validate documentation completeness
3. CI/CD integration ensures documentation is generated on each release
4. Templates provide consistent structure for manual documentation

---

*ADR-001 created 2026-03-20 as part of Phase 26 Documentation Automation*
