/**
 * Claude Adapter
 *
 * Adapts Anthropic Claude API to the ModelProviderAdapter interface.
 * Supports Claude's Tools API for function calling.
 *
 * Uses functional composition for shared logic.
 *
 * @example
 * ```typescript
 * const adapter = new ClaudeAdapter(apiKey, 'claude-sonnet-4-20250514');
 * const response = await adapter.chat(messages, { temperature: 0.7, tools });
 * ```
 */

import { createChatHandler, httpsRequest, extractTokenUsage } from './shared/index.js';
import type {
  ModelProviderAdapter,
  Message,
  ModelOptions,
  ModelResponse,
  Tool,
  TokenUsage,
  HttpsRequestOptions
} from './ModelProviderAdapter.js';
import type { ToolCall } from '../assistant-adapter.js';
import { createTraceContext, type TraceContext } from '../logger.js';

/**
 * Claude Adapter class
 *
 * Implements the ModelProviderAdapter interface for Anthropic Claude API.
 * Uses functional composition to share common chat handling logic.
 */
export class ClaudeAdapter implements ModelProviderAdapter {
  private readonly apiKey: string;
  private readonly modelName: string;
  private readonly chatHandler: ReturnType<typeof createChatHandler>;

  /**
   * Create Claude adapter
   * @param apiKey - Anthropic API key
   * @param modelName - Model name (default: 'claude-sonnet-4-20250514')
   */
  constructor(apiKey: string, modelName: string = 'claude-sonnet-4-20250514') {
    this.apiKey = apiKey;
    this.modelName = modelName;

    // Create chat handler with Claude-specific implementations
    this.chatHandler = createChatHandler({
      providerName: 'claude',
      modelName: this.modelName,
      apiKey: this.apiKey,
      buildRequestBody: this._buildRequestBody.bind(this),
      buildRequestOptions: this._buildRequestOptions.bind(this),
      parseResponse: this._parseResponse.bind(this)
    });
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
   * @param traceContext - Optional trace context for distributed tracing
   * @returns Model response
   */
  async chat(messages: Message[], options: ModelOptions = {}, traceContext?: TraceContext): Promise<ModelResponse> {
    return this.chatHandler(messages, options);
  }

  /**
   * Build Claude-specific request body
   *
   * @param messages - Array of chat messages
   * @param options - Chat options
   * @returns Claude API request body
   */
  private _buildRequestBody(messages: Message[], options: ModelOptions): Record<string, unknown> {
    // Extract system message
    const systemMessage = messages.find(m => m.role === 'system');
    const nonSystemMessages = messages.filter(m => m.role !== 'system');

    // Convert messages to Claude format
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

    // Add system message if present
    if (systemMessage) {
      requestBody.system = systemMessage.content;
    }

    // Add temperature if provided
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

    return requestBody;
  }

  /**
   * Build Claude-specific request options
   *
   * @param trace - Trace context for distributed tracing
   * @returns HTTPS request options
   */
  private _buildRequestOptions(trace: TraceContext): HttpsRequestOptions {
    return {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'traceparent': `00-${trace.traceId}-${trace.spanId}-01` // W3C TraceContext propagation
      }
    };
  }

  /**
   * Parse Claude-specific response
   *
   * @param response - API response
   * @returns Parsed model response
   */
  private _parseResponse(response: Record<string, unknown>): ModelResponse {
    // Extract content
    const content = (response.content as Array<any>)?.[0]?.text || '';

    // Extract usage
    const usage: TokenUsage | undefined = response.usage ? extractTokenUsage(response as any, {
      promptTokens: 'input_tokens',
      completionTokens: 'output_tokens'
    }) : undefined;

    // Extract tool calls
    const toolCalls: ToolCall[] = [];
    if (response.content) {
      for (const block of response.content as Array<any>) {
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
  }
}

export default ClaudeAdapter;
