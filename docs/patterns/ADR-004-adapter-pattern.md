# ADR-004: Adapter Pattern for Model Providers

**Status:** Accepted  
**Date:** 2026-03-26  
**Milestone:** v6.0.0 OOP Refactoring

## Context

ez-agents supports multiple AI model providers, each with different APIs:

1. Anthropic Claude (Tools API)
2. OpenAI (function calling)
3. Moonshot Kimi (chat completion)
4. Alibaba Qwen (DashScope API)

### Problem Statement

Direct coupling to provider-specific APIs makes it difficult to swap providers:

```typescript
// Before: Provider-specific code
async function callClaude(messages: Message[]) {
  const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    messages,
    max_tokens: 4000
  });
  return response.content[0].text;
}

async function callOpenAI(messages: Message[]) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages,
    max_tokens: 4000
  });
  return response.choices[0].message.content;
}
```

This approach creates duplication and makes provider switching complex.

## Decision

We adopted the **Adapter Pattern** to provide a unified interface for all model providers:

```typescript
// After: Adapter-based provider access
import { createModelAdapter } from './adapters/index.js';

const adapter = createModelAdapter('claude');
const response = await adapter.chat(messages, { maxTokens: 4000 });
console.log(response.content);
```

### Implementation

**ModelProviderAdapter Interface:**
```typescript
interface ModelProviderAdapter {
  getName(): string;
  chat(messages: Message[], options: ModelOptions): Promise<ModelResponse>;
  supportsTools(): boolean;
  getMaxTokens(): number;
}
```

**Message and Response Types:**
```typescript
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: ToolCall[];
}

interface ModelResponse {
  content: string;
  usage: TokenUsage;
  toolCalls?: ToolCall[];
  finishReason: string;
}

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}
```

**Concrete Adapters:**

```typescript
class ClaudeAdapter implements ModelProviderAdapter {
  getName(): string { return 'claude'; }
  
  async chat(messages: Message[], options: ModelOptions): Promise<ModelResponse> {
    const response = await anthropic.messages.create({
      model: options.model || 'claude-3-sonnet-20240229',
      messages: this.toClaudeMessages(messages),
      max_tokens: options.maxTokens || 4000,
      tools: options.tools?.map(this.toClaudeTool)
    });
    
    return {
      content: response.content[0].text,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens
      },
      finishReason: response.stop_reason
    };
  }
  
  supportsTools(): boolean { return true; }
  getMaxTokens(): number { return 100000; }
}

class OpenAIAdapter implements ModelProviderAdapter {
  getName(): string { return 'openai'; }
  
  async chat(messages: Message[], options: ModelOptions): Promise<ModelResponse> {
    const response = await openai.chat.completions.create({
      model: options.model || 'gpt-4-turbo',
      messages: this.toOpenAIMessages(messages),
      max_tokens: options.maxTokens || 4000,
      tools: options.tools?.map(this.toOpenAITool)
    });
    
    return {
      content: response.choices[0].message.content,
      usage: response.usage,
      finishReason: response.choices[0].finish_reason
    };
  }
  
  supportsTools(): boolean { return true; }
  getMaxTokens(): number { return 128000; }
}

class KimiAdapter implements ModelProviderAdapter {
  getName(): string { return 'kimi'; }
  
  async chat(messages: Message[], options: ModelOptions): Promise<ModelResponse> {
    // Kimi API implementation
    return { content, usage, finishReason };
  }
  
  supportsTools(): boolean { return false; }
  getMaxTokens(): number { return 128000; }
}

class QwenAdapter implements ModelProviderAdapter {
  getName(): string { return 'qwen'; }
  
  async chat(messages: Message[], options: ModelOptions): Promise<ModelResponse> {
    // Alibaba DashScope API implementation
    return { content, usage, finishReason };
  }
  
  supportsTools(): boolean { return true; }
  getMaxTokens(): number { return 32000; }
}
```

**Adapter Factory:**
```typescript
export function createModelAdapter(
  provider: string,
  options?: AdapterOptions
): ModelProviderAdapter {
  switch (provider) {
    case 'claude':
      return new ClaudeAdapter(options);
    case 'openai':
      return new OpenAIAdapter(options);
    case 'kimi':
      return new KimiAdapter(options);
    case 'qwen':
      return new QwenAdapter(options);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

export function getAvailableAdapters(): string[] {
  return ['claude', 'openai', 'kimi', 'qwen'];
}
```

## Consequences

### Benefits

1. **Provider Interchangeability:** Swap providers without changing client code
2. **Unified Interface:** Consistent API across all providers
3. **Testability:** Adapters can be mocked for unit testing
4. **Extensibility:** New providers can be added without modifying existing code
5. **Encapsulation:** Provider-specific logic is isolated in adapters

### Trade-offs

1. **Adapter Maintenance:** Each provider API change requires adapter update
2. **Lowest Common Denominator:** Interface must work for all providers
3. **Abstraction Leakage:** Some provider-specific details may leak through

### When NOT to Use

- Only one provider is needed
- Provider-specific features are required (use adapter + extension)
- Performance overhead of abstraction is unacceptable

## Alternatives Considered

### Abstract Base Class
```typescript
abstract class BaseModelProvider {
  abstract chat(messages: Message[]): Promise<ModelResponse>;
  abstract supportsTools(): boolean;
}
```
**Rejected because:** Composition over inheritance; interfaces are more flexible

### Configuration-Based
```typescript
function chat(provider: string, messages: Message[]) {
  if (provider === 'claude') { /* ... */ }
  else if (provider === 'openai') { /* ... */ }
}
```
**Rejected because:** Violates Open/Closed Principle; hard to extend

## Implementation Details

### Provider Comparison

| Provider | Context | Tools | Max Output |
|----------|---------|-------|------------|
| Claude | 100K | Yes | 4096 |
| OpenAI | 128K | Yes | 4096 |
| Kimi | 128K | No | 4096 |
| Qwen | 32K | Yes | 2048 |

### Usage Example

```typescript
import { createModelAdapter } from './adapters/index.js';

// Create adapter for provider
const adapter = createModelAdapter('claude', {
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Check capabilities
if (adapter.supportsTools()) {
  console.log('Tools supported');
}

// Send chat request
const response = await adapter.chat([
  { role: 'user', content: 'Hello!' }
], {
  maxTokens: 4000,
  temperature: 0.7
});

console.log(`Response: ${response.content}`);
console.log(`Tokens used: ${response.usage.totalTokens}`);
```

## Related Patterns

- **Factory Pattern:** Adapter factory creates adapter instances (ADR-001)
- **Strategy Pattern:** Adapters can be used as strategies (ADR-002)

## References

- [Adapter Pattern - Wikipedia](https://en.wikipedia.org/wiki/Adapter_pattern)
- Internal: [bin/lib/adapters/ModelProviderAdapter.ts](../../bin/lib/adapters/ModelProviderAdapter.ts)
