# Class Hierarchy

This document details the class inheritance and composition relationships in ez-agents v6.0.0.

## Agent Classes

All agent classes implement the `IAgent` interface:

```typescript
interface IAgent {
  getName(): string;
  getDescription(): string;
  execute(context: AgentContext): Promise<AgentResult>;
  validate?(result: AgentResult): Promise<boolean>;
}
```

### Inheritance Diagram

```
IAgent (interface)
    │
    ├─→ EzPlannerAgent
    ├─→ EzRoadmapperAgent
    ├─→ EzExecutorAgent
    ├─→ EzPhaseResearcherAgent
    ├─→ EzProjectResearcherAgent
    └─→ EzVerifierAgent
```

### Agent Registry

Agents are registered with `AgentFactoryRegistry` singleton:

```typescript
AgentFactoryRegistry
├── registerAgent(name, factory)
├── createAgent(name)
├── hasAgent(name)
└── getRegisteredTypes()
```

**Registered Agent Types:**
- `ez-planner` → EzPlannerAgent
- `ez-roadmapper` → EzRoadmapperAgent
- `ez-executor` → EzExecutorAgent
- `ez-phase-researcher` → EzPhaseResearcherAgent
- `ez-project-researcher` → EzProjectResearcherAgent
- `ez-verifier` → EzVerifierAgent

## Strategy Classes

All compression strategies implement the `CompressionStrategy` interface:

```typescript
interface CompressionStrategy {
  getName(): string;
  compress(content: string, options: CompressionOptions): Promise<CompressionResult>;
}
```

### Inheritance Diagram

```
CompressionStrategy (interface)
    │
    ├─→ SummarizeStrategy
    ├─→ TruncateStrategy
    ├─→ RankByRelevanceStrategy
    └─→ HybridStrategy
         └─→ (composes above strategies)
```

### Strategy Details

**SummarizeStrategy:**
- AI-powered summarization
- Preserves code blocks
- Best for: Technical content

**TruncateStrategy:**
- Fast, deterministic
- Truncates at word boundaries
- Best for: Quick reduction

**RankByRelevanceStrategy:**
- Keyword-based scoring
- Filters low-relevance content
- Best for: Large context sets

**HybridStrategy:**
- Combines all strategies
- Configurable pipeline
- Best for: Maximum compression

## Adapter Classes

All model provider adapters implement the `ModelProviderAdapter` interface:

```typescript
interface ModelProviderAdapter {
  getName(): string;
  chat(messages: Message[], options: ModelOptions): Promise<ModelResponse>;
  supportsTools(): boolean;
  getMaxTokens(): number;
}
```

### Inheritance Diagram

```
ModelProviderAdapter (interface)
    │
    ├─→ ClaudeAdapter
    ├─→ OpenAIAdapter
    ├─→ KimiAdapter
    └─→ QwenAdapter
```

### Adapter Details

**ClaudeAdapter:**
- Provider: Anthropic
- Context: 100K tokens
- Tools: Yes (Claude Tools API)

**OpenAIAdapter:**
- Provider: OpenAI
- Context: 128K tokens
- Tools: Yes (function calling)

**KimiAdapter:**
- Provider: Moonshot
- Context: 128K tokens
- Tools: No

**QwenAdapter:**
- Provider: Alibaba DashScope
- Context: 32K tokens
- Tools: Yes (function calling)

## Observer Classes

### EventBus (Singleton)

```typescript
EventBus
├── on<T extends keyof EventMap>(event: T, handler: EventHandler<T>)
├── off<T extends keyof EventMap>(event: T, handler: EventHandler<T>)
├── emit<T extends keyof EventMap>(event: T, data: EventMap[T])
├── once<T extends keyof EventMap>(event: T, handler: EventHandler<T>)
└── clear(event?)
```

### SessionObserver

```typescript
SessionObserver
├── onSessionStart(data)
├── onSessionStop(data)
├── onSessionActivity(data)
├── getActiveSessions()
└── getSessionHistory()
```

### PhaseObserver

```typescript
PhaseObserver
├── onPhaseStart(data)
├── onPhaseComplete(data)
├── onPhaseSkip(data)
├── getPhaseStats()
└── getPhaseHistory()
```

## Facade Classes

### ContextManagerFacade

```typescript
ContextManagerFacade
├── gather(sources, options)
├── compress(content, strategy?)
├── deduplicate(content)
├── score(content, query)
├── getCached(key)
├── setCached(key, content)
├── setCompressionStrategy(strategy)
├── enableScoring(enable)
├── enableDeduplication(enable)
├── getCompressionStats()
├── getCacheStats()
└── getDedupStats()
```

### SkillResolverFacade

```typescript
SkillResolverFacade
├── resolveSkill(trigger)
├── matchSkill(query)
├── validateSkill(skill)
├── getSkillContext(skillName)
├── registerSkill(skill)
├── unregisterSkill(name)
├── executeSkill(name, input)
├── executeSkills(names, input)
├── getRegisteredSkills()
├── setSkillPriority(names)
└── enableSkillValidation(enable)
```

## Supporting Classes

### Context Management

```
ContextManager
├── ContextCache
├── ContextCompressor
├── ContextDeduplicator
├── ContextMetadataTracker
└── ContextRelevanceScorer
```

### Session Management

```
SessionManager
└── SessionChain
```

### Error Handling

```
ErrorCache
CrashRecovery
RecoveryManager
BackupService
```

### Quality Gates

```
QualityGate
└── GateDefinition
```

## Decorator Usage

Decorators are applied to classes for cross-cutting concerns:

```typescript
@LogExecution()
@CacheResult()
@ValidateInput()
class ExampleClass {
  // Class implementation
}
```

**Available Decorators:**
- `@LogExecution(options)` - Logs method execution
- `@CacheResult(options)` - Caches method results
- `@ValidateInput(options)` - Validates method inputs

See [DECORATORS.md](../bin/lib/decorators/DECORATORS.md) for detailed usage.
