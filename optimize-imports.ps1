# Optimize imports to reduce circular dependencies
$root = 'C:\Users\howlil\project\code\side\vibe-code\agent-orchestration\ez-agents\bin\lib'

# Files that should import directly from same folder, not via index
$directImports = @{
    'bin/lib/logger/logger.ts' = @{"from '../logger/index.js'" = "from './logger.js'"}
    'bin/lib/logger/lock-logger.ts' = @{"from '../logger/index.js'" = "from './logger.js'"}
    'bin/lib/logger/log-rotation.ts' = @{"from '../logger/index.js'" = "from './logger.js'"}
    'bin/lib/executor/process-executor.ts' = @{"from '../executor/index.js'" = "from './process-executor.js'"}
    'bin/lib/executor/safe-exec.ts' = @{"from '../executor/index.js'" = "from './safe-exec.js'"}
    'bin/lib/executor/timeout-exec.ts' = @{"from '../executor/index.js'" = "from './timeout-exec.js'"}
    'bin/lib/executor/audit-exec.ts' = @{"from '../executor/index.js'" = "from './audit-exec.js'"}
    'bin/lib/executor/retry.ts' = @{"from '../executor/index.js'" = "from './retry.js'"}
    'bin/lib/file/file-access.ts' = @{"from '../file/index.js'" = "from './file-access.js'"}
    'bin/lib/file/file-lock.ts' = @{"from '../file/index.js'" = "from './file-lock.js'"}
    'bin/lib/file/temp-file.ts' = @{"from '../file/index.js'" = "from './temp-file.js'"}
    'bin/lib/file/safe-path.ts' = @{"from '../file/index.js'" = "from './safe-path.js'"}
    'bin/lib/file/fs-utils.ts' = @{"from '../file/index.js'" = "from './fs-utils.js'"}
    'bin/lib/skill/skill-registry.ts' = @{"from '../skill/index.js'" = "from './skill-registry.js'"}
    'bin/lib/skill/skill-matcher.ts' = @{"from '../skill/index.js'" = "from './skill-matcher.js'"}
    'bin/lib/skill/skill-resolver.ts' = @{"from '../skill/index.js'" = "from './skill-resolver.js'"}
    'bin/lib/skill/skill-triggers.ts' = @{"from '../skill/index.js'" = "from './skill-triggers.js'"}
    'bin/lib/skill/skill-validator.ts' = @{"from '../skill/index.js'" = "from './skill-validator.js'"}
    'bin/lib/skill/skill-versioning.ts' = @{"from '../skill/index.js'" = "from './skill-versioning.js'"}
    'bin/lib/skill/skill-context.ts' = @{"from '../skill/index.js'" = "from './skill-context.js'"}
    'bin/lib/session/session-manager.ts' = @{"from '../session/index.js'" = "from './session-manager.js'"}
    'bin/lib/session/session-chain.ts' = @{"from '../session/index.js'" = "from './session-chain.js'"}
    'bin/lib/session/session-errors.ts' = @{"from '../session/index.js'" = "from './session-errors.js'"}
    'bin/lib/context/context-manager.ts' = @{"from '../context/index.js'" = "from './context-manager.js'"}
    'bin/lib/context/context-cache.ts' = @{"from '../context/index.js'" = "from './context-cache.js'"}
    'bin/lib/context/context-compressor.ts' = @{"from '../context/index.js'" = "from './context-compressor.js'"}
    'bin/lib/phase/phase.ts' = @{"from '../phase/index.js'" = "from './phase.js'"}
    'bin/lib/phase/roadmap.ts' = @{"from '../phase/index.js'" = "from './roadmap.js'"}
    'bin/lib/phase/milestone.ts' = @{"from '../phase/index.js'" = "from './milestone.js'"}
    'bin/lib/quality/quality-gate.ts' = @{"from '../quality/index.js'" = "from './quality-gate.js'"}
    'bin/lib/quality/gate-executor.ts' = @{"from '../quality/index.js'" = "from './quality-gate.js'"; "from './quality/index.js'" = "from './quality-gate.js'"}
    'bin/lib/quality/quality-metrics.ts' = @{"from '../quality/index.js'" = "from './quality-metrics.js'"}
    'bin/lib/quality/quality-detector.ts' = @{"from '../quality/index.js'" = "from './quality-detector.js'"}
    'bin/lib/analyzer/codebase-analyzer.ts' = @{"from '../analyzer/index.js'" = "from './codebase-analyzer.js'"}
    'bin/lib/analyzer/code-complexity-analyzer.ts' = @{"from '../analyzer/index.js'" = "from './code-complexity-analyzer.js'"}
    'bin/lib/analyzer/dependency-graph.ts' = @{"from '../analyzer/index.js'" = "from './dependency-graph.js'"}
    'bin/lib/analyzer/tech-debt-analyzer.ts' = @{"from '../analyzer/index.js'" = "from './tech-debt-analyzer.js'"}
    'bin/lib/analyzer/tradeoff-analyzer.ts' = @{"from '../analyzer/index.js'" = "from './tradeoff-analyzer.js'"}
    'bin/lib/detector/archetype-detector.ts' = @{"from '../detector/index.js'" = "from './archetype-detector.js'"}
    'bin/lib/detector/framework-detector.ts' = @{"from '../detector/index.js'" = "from './framework-detector.js'"}
    'bin/lib/detector/stack-detector.ts' = @{"from '../detector/index.js'" = "from './stack-detector.js'"}
    'bin/lib/detector/constraint-extractor.ts' = @{"from '../detector/index.js'" = "from './constraint-extractor.js'"}
    'bin/lib/cost/cost-tracker.ts' = @{"from '../cost/index.js'" = "from './cost-tracker.js'"; "from './cost/index.js'" = "from './cost-tracker.js'"}
    'bin/lib/cost/cost-alerts.ts' = @{"from '../cost/index.js'" = "from './cost-alerts.js'"}
    'bin/lib/reporter/project-reporter.ts' = @{"from '../reporter/index.js'" = "from './project-reporter.js'"}
    'bin/lib/reporter/health-check.ts' = @{"from '../reporter/index.js'" = "from './health-check.js'"}
    'bin/lib/recovery/recovery-manager.ts' = @{"from '../recovery/index.js'" = "from './recovery-manager.js'"}
    'bin/lib/recovery/backup-service.ts' = @{"from '../recovery/index.js'" = "from './backup-service.js'"}
    'bin/lib/recovery/crash-recovery.ts' = @{"from '../recovery/index.js'" = "from './crash-recovery.js'"}
    'bin/lib/model/model-provider.ts' = @{"from '../model/index.js'" = "from './model-provider.js'"}
    'bin/lib/model/assistant-adapter.ts' = @{"from '../model/index.js'" = "from './assistant-adapter.js'"}
    'bin/lib/git/git-utils.ts' = @{"from '../git/index.js'" = "from './git-utils.js'"}
    'bin/lib/git/git-workflow-engine.ts' = @{"from '../git/index.js'" = "from './git-workflow-engine.js'"}
    'bin/lib/error/error-cache.ts' = @{"from '../error/index.js'" = "from './error-cache.js'"}
    'bin/lib/error/error-registry.ts' = @{"from '../error/index.js'" = "from './error-registry.js'"}
    'bin/lib/error/error-utils.ts' = @{"from '../error/index.js'" = "from './error-utils.js'"}
    'bin/lib/planning/planning-write.ts' = @{"from '../planning/index.js'" = "from './planning-write.js'"}
    'bin/lib/planning/frontmatter.ts' = @{"from '../planning/index.js'" = "from './frontmatter.js'"}
    'bin/lib/planning/task-formatter.ts' = @{"from '../planning/index.js'" = "from './task-formatter.js'"}
    'bin/lib/state/state.ts' = @{"from '../state/index.js'" = "from './state.js'"}
    'bin/lib/state/lock-state.ts' = @{"from '../state/index.js'" = "from './lock-state.js'"}
    'bin/lib/init/init.ts' = @{"from '../init/index.js'" = "from './init.js'"}
    'bin/lib/init/commands.ts' = @{"from '../init/index.js'" = "from './commands.js'"}
    'bin/lib/workflow/revision-loop.ts' = @{"from '../workflow/index.js'" = "from './revision-loop.js'"}
    'bin/lib/workflow/rca-engine.ts' = @{"from '../workflow/index.js'" = "from './rca-engine.js'"}
    'bin/lib/workflow/release-validator.ts' = @{"from '../workflow/index.js'" = "from './release-validator.js'"}
    'bin/lib/workflow/verify.ts' = @{"from '../workflow/index.js'" = "from './verify.js'"}
    'bin/lib/learning/learning-tracker.ts' = @{"from '../learning/index.js'" = "from './learning-tracker.js'"}
    'bin/lib/learning/discussion-synthesizer.ts' = @{"from '../learning/index.js'" = "from './discussion-synthesizer.js'"}
    'bin/lib/package-manager/package-manager.ts' = @{"from '../package-manager/index.js'" = "from './package-manager.js'"}
    'bin/lib/package-manager/package-manager-detector.ts' = @{"from '../package-manager/index.js'" = "from './package-manager-detector.js'"}
    'bin/lib/package-manager/package-manager-executor.ts' = @{"from '../package-manager/index.js'" = "from './package-manager-executor.js'"}
    'bin/lib/package-manager/package-manager-service.ts' = @{"from '../package-manager/index.js'" = "from './package-manager-service.js'"}
    'bin/lib/business/business-flow-mapper.ts' = @{"from '../business/index.js'" = "from './business-flow-mapper.js'"}
    'bin/lib/business/content-scanner.ts' = @{"from '../business/index.js'" = "from './content-scanner.js'"}
    'bin/lib/business/bdd-validator.ts' = @{"from '../business/index.js'" = "from './bdd-validator.js'"}
    'bin/lib/utils/url-fetch.ts' = @{"from '../utils/index.js'" = "from './url-fetch.js'"}
    'bin/lib/utils/template.ts' = @{"from '../utils/index.js'" = "from './template.js'"}
    'bin/lib/security/auth.ts' = @{"from '../security/index.js'" = "from './auth.js'"}
    'bin/lib/security/security-errors.ts' = @{"from '../security/index.js'" = "from './security-errors.js'"}
}

$totalFixed = 0

foreach ($file in $directImports.Keys) {
    $path = Join-Path $root $file
    if (Test-Path $path) {
        $content = Get-Content $path -Raw
        $original = $content
        
        foreach ($oldPath in $directImports[$file].Keys) {
            $newPath = $directImports[$file][$oldPath]
            $content = $content -replace [regex]::Escape($oldPath), $newPath
        }
        
        if ($content -ne $original) {
            Set-Content -Path $path -Value $content -Encoding UTF8 -NoNewline
            Write-Host "Fixed: $file"
            $totalFixed++
        }
    }
}

Write-Host ""
Write-Host "Total files fixed: $totalFixed"
