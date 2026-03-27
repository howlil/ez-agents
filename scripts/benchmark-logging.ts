#!/usr/bin/env node

/**
 * Logging Overhead Benchmark Script
 *
 * Profiles @LogExecution decorator overhead across the codebase.
 * Runs synthetic benchmarks on decorated methods.
 *
 * Usage:
 *   npx tsx scripts/benchmark-logging.ts
 *   npx tsx scripts/benchmark-logging.ts --iterations 100
 *   npx tsx scripts/benchmark-logging.ts --export results.json
 *
 * Environment Variables:
 *   EZ_LOG_PROFILING=true - Required for profiling
 *   EZ_LOG_ENABLED=false  - Optional: test with logging disabled
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LogExecution } from '../bin/lib/decorators/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

// Configuration
const DEFAULT_ITERATIONS = 100;
const WARMUP_ITERATIONS = 10;

interface BenchmarkConfig {
  iterations: number;
  warmup: number;
  exportFile?: string;
}

interface BenchmarkResult {
  timestamp: string;
  config: BenchmarkConfig;
  environment: {
    nodeVersion: string;
    platform: string;
    logEnabled: boolean;
    logProfiling: boolean;
    logLevel: string;
  };
  overheadComparison: {
    withLogging: number;
    withoutLogging: number;
    overhead: number;
    overheadPercent: number;
  };
  hotPaths: HotPath[];
  recommendations: Recommendation[];
}

interface HotPath {
  rank: number;
  method: string;
  callCount: number;
  totalTimeMs: number;
  avgTimeMs: number;
  p95Ms: number;
  impact: string;
  recommendation: string;
}

interface Recommendation {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  method: string;
  issue: string;
  action: string;
  estimatedSavings: string;
}

// Parse command line arguments
function parseArgs(): BenchmarkConfig {
  const args = process.argv.slice(2);
  const config: BenchmarkConfig = {
    iterations: DEFAULT_ITERATIONS,
    warmup: WARMUP_ITERATIONS
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--iterations' && args[i + 1]) {
      config.iterations = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--export' && args[i + 1]) {
      config.exportFile = args[i + 1];
      i++;
    } else if (args[i] === '--help') {
      console.log(`
Logging Overhead Benchmark

Usage: npx tsx scripts/benchmark-logging.ts [options]

Options:
  --iterations <n>   Number of benchmark iterations (default: ${DEFAULT_ITERATIONS})
  --export <file>    Export results to JSON file
  --help            Show this help message

Environment Variables:
  EZ_LOG_PROFILING=true   Enable profiling (required)
  EZ_LOG_ENABLED=false    Disable logging (optional, test overhead)
  EZ_LOG_LEVEL=error      Set log level (optional)

Examples:
  npx tsx scripts/benchmark-logging.ts
  npx tsx scripts/benchmark-logging.ts --iterations 100
  npx tsx scripts/benchmark-logging.ts --export results.json
`);
      process.exit(0);
    }
  }

  return config;
}

// Simulate decorated method calls
class BenchmarkTestClass {
  @LogExecution('BenchmarkTestClass.fastMethod', { logParams: false, logDuration: true })
  fastMethod(): number {
    // Simulate fast operation (< 1ms)
    return Math.random();
  }

  @LogExecution('BenchmarkTestClass.mediumMethod', { logParams: false, logDuration: true })
  async mediumMethod(): Promise<number> {
    // Simulate medium operation (5-10ms)
    await new Promise(resolve => setTimeout(resolve, 5));
    return Math.random();
  }

  @LogExecution('BenchmarkTestClass.slowMethod', { logParams: false, logDuration: true })
  async slowMethod(): Promise<number> {
    // Simulate slow operation (20-50ms)
    await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * 30));
    return Math.random();
  }
}

// Run synthetic benchmark
async function runSyntheticBenchmark(config: BenchmarkConfig): Promise<{
  withLogging: number;
  withoutLogging: number;
}> {
  const instance = new BenchmarkTestClass();
  
  // With logging enabled
  const startWithLogging = performance.now();
  for (let i = 0; i < config.iterations; i++) {
    instance.fastMethod();
    await instance.mediumMethod();
    await instance.slowMethod();
  }
  const withLogging = performance.now() - startWithLogging;
  
  // With logging disabled
  const originalEnv = process.env.EZ_LOG_ENABLED;
  process.env.EZ_LOG_ENABLED = 'false';
  
  // Force reload of decorator (clear cache)
  const startWithoutLogging = performance.now();
  for (let i = 0; i < config.iterations; i++) {
    instance.fastMethod();
    await instance.mediumMethod();
    await instance.slowMethod();
  }
  const withoutLogging = performance.now() - startWithoutLogging;
  
  // Restore
  process.env.EZ_LOG_ENABLED = originalEnv;
  
  return { withLogging, withoutLogging };
}

// Generate hot paths analysis
function analyzeHotPaths(profilingData: any[]): HotPath[] {
  return profilingData.slice(0, 10).map((item, index) => {
    const impact = item.totalTimeMs > 1000 ? 'CRITICAL' : 
                   item.totalTimeMs > 500 ? 'HIGH' : 
                   item.totalTimeMs > 100 ? 'MEDIUM' : 'LOW';
    
    let recommendation = 'Keep decorator';
    if (impact === 'CRITICAL') {
      recommendation = 'Remove decorator, use manual wide events';
    } else if (impact === 'HIGH') {
      recommendation = 'Optimize: lazy param evaluation, increase threshold';
    } else if (impact === 'MEDIUM') {
      recommendation = 'Monitor: consider optimization if frequency increases';
    }

    return {
      rank: index + 1,
      method: item.method,
      callCount: item.callCount,
      totalTimeMs: item.totalTimeMs,
      avgTimeMs: item.avgTimeMs,
      p95Ms: item.p95Ms,
      impact,
      recommendation
    };
  });
}

// Generate recommendations based on profiling data
function generateRecommendations(hotPaths: HotPath[]): Recommendation[] {
  const recommendations: Recommendation[] = [];

  hotPaths.forEach(hotPath => {
    if (hotPath.impact === 'CRITICAL') {
      recommendations.push({
        priority: 'HIGH',
        method: hotPath.method,
        issue: `High overhead: ${hotPath.totalTimeMs.toFixed(0)}ms total (${hotPath.callCount} calls × ${hotPath.avgTimeMs.toFixed(2)}ms avg)`,
        action: 'Remove @LogExecution decorator, replace with manual wide event logging',
        estimatedSavings: `${(hotPath.totalTimeMs * 0.8).toFixed(0)}ms (${Math.round(hotPath.totalTimeMs * 0.8)}ms per phase)`
      });
    } else if (hotPath.impact === 'HIGH') {
      recommendations.push({
        priority: 'MEDIUM',
        method: hotPath.method,
        issue: `Moderate overhead: ${hotPath.totalTimeMs.toFixed(0)}ms total`,
        action: 'Add lazy parameter evaluation, increase slow call threshold to 20ms',
        estimatedSavings: `${(hotPath.totalTimeMs * 0.5).toFixed(0)}ms`
      });
    }
  });

  // Add general recommendations
  if (hotPaths.some(h => h.avgTimeMs > 5)) {
    recommendations.push({
      priority: 'MEDIUM',
      method: 'All decorators',
      issue: 'High average execution time per call',
      action: 'Implement getter-based lazy serialization for parameters',
      estimatedSavings: '30-50% reduction in serialization overhead'
    });
  }

  return recommendations;
}

// Import profiling results from LogExecution module
async function importProfilingResults(): Promise<any[]> {
  try {
    // Dynamic import to avoid circular dependencies
    const module = await import('../bin/lib/decorators/index.js');
    if (module.getProfilingResults) {
      return module.getProfilingResults();
    }
  } catch (error) {
    console.error('Failed to import profiling results:', error);
  }
  return [];
}

// Main benchmark execution
async function runBenchmark(): Promise<void> {
  const config = parseArgs();
  
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     Logging Overhead Benchmark - Phase 26 Profiling     ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Validate environment
  if (process.env.EZ_LOG_PROFILING !== 'true') {
    console.error('❌ ERROR: EZ_LOG_PROFILING must be set to "true"');
    console.error('   Run: set EZ_LOG_PROFILING=true&& npx tsx scripts/benchmark-logging.ts\n');
    process.exit(1);
  }

  console.log('📋 Configuration:');
  console.log(`   Iterations: ${config.iterations}`);
  console.log(`   Warmup: ${config.warmup}`);
  console.log(`   Export: ${config.exportFile || 'none'}`);
  console.log('');

  console.log('🔧 Environment:');
  console.log(`   EZ_LOG_PROFILING: ${process.env.EZ_LOG_PROFILING}`);
  console.log(`   EZ_LOG_ENABLED: ${process.env.EZ_LOG_ENABLED ?? 'true (default)'}`);
  console.log(`   EZ_LOG_LEVEL: ${process.env.EZ_LOG_LEVEL ?? 'info (default)'}`);
  console.log(`   Node.js: ${process.version}`);
  console.log(`   Platform: ${process.platform}`);
  console.log('');

  // Run synthetic benchmark
  console.log('🚀 Running synthetic benchmark...\n');
  
  // Warmup
  console.log('🔥 Warmup phase...');
  const warmupConfig = { ...config, iterations: config.warmup };
  await runSyntheticBenchmark(warmupConfig);
  console.log('✓ Warmup complete\n');

  // Benchmark with logging enabled
  console.log('📊 Testing WITH logging enabled...');
  process.env.EZ_LOG_ENABLED = 'true';
  const startWithLogging = performance.now();
  for (let i = 0; i < config.iterations; i++) {
    const instance = new BenchmarkTestClass();
    instance.fastMethod();
    await instance.mediumMethod();
    await instance.slowMethod();
  }
  const withLogging = performance.now() - startWithLogging;
  console.log(`   Total: ${withLogging.toFixed(0)}ms for ${config.iterations} iterations\n`);

  // Benchmark with logging disabled
  console.log('📊 Testing WITH logging disabled...');
  process.env.EZ_LOG_ENABLED = 'false';
  const startWithoutLogging = performance.now();
  for (let i = 0; i < config.iterations; i++) {
    const instance = new BenchmarkTestClass();
    instance.fastMethod();
    await instance.mediumMethod();
    await instance.slowMethod();
  }
  const withoutLogging = performance.now() - startWithoutLogging;
  console.log(`   Total: ${withoutLogging.toFixed(0)}ms for ${config.iterations} iterations\n`);

  // Restore
  process.env.EZ_LOG_ENABLED = 'true';

  // Import profiling data
  console.log('📊 Collecting profiling data...');
  const profilingData = await importProfilingResults();
  console.log(`   Collected data from ${profilingData.length} methods\n`);

  // Analyze
  const hotPaths = analyzeHotPaths(profilingData);
  const recommendations = generateRecommendations(hotPaths);

  // Calculate overhead
  const overhead = withLogging - withoutLogging;
  const overheadPercent = withoutLogging > 0 ? (overhead / withoutLogging) * 100 : 0;

  // Generate report
  const result: BenchmarkResult = {
    timestamp: new Date().toISOString(),
    config,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      logEnabled: process.env.EZ_LOG_ENABLED !== 'false',
      logProfiling: process.env.EZ_LOG_PROFILING === 'true',
      logLevel: process.env.EZ_LOG_LEVEL || 'info'
    },
    overheadComparison: {
      withLogging,
      withoutLogging,
      overhead,
      overheadPercent
    },
    hotPaths,
    recommendations
  };

  // Display results
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║              OVERHEAD COMPARISON RESULTS                ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  console.log(`📊 With Logging:    ${withLogging.toFixed(2)}ms`);
  console.log(`📊 Without Logging: ${withoutLogging.toFixed(2)}ms`);
  console.log(`⚡ Overhead:        ${overhead.toFixed(2)}ms (${overheadPercent.toFixed(2)}%)`);
  console.log(`📈 Per Iteration:   ${(overhead / config.iterations).toFixed(4)}ms\n`);

  // Display hot paths
  if (hotPaths.length > 0) {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║                    TOP 10 HOT PATHS                     ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    console.log('┌─────┬──────────────────────────────────────┬──────────┬────────────┬──────────┬────────────┐');
    console.log('│ #   │ Method                               │ Calls    │ Total (ms) │ Avg (ms) │ Impact     │');
    console.log('├─────┼──────────────────────────────────────┼──────────┼────────────┼──────────┼────────────┤');
    
    hotPaths.forEach(hotPath => {
      const impactColor = hotPath.impact === 'CRITICAL' ? '🔴' :
                          hotPath.impact === 'HIGH' ? '🟠' :
                          hotPath.impact === 'MEDIUM' ? '🟡' : '🟢';
      
      console.log(
        `│ ${hotPath.rank.toString().padEnd(3)} │ ${hotPath.method.padEnd(38)} │ ${hotPath.callCount.toString().padEnd(8)} │ ${hotPath.totalTimeMs.toFixed(0).padEnd(10)} │ ${hotPath.avgTimeMs.toFixed(2).padEnd(8)} │ ${impactColor} ${hotPath.impact.padEnd(10)} │`
      );
    });
    
    console.log('└─────┴──────────────────────────────────────┴──────────┴────────────┴──────────┴────────────┘\n');
  }

  // Display recommendations
  if (recommendations.length > 0) {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║                   RECOMMENDATIONS                        ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    recommendations.forEach((rec, idx) => {
      const priorityIcon = rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🟢';
      console.log(`${priorityIcon} ${rec.priority} #${idx + 1}: ${rec.method}`);
      console.log(`   Issue: ${rec.issue}`);
      console.log(`   Action: ${rec.action}`);
      console.log(`   Estimated Savings: ${rec.estimatedSavings}\n`);
    });
  }

  // Export results if requested
  if (config.exportFile) {
    const exportPath = path.join(ROOT_DIR, config.exportFile);
    fs.writeFileSync(exportPath, JSON.stringify(result, null, 2));
    console.log(`📁 Results exported to: ${exportPath}\n`);
  }

  // Summary
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                      SUMMARY                             ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  const totalOverhead = hotPaths.reduce((sum, h) => sum + h.totalTimeMs, 0);
  const criticalPaths = hotPaths.filter(h => h.impact === 'CRITICAL').length;
  const highPaths = hotPaths.filter(h => h.impact === 'HIGH').length;
  
  console.log(`📊 Total logging overhead: ${overhead.toFixed(2)}ms (${overheadPercent.toFixed(2)}%)`);
  console.log(`📊 Total hot path overhead: ${totalOverhead.toFixed(0)}ms`);
  console.log(`🔴 Critical hot paths: ${criticalPaths}`);
  console.log(`🟠 High impact paths: ${highPaths}`);
  console.log(`📈 Total methods profiled: ${profilingData.length}`);
  console.log(`⚡ Recommended actions: ${recommendations.length}\n`);

  if (overheadPercent > 10) {
    console.log('💡 Next Steps:');
    console.log('   1. Review critical hot paths (top 3)');
    console.log('   2. Remove decorators from top offenders');
    console.log('   3. Implement lazy parameter evaluation');
    console.log('   4. Re-run benchmark to verify improvements\n');
  } else {
    console.log('✅ Logging overhead is within acceptable limits (<10%)!\n');
  }
}

// Run benchmark
runBenchmark().catch(error => {
  console.error('Benchmark failed:', error);
  process.exit(1);
});
