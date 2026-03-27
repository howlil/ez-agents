/**
 * Kimi Adapter
 *
 * Adapts Moonshot Kimi API to the ModelProviderAdapter interface.
 * Kimi is a Chinese LLM provider known for long context support.
 *
 * Uses functional composition for shared logic.
 *
 * @example
 * ```typescript
 * const adapter = new KimiAdapter(apiKey, 'moonshot-v1-8k');
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
 * Kimi Adapter class
 *
 * Implements the ModelProviderAdapter interface for Moonshot Kimi API.
 * Uses functional composition to share common chat handling logic.
 */
export class KimiAdapter implements ModelProviderAdapter {
  private readonly apiKey: string;
  private readonly modelName: string;
  private readonly chatHandler: ReturnType<typeof createChatHandler>;

  /**
   * Create Kimi adapter
   * @param apiKey - Moonshot API key
   * @param modelName - Model name (default: 'moonshot-v1-8k')
   */
  constructor(apiKey: string, modelName: string = 'moonshot-v1-8k') {
    this.apiKey = apiKey;
    this.modelName = modelName;

    this.chatHandler = createChatHandler({
      providerName: 'kimi',
      modelName: this.modelName,
      apiKey: this.apiKey,
      buildRequestBody: this._buildRequestBody.bind(this),
      buildRequestOptions: this._buildRequestOptions.bind(this),
      parseResponse: this._parseResponse.bind(this)
    });
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
   * @param traceContext - Optional trace context for distributed tracing
   * @returns Model response
   */
  async chat(messages: Message[], options: ModelOptions = {}, traceContext?: TraceContext): Promise<ModelResponse> {
    return this.chatHandler(messages, options);
  }

  /**
   * Build Kimi-specific request body
   */
  private _buildRequestBody(messages: Message[], options: ModelOptions): Record<string, unknown> {
    const kimiMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const requestBody: Record<string, unknown> = {
      model: this.modelName,
      messages: kimiMessages,
      max_tokens: options.maxTokens || 4096
    };

    if (options.temperature !== undefined) {
      requestBody.temperature = options.temperature;
    }

    return requestBody;
  }

  /**
   * Build Kimi-specific request options
   */
  private _buildRequestOptions(trace: TraceContext): HttpsRequestOptions {
    return {
      hostname: 'api.moonshot.cn',
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
   * Parse Kimi-specific response
   */
  private _parseResponse(response: Record<string, unknown>): ModelResponse {
    const choices = response.choices as Array<{ message: { content: string } }> | undefined;
    const content = choices?.[0]?.message?.content || '';

    const usage: TokenUsage = extractTokenUsage(response as any, {
      promptTokens: 'prompt_tokens',
      completionTokens: 'completion_tokens',
      totalTokens: 'total_tokens'
    });

    return {
      content,
      usage
    };
  }
}

export default KimiAdapter;
