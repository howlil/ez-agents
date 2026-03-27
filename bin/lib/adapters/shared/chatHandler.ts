/**
 * Chat Handler
 *
 * Pure function factory for handling chat requests.
 * Shared across all model provider adapters.
 *
 * @example
 * ```typescript
 * const chatHandler = createChatHandler({
 *   providerName: 'claude',
 *   modelName: 'claude-sonnet-4-20250514',
 *   apiKey: 'sk-...',
 *   buildRequestBody: buildClaudeRequest,
 *   buildRequestOptions: buildClaudeOptions,
 *   parseResponse: parseClaudeResponse
 * });
 *
 * const response = await chatHandler(messages, { temperature: 0.7 });
 * ```
 */

import { adapterLogger, createTraceContext, type TraceContext } from '../../logger/index.js';
import { httpsRequest } from './httpsRequest.js';
import type {
  Message,
  ModelOptions,
  ModelResponse,
  HttpsRequestOptions
} from '../ModelProviderAdapter.js';

/**
 * Dependencies for chat handler
 */
export interface ChatHandlerDeps {
  providerName: string;
  modelName: string;
  apiKey: string;
  buildRequestBody: (messages: Message[], options: ModelOptions) => Record<string, unknown>;
  buildRequestOptions: (trace: TraceContext) => HttpsRequestOptions;
  parseResponse: (response: Record<string, unknown>) => ModelResponse;
}

/**
 * Create chat handler
 *
 * @param deps - Provider-specific dependencies
 * @returns Chat handler function
 */
export function createChatHandler(deps: ChatHandlerDeps) {
  return async function chat(
    messages: Message[],
    options: ModelOptions = {}
  ): Promise<ModelResponse> {
    const trace = createTraceContext();
    const logger = adapterLogger.withTrace(trace.traceId);

    logger.debug(`${deps.providerName} chat request`, {
      model: deps.modelName,
      messageCount: messages.length,
      hasTools: !!options.tools,
      traceId: trace.traceId
    });

    const requestBody = deps.buildRequestBody(messages, options);
    const requestOptions = deps.buildRequestOptions(trace);
    const response = await httpsRequest(requestOptions, requestBody);
    return deps.parseResponse(response);
  };
}

export default createChatHandler;
