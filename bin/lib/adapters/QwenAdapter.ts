/**
 * Qwen Adapter
 *
 * Adapts Alibaba Qwen (DashScope) API to the ModelProviderAdapter interface.
 * Qwen is a Chinese LLM provider with strong multilingual capabilities.
 *
 * Uses functional composition for shared logic.
 *
 * @example
 * ```typescript
 * const adapter = new QwenAdapter(apiKey, 'qwen-max');
 * const response = await adapter.chat(messages, { temperature: 0.7 });
 * ```
 */

import { createChatHandler, extractTokenUsage } from './shared/index.js';
import type {
  ModelProviderAdapter,
  Message,
  ModelOptions,
  ModelResponse,
  TokenUsage,
  HttpsRequestOptions
} from './ModelProviderAdapter.js';
import { createTraceContext, type TraceContext } from '../logger.js';

/**
 * Qwen Adapter class
 *
 * Implements the ModelProviderAdapter interface for Alibaba Qwen API.
 * Uses functional composition to share common chat handling logic.
 */
export class QwenAdapter implements ModelProviderAdapter {
  private readonly apiKey: string;
  private readonly modelName: string;
  private readonly chatHandler: ReturnType<typeof createChatHandler>;

  /**
   * Create Qwen adapter
   * @param apiKey - Alibaba DashScope API key
   * @param modelName - Model name (default: 'qwen-max')
   */
  constructor(apiKey: string, modelName: string = 'qwen-max') {
    this.apiKey = apiKey;
    this.modelName = modelName;

    this.chatHandler = createChatHandler({
      providerName: 'qwen',
      modelName: this.modelName,
      apiKey: this.apiKey,
      buildRequestBody: this._buildRequestBody.bind(this),
      buildRequestOptions: this._buildRequestOptions.bind(this),
      parseResponse: this._parseResponse.bind(this)
    });
  }

  /**
   * Get provider name
   * @returns 'qwen'
   */
  getName(): string {
    return 'qwen';
  }

  /**
   * Check if Qwen supports tools
   * @returns true (Qwen supports function calling)
   */
  supportsTools(): boolean {
    return true;
  }

  /**
   * Get maximum tokens for Qwen
   * @returns 32000 (Qwen's context window)
   */
  getMaxTokens(): number {
    return 32000;
  }

  /**
   * Send chat message to Qwen
   * @param messages - Array of chat messages
   * @param options - Chat options
   * @param traceContext - Optional trace context for distributed tracing
   * @returns Model response
   */
  async chat(messages: Message[], options: ModelOptions = {}, traceContext?: TraceContext): Promise<ModelResponse> {
    return this.chatHandler(messages, options);
  }

  /**
   * Build Qwen-specific request body
   */
  private _buildRequestBody(messages: Message[], options: ModelOptions): Record<string, unknown> {
    const qwenMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const requestBody: Record<string, unknown> = {
      model: this.modelName,
      input: {
        messages: qwenMessages
      },
      parameters: {
        result_format: 'message',
        max_tokens: options.maxTokens || 4096
      }
    } as any;

    if (options.temperature !== undefined) {
      (requestBody.parameters as any).temperature = options.temperature;
    }

    if (options.tools && options.tools.length > 0) {
      (requestBody.parameters as any).tools = options.tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema
      }));
    }

    return requestBody;
  }

  /**
   * Build Qwen-specific request options
   */
  private _buildRequestOptions(trace: TraceContext): HttpsRequestOptions {
    return {
      hostname: 'dashscope.aliyuncs.com',
      path: '/api/v1/services/aigc/text-generation/generation',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'traceparent': `00-${trace.traceId}-${trace.spanId}-01`
      }
    };
  }

  /**
   * Parse Qwen-specific response
   */
  private _parseResponse(response: Record<string, unknown>): ModelResponse {
    const output = response.output as { choices?: Array<{ message: { content: string } }> } | undefined;
    const content = output?.choices?.[0]?.message?.content || '';

    const usage: TokenUsage = extractTokenUsage(response as any, {
      promptTokens: 'input_tokens',
      completionTokens: 'output_tokens',
      totalTokens: 'total_tokens'
    });

    return {
      content,
      usage
    };
  }
}

export default QwenAdapter;
