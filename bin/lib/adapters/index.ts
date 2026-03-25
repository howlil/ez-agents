/**
 * Adapters Module Barrel Export
 *
 * Central export point for all adapter pattern implementations.
 * Provides ModelProviderAdapter and SkillAdapter interfaces along with
 * concrete adapter implementations.
 *
 * @module adapters
 *
 * @example
 * ```typescript
 * import {
 *   ModelProviderAdapter,
 *   ClaudeAdapter,
 *   OpenAIAdapter,
 *   createModelAdapter
 * } from './adapters/index.js';
 *
 * const adapter = createModelAdapter('claude', { apiKey: '...' });
 * ```
 */

// Model Provider Adapter interface and types
export type {
  ModelProviderAdapter,
  Message,
  ModelOptions,
  ModelResponse,
  Tool,
  TokenUsage
} from './ModelProviderAdapter.js';

// Skill Adapter interface and types
export type {
  SkillAdapter,
  SkillContext,
  SkillResult,
  ValidationResult
} from './SkillAdapter.js';

// Concrete adapter implementations
export { ClaudeAdapter } from './ClaudeAdapter.js';
export { OpenAIAdapter } from './OpenAIAdapter.js';
export { KimiAdapter } from './KimiAdapter.js';
export { QwenAdapter } from './QwenAdapter.js';

// Factory functions
export {
  createModelAdapter,
  getAvailableAdapters,
  hasAdapter,
  type AdapterOptions
} from './AdapterFactory.js';
