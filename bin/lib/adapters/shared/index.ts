/**
 * Shared Adapter Utilities
 *
 * Barrel export for shared adapter helpers.
 * These pure functions reduce code duplication across provider adapters.
 */

export { httpsRequest } from './httpsRequest.js';
export { createChatHandler, type ChatHandlerDeps } from './chatHandler.js';
export { extractTokenUsage, extractTokenUsageWithPath, type TokenMappings } from './tokenExtractor.js';
