/**
 * Claude Adapter
 *
 * Adapts Anthropic Claude API to the ModelProviderAdapter interface.
 * Supports Claude's Tools API for function calling.
 *
 * @example
 * ```typescript
 * const adapter = new ClaudeAdapter(apiKey, 'claude-sonnet-4-20250514');
 * const response = await adapter.chat(messages, { temperature: 0.7, tools });
 * ```
 */

import * as https from 'https';
import { LogExecution } from '../decorators/LogExecution.js';
import { defaultLogger as logger } from '../logger.js';
import type { ModelProviderAdapter, Message, ModelOptions, ModelResponse, Tool, TokenUsage } from './ModelProviderAdapter.js';
import type { ToolCall } from '../assistant-adapter.js';

/**
 * Claude Adapter class
 *
 * Implements the ModelProviderAdapter interface for Anthropic Claude API.
 */
export class ClaudeAdapter implements ModelProviderAdapter {
  private readonly apiKey: string;
  private readonly modelName: string;

  /**
   * Create Claude adapter
   * @param apiKey - Anthropic API key
   * @param modelName - Model name (default: 'claude-sonnet-4-20250514')
   */
  constructor(apiKey: string, modelName: string = 'claude-sonnet-4-20250514') {
    this.apiKey = apiKey;
    this.modelName = modelName;
  }

  /**
   * Get provider name
   * @returns 'claude'
   */
  getName(): string {
    return 'claude';
  }

  /**
   * Check if Claude supports tools
   * @returns true (Claude supports tool calling)
   */
  supportsTools(): boolean {
    return true;
  }

  /**
   * Get maximum tokens for Claude
   * @returns 100000 (Claude's context window)
   */
  getMaxTokens(): number {
    return 100000;
  }

  /**
   * Send chat message to Claude
   * @param messages - Array of chat messages
   * @param options - Chat options
   * @returns Model response
   */
  @LogExecution('ClaudeAdapter.chat', { logParams: false, logResult: false, level: 'debug' })
  async chat(messages: Message[], options: ModelOptions = {}): Promise<ModelResponse> {
    logger.debug('Claude chat request', {
      model: this.modelName,
      messageCount: messages.length,
      hasTools: !!options.tools
    });

    if (!this.apiKey) {
      throw new Error('Claude API key not configured');
    }

    // Convert messages to Claude format
    const systemMessage = messages.find(m => m.role === 'system');
    const nonSystemMessages = messages.filter(m => m.role !== 'system');

    const claudeMessages = nonSystemMessages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));

    // Build request body
    const requestBody: Record<string, unknown> = {
      model: this.modelName,
      max_tokens: options.maxTokens || 4096,
      messages: claudeMessages
    };

    if (systemMessage) {
      requestBody.system = systemMessage.content;
    }

    if (options.temperature !== undefined) {
      requestBody.temperature = options.temperature;
    }

    // Add tools if provided
    if (options.tools && options.tools.length > 0) {
      requestBody.tools = options.tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema
      }));
    }

    try {
      const response = await this._httpsRequest({
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        }
      }, requestBody);

      // Parse response
      const content = response.content?.[0]?.text || '';
      const usage = response.usage ? {
        promptTokens: (response.usage as any).input_tokens || 0,
        completionTokens: (response.usage as any).output_tokens || 0,
        totalTokens: ((response.usage as any).input_tokens || 0) + ((response.usage as any).output_tokens || 0)
      } : undefined;

      // Extract tool calls if present
      const toolCalls: ToolCall[] = [];
      if (response.content) {
        for (const block of response.content as any[]) {
          if (block.type === 'tool_use') {
            toolCalls.push({
              name: block.name,
              arguments: block.input || {}
            });
          }
        }
      }

      return {
        content,
        toolCalls: toolCalls.length > 0 ? toolCalls : [],
        usage: usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
      };
    } catch (error) {
      const err = error as Error;
      logger.error('Claude API error', { error: err.message });
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
