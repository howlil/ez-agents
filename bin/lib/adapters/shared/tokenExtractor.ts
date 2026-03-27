/**
 * Token Usage Extractor
 *
 * Pure function for extracting token usage from API responses.
 * Shared across all model provider adapters.
 *
 * @example
 * ```typescript
 * const usage = extractTokenUsage(response, {
 *   promptTokens: 'input_tokens',
 *   completionTokens: 'output_tokens',
 *   totalTokens: 'total_tokens'
 * });
 * ```
 */

import type { TokenUsage } from '../ModelProviderAdapter.js';

/**
 * Token mapping configuration
 */
export interface TokenMappings {
  promptTokens: string;
  completionTokens: string;
  totalTokens?: string;
}

/**
 * Extract token usage from response
 *
 * @param response - API response object
 * @param mappings - Token field mappings
 * @returns Token usage information
 */
export function extractTokenUsage(
  response: Record<string, unknown>,
  mappings: TokenMappings
): TokenUsage {
  const usage = response.usage as Record<string, unknown> | undefined;

  if (!usage) {
    return {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0
    };
  }

  const promptTokens = Number(usage[mappings.promptTokens]) || 0;
  const completionTokens = Number(usage[mappings.completionTokens]) || 0;
  const totalTokens = mappings.totalTokens
    ? Number(usage[mappings.totalTokens]) || 0
    : promptTokens + completionTokens;

  return {
    promptTokens,
    completionTokens,
    totalTokens
  };
}

/**
 * Extract token usage with nested path support
 *
 * @param response - API response object
 * @param mappings - Token field mappings with dot notation paths
 * @returns Token usage information
 */
export function extractTokenUsageWithPath(
  response: Record<string, unknown>,
  mappings: {
    promptTokens: string;
    completionTokens: string;
    totalTokens?: string;
  }
): TokenUsage {
  function getValue(obj: Record<string, unknown>, path: string): number {
    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (typeof current !== 'object' || current === null || !(part in current)) {
        return 0;
      }
      current = (current as Record<string, unknown>)[part];
    }

    return Number(current) || 0;
  }

  const promptTokens = getValue(response, mappings.promptTokens);
  const completionTokens = getValue(response, mappings.completionTokens);
  const totalTokens = mappings.totalTokens
    ? getValue(response, mappings.totalTokens)
    : promptTokens + completionTokens;

  return {
    promptTokens,
    completionTokens,
    totalTokens
  };
}

export default extractTokenUsage;
