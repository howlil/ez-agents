/**
 * OpenAI Adapter
 *
 * Adapts OpenAI Chat Completions API to the ModelProviderAdapter interface.
 * Supports OpenAI's function calling API.
 *
 * Uses functional composition for shared logic.
 *
 * @example
 * ```typescript
 * const adapter = new OpenAIAdapter(apiKey, 'gpt-4-turbo');
 * const response = await adapter.chat(messages, { temperature: 0.7, tools });
 * ```
 */

import { createChatHandler, extractTokenUsage } from './shared/index.js';
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
import { createTraceContext, type TraceContext } from '../logger/index.js';

/**
 * OpenAI Adapter class
 *
 * Implements the ModelProviderAdapter interface for OpenAI API.
 * Uses functional composition to share common chat handling logic.
 */
export class OpenAIAdapter implements ModelProviderAdapter {
  private readonly apiKey: string;
  private readonly modelName: string;
  private readonly chatHandler: ReturnType<typeof createChatHandler>;

  /**
   * Create OpenAI adapter
   * @param apiKey - OpenAI API key
   * @param modelName - Model name (default: 'gpt-4-turbo')
   */
  constructor(apiKey: string, modelName: string = 'gpt-4-turbo') {
    this.apiKey = apiKey;
    this.modelName = modelName;

    this.chatHandler = createChatHandler({
      providerName: 'openai',
      modelName: this.modelName,
      apiKey: this.apiKey,
      buildRequestBody: this._buildRequestBody.bind(this),
      buildRequestOptions: this._buildRequestOptions.bind(this),
      parseResponse: this._parseResponse.bind(this)
    });
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
   * @param traceContext - Optional trace context for distributed tracing
   * @returns Model response
   */
  async chat(messages: Message[], options: ModelOptions = {}, traceContext?: TraceContext): Promise<ModelResponse> {
    return this.chatHandler(messages, options);
  }

  /**
   * Build OpenAI-specific request body
   */
  private _buildRequestBody(messages: Message[], options: ModelOptions): Record<string, unknown> {
    const openaiMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

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

    return requestBody;
  }

  /**
   * Build OpenAI-specific request options
   */
  private _buildRequestOptions(trace: TraceContext): HttpsRequestOptions {
    return {
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'traceparent': `00-${trace.traceId}-${trace.spanId}-01`
      }
    };
  }

  /**
   * Parse OpenAI-specific response
   */
  private _parseResponse(response: Record<string, unknown>): ModelResponse {
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
    const usage: TokenUsage = extractTokenUsage(response as any, {
      promptTokens: 'prompt_tokens',
      completionTokens: 'completion_tokens',
      totalTokens: 'total_tokens'
    });

    return {
      content,
      toolCalls: toolCalls.length > 0 ? toolCalls : [],
      usage
    };
  }
}

export default OpenAIAdapter;
