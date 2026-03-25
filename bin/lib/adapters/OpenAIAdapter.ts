/**
 * OpenAI Adapter
 *
 * Adapts OpenAI Chat Completions API to the ModelProviderAdapter interface.
 * Supports OpenAI's function calling API.
 *
 * @example
 * ```typescript
 * const adapter = new OpenAIAdapter(apiKey, 'gpt-4-turbo');
 * const response = await adapter.chat(messages, { temperature: 0.7, tools });
 * ```
 */

import * as https from 'https';
import { LogExecution } from '../decorators/LogExecution.js';
import { defaultLogger as logger } from '../logger.js';
import type { ModelProviderAdapter, Message, ModelOptions, ModelResponse, Tool, TokenUsage } from './ModelProviderAdapter.js';
import type { ToolCall } from '../assistant-adapter.js';

/**
 * OpenAI Adapter class
 *
 * Implements the ModelProviderAdapter interface for OpenAI API.
 */
export class OpenAIAdapter implements ModelProviderAdapter {
  private apiKey: string;
  private modelName: string;

  /**
   * Create OpenAI adapter
   * @param apiKey - OpenAI API key
   * @param modelName - Model name (default: 'gpt-4-turbo')
   */
  constructor(apiKey: string, modelName: string = 'gpt-4-turbo') {
    this.apiKey = apiKey;
    this.modelName = modelName;
  }

  /**
   * Get provider name
   * @returns 'openai'
   */
  getName(): string {
    return 'openai';
  }

  /**
   * Check if OpenAI supports tools
   * @returns true (OpenAI supports function calling)
   */
  supportsTools(): boolean {
    return true;
  }

  /**
   * Get maximum tokens for OpenAI
   * @returns 128000 (GPT-4 Turbo context window)
   */
  getMaxTokens(): number {
    return 128000;
  }

  /**
   * Send chat message to OpenAI
   * @param messages - Array of chat messages
   * @param options - Chat options
   * @returns Model response
   */
  @LogExecution('OpenAIAdapter.chat', { logParams: false, logResult: false, level: 'debug' })
  async chat(messages: Message[], options: ModelOptions = {}): Promise<ModelResponse> {
    logger.debug('OpenAI chat request', {
      model: this.modelName,
      messageCount: messages.length,
      hasTools: !!options.tools
    });

    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Convert messages to OpenAI format
    const openaiMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Build request body
    const requestBody: Record<string, unknown> = {
      model: this.modelName,
      messages: openaiMessages,
      max_tokens: options.maxTokens || 4096
    };

    if (options.temperature !== undefined) {
      requestBody.temperature = options.temperature;
    }

    // Add tools if provided (OpenAI uses functions format)
    if (options.tools && options.tools.length > 0) {
      requestBody.tools = options.tools.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema
        }
      }));
    }

    try {
      const response = await this._httpsRequest({
        hostname: 'api.openai.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      }, requestBody);

      // Parse response
      const choices = response.choices as Array<{
        message: { content: string; tool_calls?: Array<{ function: { name: string; arguments: string } }> };
      }> | undefined;

      const choice = choices?.[0];
      const content = choice?.message?.content || '';

      // Extract tool calls if present
      const toolCalls: ToolCall[] = [];
      if (choice?.message?.tool_calls) {
        for (const toolCall of choice.message.tool_calls as any[]) {
          toolCalls.push({
            name: toolCall.function.name,
            arguments: JSON.parse(toolCall.function.arguments)
          });
        }
      }

      // Extract usage
      const usage = response.usage ? {
        promptTokens: (response.usage as any).prompt_tokens || 0,
        completionTokens: (response.usage as any).completion_tokens || 0,
        totalTokens: (response.usage as any).total_tokens || 0
      } : { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

      return {
        content,
        toolCalls: toolCalls.length > 0 ? toolCalls : [],
        usage
      };
    } catch (error) {
      const err = error as Error;
      logger.error('OpenAI API error', { error: err.message });
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
