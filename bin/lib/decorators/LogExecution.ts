/**
 * LogExecution Decorator
 *
 * Environment-controlled logging for method execution.
 * Zero overhead when disabled via environment variables.
 * Enhanced with high-resolution performance profiling.
 *
 * Environment variables:
 * - EZ_LOG_ENABLED: 'true' | 'false' (default: 'true')
 * - EZ_LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug' (default: 'info')
 * - EZ_LOG_PROFILING: 'true' | 'false' (default: 'false') - Enable performance profiling
 *
 * @example
 * ```typescript
 * @LogExecution('ContextManager.gather', { logParams: true, level: 'debug' })
 * async gather(options: ContextOptions): Promise<string> { }
 * ```
 */

import { defaultLogger as logger } from '../logger.js';
import type { LogExecutionOptions } from './types.js';

/**
 * Performance profiling collector for logging overhead analysis
 */
interface ProfilingData {
  method: string;
  callCount: number;
  totalTimeMs: number;
  minTimeMs: number;
  maxTimeMs: number;
  avgTimeMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
}

const profilingEnabled = process.env.EZ_LOG_PROFILING === 'true';
const profilingData = new Map<string, { times: number[]; method: string }>();

/**
 * Record execution time for profiling
 */
function recordProfilingData(method: string, durationMs: number): void {
  if (!profilingEnabled) return;

  const key = method;
  if (!profilingData.has(key)) {
    profilingData.set(key, { times: [], method });
  }
  profilingData.get(key)!.times.push(durationMs);
}

/**
 * Get profiling results sorted by total time (callCount × avgTime)
 */
export function getProfilingResults(): ProfilingData[] {
  const results: ProfilingData[] = [];

  for (const [method, data] of profilingData.entries()) {
    const times = data.times.sort((a, b) => a - b);
    const total = times.reduce((sum, t) => sum + t, 0);
    const count = times.length;

    results.push({
      method,
      callCount: count,
      totalTimeMs: total,
      minTimeMs: times[0] ?? 0,
      maxTimeMs: times[times.length - 1] ?? 0,
      avgTimeMs: count > 0 ? total / count : 0,
      p50Ms: times[Math.floor(count * 0.5)] ?? 0,
      p95Ms: times[Math.floor(count * 0.95)] ?? 0,
      p99Ms: times[Math.floor(count * 0.99)] ?? 0
    });
  }

  // Sort by total impact (callCount × avgTime = totalTime)
  return results.sort((a, b) => b.totalTimeMs - a.totalTimeMs);
}

/**
 * Export profiling results to JSON file
 */
export function exportProfilingResults(filePath: string): void {
  const fs = require('fs');
  const results = getProfilingResults();
  const report = {
    timestamp: new Date().toISOString(),
    profilingEnabled,
    totalMethods: results.length,
    totalCalls: results.reduce((sum, r) => sum + r.callCount, 0),
    totalTimeMs: results.reduce((sum, r) => sum + r.totalTimeMs, 0),
    top10HotPaths: results.slice(0, 10),
    allMethods: results
  };

  fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
  console.log(`Profiling results exported to: ${filePath}`);
}

/**
 * Log level priorities for comparison
 */
const LOG_LEVELS: Record<string, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

/**
 * Check if logging is enabled and at appropriate level
 */
function shouldLog(level: string): boolean {
  const enabled = process.env.EZ_LOG_ENABLED !== 'false';
  if (!enabled) return false;

  const minLevel = process.env.EZ_LOG_LEVEL || 'info';
  const minPriority = LOG_LEVELS[minLevel] ?? 2;
  const logPriority = LOG_LEVELS[level] ?? 3;

  return logPriority <= minPriority;
}

/**
 * LogExecution decorator factory with environment control
 *
 * @param methodName - Name of the method for logging identification
 * @param options - Logging options (params, result, duration, level)
 * @returns Method decorator (NO-OP if disabled)
 */
export function LogExecution(methodName: string, options: LogExecutionOptions = {}) {
  const logLevel = options.level || 'debug';
  const enabled = shouldLog(logLevel);

  // Return NO-OP decorator if logging is disabled (zero overhead)
  if (!enabled) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      return descriptor;
    };
  }

  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;
    const fullMethodName = `${className}.${methodName}`;

    descriptor.value = function (...args: any[]) {
      // Lazy param evaluation (only if logParams is true)
      const paramsObj = options.logParams ? { params: args } : {};
      const namedParam = options.paramName ? { [options.paramName]: args[0] } : {};
      
      // Use high-resolution timer for profiling
      const startTime = performance.now();
      
      // Log entry (if enabled)
      if (enabled) {
        logger[logLevel](`[${className}] Entering ${methodName}`, { ...paramsObj, ...namedParam });
      }

      try {
        const result = originalMethod.apply(this, args);

        // Handle both sync and async methods
        if (result instanceof Promise) {
          return result
            .then((resolvedResult: any) => {
              const duration = performance.now() - startTime;
              
              // Record profiling data
              recordProfilingData(fullMethodName, duration);
              
              // Log completion (if enabled)
              if (enabled && (options.logDuration || options.logResult)) {
                logger[logLevel](`[${className}] Completed ${methodName}`, {
                  ...(options.logDuration && { duration: `${duration.toFixed(2)}ms` }),
                  ...(options.logResult && { result: resolvedResult })
                });
              }
              
              // Log slow call warning
              if (profilingEnabled && duration > 10) {
                logger.warn(`[${className}] Slow call ${methodName}`, { duration: `${duration.toFixed(2)}ms` });
              }
              
              return resolvedResult;
            })
            .catch((error: Error) => {
              const duration = performance.now() - startTime;
              
              // Record profiling data even for errors
              recordProfilingData(fullMethodName, duration);
              
              logger.error(`[${className}] Failed ${methodName}`, {
                ...(options.logDuration && { duration: `${duration.toFixed(2)}ms` }),
                error: error.message
              });
              throw error;
            });
        }

        // Synchronous method
        const duration = performance.now() - startTime;
        
        // Record profiling data
        recordProfilingData(fullMethodName, duration);
        
        // Log completion (if enabled)
        if (enabled && (options.logDuration || options.logResult)) {
          logger[logLevel](`[${className}] Completed ${methodName}`, {
            ...(options.logDuration && { duration: `${duration.toFixed(2)}ms` }),
            ...(options.logResult && { result })
          });
        }
        
        // Log slow call warning
        if (profilingEnabled && duration > 10) {
          logger.warn(`[${className}] Slow call ${methodName}`, { duration: `${duration.toFixed(2)}ms` });
        }

        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        
        // Record profiling data
        recordProfilingData(fullMethodName, duration);
        
        logger.error(`[${className}] Failed ${methodName}`, {
          ...(options.logDuration && { duration: `${duration.toFixed(2)}ms` }),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    };

    return descriptor;
  };
}
