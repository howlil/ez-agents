/**
 * Base Adapter — Common functionality for model provider adapters
 *
 * Provides shared HTTPS request handling and common adapter utilities.
 * All model provider adapters should extend this class to avoid code duplication.
 *
 * @example
 * ```typescript
 * class MyAdapter extends BaseAdapter {
 *   async chat(messages: Message[], options: ModelOptions = {}): Promise<ModelResponse> {
 *     const response = await this._httpsRequest(options, requestBody);
 *     return this._parseResponse(response);
 *   }
 * }
 * ```
 */

import * as https from 'https';
import { defaultLogger as logger } from '../logger.js';
import type { ModelOptions, ModelResponse, TokenUsage } from './ModelProviderAdapter.js';

/**
 * HTTPS request options
 */
export interface HttpsRequestOptions {
  hostname: string;
  path: string;
  method: string;
  headers?: Record<string, string>;
}

/**
 * Base Adapter class
 *
 * Provides common functionality for all model provider adapters:
 * - HTTPS request handling
 * - Response parsing utilities
 * - Error handling
 */
export abstract class BaseAdapter {
  /**
   * Get the provider name
   */
  abstract getName(): string;

  /**
   * Send chat message to the model
   * @param messages - Array of chat messages
   * @param options - Chat options
   */
  abstract chat(messages: any[], options?: ModelOptions): Promise<ModelResponse>;

  /**
   * Helper for HTTPS requests
   *
   * @param options - HTTPS options
   * @param data - Request data
   * @returns Response data
   * @protected
   */
  protected _httpsRequest(
    options: HttpsRequestOptions,
    data: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          if (res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(body));
            } catch {
              resolve({ raw: body });
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          }
        });
      });

      req.on('error', reject);
      if (data) req.write(JSON.stringify(data));
      req.end();
    });
  }

  /**
   * Extract token usage from response
   *
   * @param response - API response
   * @param mappings - Token count mappings
   * @returns Token usage information
   * @protected
   */
  protected _extractUsage(
    response: Record<string, unknown>,
    mappings: {
      promptTokens: string;
      completionTokens: string;
      totalTokens: string;
    }
  ): TokenUsage {
    const usage = response.usage as Record<string, unknown> | undefined;
    if (!usage) {
      return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    }

    return {
      promptTokens: (usage[mappings.promptTokens] as number) || 0,
      completionTokens: (usage[mappings.completionTokens] as number) || 0,
      totalTokens: (usage[mappings.totalTokens] as number) || 0
    };
  }

  /**
   * Log API error
   *
   * @param provider - Provider name
   * @param error - Error message
   * @protected
   */
  protected _logApiError(provider: string, error: string): void {
    logger.error(`${provider} API error`, { error });
  }

  /**
   * Log chat request
   *
   * @param provider - Provider name
   * @param model - Model name
   * @param messageCount - Number of messages
   * @param hasTools - Whether tools are provided
   * @protected
   */
  protected _logChatRequest(
    provider: string,
    model: string,
    messageCount: number,
    hasTools?: boolean
  ): void {
    logger.debug(`${provider} chat request`, {
      model,
      messageCount,
      hasTools: !!hasTools
    });
  }
}
