# Phase 14: Complexity Baseline Report

**Generated:** 2026-03-26
**Phase:** 14 - Code Quality Metrics & Validation
**Tool:** ESLint with complexity plugin

---

## Executive Summary

This report establishes the baseline cyclomatic complexity metrics for the ez-agents codebase.

### Threshold
- **Target:** Cyclomatic complexity < 10 per function
- **Measurement:** ESLint `complexity` rule

---

## Complexity Violations

### Functions with Complexity > 10

| File | Function | Complexity | Severity |
|------|----------|------------|----------|
| bin/guards/autonomy-guard.ts | categorizeOperation | 18 | ❌ Error |
| bin/guards/context-budget-guard.ts | checkContextBudget | 13 | ❌ Error |
| bin/guards/context-budget-guard.ts | main | 17 | ❌ Error |
| bin/guards/hallucination-guard.ts | searchCodebase | 12 | ❌ Error |
| bin/guards/tool-sprawl-guard.ts | recommendTools | 13 | ❌ Error |
| bin/install.ts | getGlobalDir | 20 | ❌ Error |
| bin/install.ts | getCommitAttribution | 12 | ❌ Error |
| bin/install.ts | convertClaudeToGeminiAgent | 22 | ❌ Error |
| bin/install.ts | convertClaudeToOpencodeFrontmatter | 19 | ❌ Error |
| bin/install.ts | copyWithPathReplacement | 14 | ❌ Error |

### Functions with Max Lines Warning (> 50 lines)

| File | Function | Lines | Severity |
|------|----------|-------|----------|
| bin/guards/autonomy-guard.ts | flagOperation | 56 | ⚠️ Warning |
| bin/guards/context-budget-guard.ts | checkContextBudget | 57 | ⚠️ Warning |
| bin/guards/context-budget-guard.ts | main | 77 | ⚠️ Warning |
| bin/install.ts | getGlobalDir | 73 | ⚠️ Warning |
| bin/install.ts | convertClaudeToGeminiAgent | 92 | ⚠️ Warning |
| bin/install.ts | convertClaudeToOpencodeFrontmatter | 106 | ⚠️ Warning |
| bin/install.ts | copyCommandsAsCodexSkills | 52 | ⚠️ Warning |
| bin/install.ts | copyCommandsAsKimiSkills | 51 | ⚠️ Warning |
| bin/install.ts | copyCommandsAsQwenCommands | 52 | ⚠️ Warning |
| bin/install.ts | copyCommandsAsQwenSkills | 52 | ⚠️ Warning |
| bin/install.ts | copyWithPathReplacement | 69 | ⚠️ Warning |
| bin/install.ts | cleanupOrphanedHooks | 53 | ⚠️ Warning |

---

## Complexity Distribution

| Complexity Range | Count | Percentage |
|------------------|-------|------------|
| 0-5 (Low) | TBD | TBD |
| 6-10 (Acceptable) | TBD | TBD |
| 11-20 (High) | 10+ | Violations |
| 21+ (Very High) | 1 | Critical |

---

## Findings

### High-Complexity Hotspots

1. **bin/install.ts** - Migration/conversion functions have highest complexity
   - `convertClaudeToGeminiAgent`: 22 (highest)
   - `getGlobalDir`: 20
   - `convertClaudeToOpencodeFrontmatter`: 19

2. **bin/guards/** - Guard logic with multiple conditions
   - `categorizeOperation`: 18
   - `main` (context-budget-guard): 17

### TSDoc Syntax Issues

Multiple files have TSDoc syntax errors that should be fixed:
- Invalid `@param` tags with type annotations
- Unescaped `>` characters in comments
- Malformed inline tags

---

## Recommendations

### Immediate Actions
1. Fix TSDoc syntax errors (blocking METRIC-06)
2. Document high-complexity functions with `@remarks` explaining complexity rationale
3. Consider refactoring `convertClaudeToGeminiAgent` (complexity 22)

### Legacy Violations
Per CONTEXT.md decision: "Warn but allow merge — gradual improvement approach"
- High-complexity functions in `bin/install.ts` are migration utilities
- Consider refactoring in future phase focused on entry points

---

## Measurement Method

```bash
npm run lint
# ESLint with complexity rule: ["error", { "max": 10 }]
```

---

*Report generated: 2026-03-26*
*Phase 14: Code Quality Metrics & Validation*
