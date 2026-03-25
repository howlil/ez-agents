#!/usr/bin/env node

/**
 * EZ Retry — Retry utility with exponential backoff
 *
 * Features:
 * - Configurable max retries, base delay, max delay
 * - Jitter to prevent thundering herd
 * - Error classification (retryable vs non-retryable)
 *
 * Usage:
 *   import { retry, isRetryableError, classifyError } from './retry.js';
 *   const result = await retry(() => fetch(url), { maxRetries: 3 });
 */

import { defaultLogger as logger } from './logger.js';

// ─── Type Definitions ────────────────────────────────────────────────────────

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  jitter?: boolean;
  shouldRetry?: (err: Error) => boolean;
}

export interface RetryableError extends Error {
  code?: string;
  status?: number;
}

// ─── Retry Logic ────────────────────────────────────────────────────────────

/**
 * Retry an operation with exponential backoff
 * @param operation - Async function to retry
 * @param options - Retry options
 * @returns Result of operation
 */
export async function retry<T>(operation: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    jitter = true,
    shouldRetry = isRetryableError
  } = options;

  let lastError: Error | null = null;
  let lastAttempt: number | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      lastAttempt = attempt;
      return await operation();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Don't retry if error is not retryable or max retries reached
      if (attempt === maxRetries || !shouldRetry(lastError)) {
        logger.error('Operation failed after retries', {
          attempts: attempt + 1,
          error: lastError.message
        });
        break;
      }

      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt),
        maxDelay
      );
      const jitteredDelay = jitter ? delay * (0.5 + Math.random()) : delay;

      logger.warn('Retrying operation', {
        attempt: attempt + 1,
        maxRetries,
        delay: Math.round(jitteredDelay),
        error: lastError.message
      });

      await new Promise(resolve => setTimeout(resolve, jitteredDelay));
    }
  }

  const error = new Error(`Operation failed after ${(lastAttempt ?? 0) + 1} attempts: ${(lastError as Error).message}`);
  error.cause = lastError;
  throw error;
}

/**
 * Check if error is retryable
 * @param err - Error to check
 * @returns True if retryable
 */
export function isRetryableError(err: Error): boolean {
  const retryableCodes = ['ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN', 'ENOTFOUND'];
  const retryableStatus = [429, 500, 502, 503, 504];

  const retryableErr = err as RetryableError;
  if (retryableErr.code && retryableCodes.includes(retryableErr.code)) return true;
  if (retryableErr.status && retryableStatus.includes(retryableErr.status)) return true;
  if (err.message?.includes('rate limit')) return true;
  if (err.message?.includes('timeout')) return true;
  if (err.message?.includes('network')) return true;

  return false;
}

/**
 * Classify error type
 * @param err - Error to classify
 * @returns Error classification
 */
export function classifyError(err: Error): string {
  if (isRetryableError(err)) {
    return 'retryable';
  }

  const retryableErr = err as RetryableError;
  if (retryableErr.code === 'ENOENT' || retryableErr.code === 'EPERM') {
    return 'filesystem';
  }

  if (err.message?.includes('parse') || err.message?.includes('invalid')) {
    return 'validation';
  }

  return 'unknown';
}

export default { retry, isRetryableError, classifyError };
