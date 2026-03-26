# Architecture Overview

**Version:** 6.0.0 (OOP Refactoring Complete)

This document provides a high-level overview of the ez-agents architecture, which has been refactored to use object-oriented programming patterns for improved maintainability, extensibility, and code organization.

## Introduction

ez-agents is a meta-prompting framework that orchestrates AI agents for spec-driven development. The v6.0.0 refactoring transformed the codebase from functional programming patterns to a comprehensive object-oriented architecture using six key design patterns:

1. **Factory Pattern** - Agent creation with runtime extensibility
2. **Strategy Pattern** - Interchangeable compression algorithms
3. **Observer Pattern** - Event-driven architecture for session/phase lifecycle
4. **Adapter Pattern** - Unified interface for multiple model providers
5. **Decorator Pattern** - Cross-cutting concerns (logging, caching, validation)
6. **Facade Pattern** - Simplified interfaces for complex subsystems

## Class Hierarchy

The codebase is organized around a clear class hierarchy:

### Agent Classes (via Factory Pattern)

Six specialized agent types are created through the `AgentFactoryRegistry`:

- **EzPlannerAgent** - Plans phase execution and requirements
- **EzRoadmapperAgent** - Creates and maintains project roadmaps
- **EzExecutorAgent** - Executes planned tasks
- **EzPhaseResearcherAgent** - Researches phase-specific context
- **EzProjectResearcherAgent** - Researches project-wide context
- **EzVerifierAgent** - Verifies completed work against requirements

All agents implement the `IAgent` interface with methods: `getName()`, `getDescription()`, `execute()`, and `validate()`.

### Strategy Classes (Compression)

Four interchangeable compression strategies implement the `CompressionStrategy` interface:

- **SummarizeStrategy** - AI-powered summarization with code block preservation
- **TruncateStrategy** - Fast, deterministic truncation at word boundaries
- **RankByRelevanceStrategy** - Keyword-based relevance scoring and filtering
- **HybridStrategy** - Combined approach (ranking → summarization → truncation)

### Adapter Classes (Model Providers)

Four model provider adapters implement the `ModelProviderAdapter` interface:

- **ClaudeAdapter** - Anthropic Claude API (100K context, Tools support)
- **OpenAIAdapter** - OpenAI API (128K context, function calling)
- **KimiAdapter** - Moonshot Kimi API (128K context)
- **QwenAdapter** - Alibaba DashScope API (32K context, function calling)

### Observer Classes

Three observer classes monitor system events:

- **EventBus** - Singleton event bus for type-safe event handling
- **SessionObserver** - Tracks session lifecycle and history
- **PhaseObserver** - Tracks phase lifecycle and statistics

## Component Relationships

The architecture uses facades to orchestrate complex subsystems:

### ContextManagerFacade

Orchestrates context gathering, compression, scoring, and deduplication:

```
ContextManagerFacade
├── ContextCache (caching layer)
├── ContextCompressor (strategy pattern)
│   ├── SummarizeStrategy
│   ├── TruncateStrategy
│   ├── RankByRelevanceStrategy
│   └── HybridStrategy
├── ContextRelevanceScorer (keyword scoring)
└── ContextDeduplicator (hash-based deduplication)
```

### SkillResolverFacade

Orchestrates skill matching, validation, and execution:

```
SkillResolverFacade
├── SkillMatcher (trigger matching)
├── SkillValidator (schema validation)
├── SkillContextResolver (context schema resolution)
└── SkillRegistry (skill registration)
```

## Data Flow

The typical data flow through the system:

1. **Request** → User initiates agent execution
2. **Facade** → ContextManagerFacade gathers and optimizes context
3. **Strategy** → CompressionStrategy reduces context to token budget
4. **Adapter** → ModelProviderAdapter sends request to AI model
5. **Result** → Response processed and session state updated

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌─────────────┐
│   Request   │ ──→ │  Facade     │ ──→ │  Strategy   │ ──→ │   Adapter   │
│  (User)     │     │ (Orchestrate)│     │ (Compress)  │     │  (Provider) │
└─────────────┘     └──────────────┘     └─────────────┘     └─────────────┘
                           │
                           ↓
                    ┌──────────────┐
                    │   Observer   │
                    │  (Events)    │
                    └──────────────┘
```

## Event-Driven Architecture

The Observer pattern enables decoupled event handling throughout the system:

### Event Types (12 total)

**Session Events:**
- `session:start` - Session initialization
- `session:stop` - Session termination
- `session:activity` - Session activity tracking

**Phase Events:**
- `phase:start` - Phase execution begins
- `phase:complete` - Phase execution finishes
- `phase:skip` - Phase skipped (optional)

**Skill Events:**
- `skill:trigger` - Skill trigger evaluation
- `skill:match` - Skill matched to query
- `skill:execute` - Skill execution

**Context Events:**
- `context:gather` - Context gathering
- `context:compress` - Context compression
- `context:score` - Context relevance scoring

### Event Flow

```
Component Action → EventBus.emit() → Registered Observers → Handler Execution
                       ↓
                Type-safe EventMap
                       ↓
                Async Handler Support
```

## Key Design Decisions

### Why OOP for ez-agents?

1. **Encapsulation** - State and behavior bundled together
2. **Inheritance** - Shared base classes reduce duplication
3. **Polymorphism** - Interchangeable strategies and adapters
4. **Extensibility** - Runtime registration of new agents/skills

### What Stayed Functional?

Pure transformations and utility functions remain functional:
- Path normalization utilities
- Git helper functions
- Frontmatter parsing
- Configuration loading

## Related Documentation

- [Class Hierarchy](./CLASS-HIERARCHY.md) - Detailed inheritance diagrams
- [Components](./COMPONENTS.md) - Component interaction details
- [Events](./EVENTS.md) - Event system reference
- [Design Patterns](../patterns/README.md) - ADR-style pattern documentation
- [API Documentation](../api/) - Generated TypeDoc API reference
