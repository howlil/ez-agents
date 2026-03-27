/**
 * Model Provider Adapter Interface
 *
 * Defines a common contract for all LLM provider adapters, normalizing
 * different provider APIs to a unified interface.
 * Supports W3C TraceContext for distributed tracing.
 *
 * @example
 * ```typescript
 * const adapter = new ClaudeAdapter(apiKey, 'claude-sonnet-4-20250514');
 * const response = await adapter.chat(messages, { temperature: 0.7 }, traceContext);
 * ```
 */

import type { ToolCall } from '../assistant-adapter.js';
import type { TraceContext } from '../logger.js';

/**
 * Message interface for chat conversations
 */
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: ToolCall[];
}

/**
 * Tool definition for model providers
 */
export interface Tool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

/**
 * Model options for chat requests
 */
export interface ModelOptions {
  temperature?: number;
  maxTokens?: number;
  tools?: Tool[];
  [key: string]: unknown;
}

/**
 * Token usage information
 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * Model response interface
 */
export interface ModelResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage?: TokenUsage;
}

/**
 * HTTPS request options for adapters
 */
export interface HttpsRequestOptions {
  hostname: string;
  path: string;
  method: string;
  headers?: Record<string, string>;
}

/**
 * Model Provider Adapter interface
 *
 * All model provider adapters must implement this interface
 * to ensure interchangeability across the codebase.
 */
export interface ModelProviderAdapter {
  /**
   * Get the provider name
   * @returns Provider identifier (e.g., 'claude', 'openai', 'kimi', 'qwen')
   */
  getName(): string;

  /**
   * Send chat message to the model
   * @param messages - Array of chat messages
   * @param options - Chat options (temperature, maxTokens, tools)
   * @param traceContext - Optional trace context for distributed tracing (W3C TraceContext)
   * @returns Model response with content and optional tool calls
   */
  chat(messages: Message[], options?: ModelOptions, traceContext?: TraceContext): Promise<ModelResponse>;

  /**
   * Check if the provider supports tool/function calling
   * @returns True if tools are supported, false otherwise
   */
  supportsTools(): boolean;

  /**
   * Get the maximum tokens allowed for this provider
   * @returns Maximum token count
   */
  getMaxTokens(): number;
}
