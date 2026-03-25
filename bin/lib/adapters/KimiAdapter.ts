/**
 * Kimi Adapter
 *
 * Adapts Moonshot Kimi API to the ModelProviderAdapter interface.
 * Kimi is a Chinese LLM provider known for long context support.
 *
 * @example
 * ```typescript
 * const adapter = new KimiAdapter(apiKey, 'moonshot-v1-8k');
 * const response = await adapter.chat(messages, { temperature: 0.7 });
 * ```
 */

import * as https from 'https';
import { LogExecution } from '../decorators/LogExecution.js';
import { defaultLogger as logger } from '../logger.js';
import type { ModelProviderAdapter, Message, ModelOptions, ModelResponse, TokenUsage } from './ModelProviderAdapter.js';
import type { ToolCall } from '../assistant-adapter.js';

/**
 * Kimi Adapter class
 *
 * Implements the ModelProviderAdapter interface for Moonshot Kimi API.
 */
export class KimiAdapter implements ModelProviderAdapter {
  private apiKey: string;
  private modelName: string;

  /**
   * Create Kimi adapter
   * @param apiKey - Moonshot API key
   * @param modelName - Model name (default: 'moonshot-v1-8k')
   */
  constructor(apiKey: string, modelName: string = 'moonshot-v1-8k') {
    this.apiKey = apiKey;
    this.modelName = modelName;
  }

  /**
   * Get provider name
   * @returns 'kimi'
   */
  getName(): string {
    return 'kimi';
  }

  /**
   * Check if Kimi supports tools
   * @returns false (Kimi has limited tool support)
   */
  supportsTools(): boolean {
    return false;
  }

  /**
   * Get maximum tokens for Kimi
   * @returns 128000 (Kimi's context window)
   */
  getMaxTokens(): number {
    return 128000;
  }

  /**
   * Send chat message to Kimi
   * @param messages - Array of chat messages
   * @param options - Chat options
   * @returns Model response
   */
  @LogExecution('KimiAdapter.chat', { logParams: false, logResult: false, level: 'debug' })
  async chat(messages: Message[], options: ModelOptions = {}): Promise<ModelResponse> {
    logger.debug('Kimi chat request', {
      model: this.modelName,
      messageCount: messages.length
    });

    if (!this.apiKey) {
      throw new Error('Kimi API key not configured');
    }

    // Convert messages to Kimi format (OpenAI-compatible)
    const kimiMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Build request body
    const requestBody: Record<string, unknown> = {
      model: this.modelName,
      messages: kimiMessages,
      max_tokens: options.maxTokens || 4096
    };

    if (options.temperature !== undefined) {
      requestBody.temperature = options.temperature;
    }

    try {
      const response = await this._httpsRequest({
        hostname: 'api.moonshot.cn',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      }, requestBody);

      // Parse response
      const choices = response.choices as Array<{ message: { content: string } }> | undefined;
      const content = choices?.[0]?.message?.content || '';

      // Extract usage
      const usage = response.usage ? {
        promptTokens: (response.usage as any).prompt_tokens || 0,
        completionTokens: (response.usage as any).completion_tokens || 0,
        totalTokens: (response.usage as any).total_tokens || 0
      } : { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

      return {
        content,
        usage
      };
    } catch (error) {
      const err = error as Error;
      logger.error('Kimi API error', { error: err.message });
      throw error;
    }
  }

  /**
   * Helper for HTTPS requests
   * @param options - HTTPS options
   * @param data - Request data
   * @returns Response data
   * @private
   */
  private _httpsRequest(options: Record<string, unknown>, data: Record<string, unknown>): Promise<Record<string, unknown>> {
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
}
