/**
 * Adapter Factory
 *
 * Factory functions for creating model provider adapters.
 * Provides a centralized way to instantiate adapters by name.
 *
 * @example
 * ```typescript
 * const adapter = createModelAdapter('claude', { apiKey, modelName: 'claude-sonnet-4-20250514' });
 * const response = await adapter.chat(messages, { temperature: 0.7 });
 * ```
 */

import { ClaudeAdapter } from './ClaudeAdapter.js';
import { OpenAIAdapter } from './OpenAIAdapter.js';
import { KimiAdapter } from './KimiAdapter.js';
import { QwenAdapter } from './QwenAdapter.js';
import type { ModelProviderAdapter } from './ModelProviderAdapter.js';

/**
 * Options for creating a model adapter
 */
export interface AdapterOptions {
  /**
   * API key for the provider
   */
  apiKey: string;

  /**
   * Model name to use (optional, provider-specific default will be used if not provided)
   */
  modelName?: string;

  /**
   * Additional provider-specific options
   */
  [key: string]: unknown;
}

/**
 * Create a model adapter by provider name
 *
 * @param name - Provider name ('claude', 'openai', 'kimi', 'qwen')
 * @param options - Adapter options (apiKey, modelName, etc.)
 * @returns Model provider adapter instance
 * @throws Error if unknown provider name is provided
 *
 * @example
 * ```typescript
 * const adapter = createModelAdapter('claude', { apiKey: 'sk-...', modelName: 'claude-sonnet-4-20250514' });
 * ```
 */
export function createModelAdapter(name: string, options: AdapterOptions): ModelProviderAdapter {
  switch (name.toLowerCase()) {
    case 'claude':
    case 'anthropic':
      return new ClaudeAdapter(options.apiKey, options.modelName);

    case 'openai':
      return new OpenAIAdapter(options.apiKey, options.modelName);

    case 'kimi':
    case 'moonshot':
      return new KimiAdapter(options.apiKey, options.modelName);

    case 'qwen':
    case 'alibaba':
      return new QwenAdapter(options.apiKey, options.modelName);

    default:
      throw new Error(`Unknown model provider: ${name}. Available providers: claude, openai, kimi, qwen`);
  }
}

/**
 * Get list of available adapter names
 *
 * @returns Array of available provider names
 *
 * @example
 * ```typescript
 * const providers = getAvailableAdapters();
 * console.log(providers); // ['claude', 'openai', 'kimi', 'qwen']
 * ```
 */
export function getAvailableAdapters(): string[] {
  return ['claude', 'openai', 'kimi', 'qwen'];
}

/**
 * Check if an adapter is available for the given provider name
 *
 * @param name - Provider name to check
 * @returns True if adapter is available, false otherwise
 *
 * @example
 * ```typescript
 * if (hasAdapter('claude')) {
 *   const adapter = createModelAdapter('claude', options);
 * }
 * ```
 */
export function hasAdapter(name: string): boolean {
  return getAvailableAdapters().includes(name.toLowerCase());
}
