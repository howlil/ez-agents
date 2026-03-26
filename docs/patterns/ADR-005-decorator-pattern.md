# ADR-005: Decorator Pattern for Cross-Cutting Concerns

**Status:** Accepted  
**Date:** 2026-03-26  
**Milestone:** v6.0.0 OOP Refactoring

## Context

The ez-agents codebase has several cross-cutting concerns that apply to many methods:

1. **Logging** - Track method execution for debugging
2. **Caching** - Cache results of expensive operations
3. **Validation** - Validate method inputs before execution

### Problem Statement

Implementing these concerns in each method creates duplication:

```typescript
// Before: Cross-cutting concerns duplicated in every method
class ContextManager {
  async gather(sources: string[]) {
    // Logging
    const startTime = Date.now();
    console.log(`[ContextManager.gather] sources: ${sources.length}`);
    
    // Validation
    if (!sources || sources.length === 0) {
      throw new Error('Sources required');
    }
    
    // Check cache
    const cacheKey = this.getCacheKey(sources);
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      console.log(`[ContextManager.gather] cache hit`);
      return cached;
    }
    
    // Business logic
    const result = await this.doGather(sources);
    
    // Save cache
    await this.cache.set(cacheKey, result);
    
    // Log completion
    console.log(`[ContextManager.gather] completed in ${Date.now() - startTime}ms`);
    
    return result;
  }
}
```

This approach violates DRY and makes methods harder to read.

## Decision

We adopted the **Decorator Pattern** using TypeScript decorators:

```typescript
// After: Decorators for cross-cutting concerns
class ContextManager {
  @LogExecution()
  @CacheResult()
  @ValidateInput({ required: ['sources'] })
  async gather(sources: string[]) {
    // Only business logic remains
    return await this.doGather(sources);
  }
}
```

### Implementation

**Decorator Types:**

```typescript
type MethodDecorator = (
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) => PropertyDescriptor;
```

**LogExecution Decorator:**
```typescript
export function LogExecution(options?: LogExecutionOptions): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;
    
    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      console.log(`[${className}.${propertyKey}] start`);
      
      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;
        console.log(`[${className}.${propertyKey}] completed in ${duration}ms`);
        return result;
      } catch (error) {
        console.error(`[${className}.${propertyKey}] error:`, error);
        throw error;
      }
    };
    
    return descriptor;
  };
}
```

**CacheResult Decorator:**
```typescript
export function CacheResult(options?: CacheResultOptions): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value;
    const cache = new Map<string, any>();
    
    descriptor.value = async function (...args: any[]) {
      const cacheKey = options?.keyGenerator 
        ? options.keyGenerator(args)
        : JSON.stringify(args);
      
      // Check cache
      const cached = cache.get(cacheKey);
      if (cached && !options?.forceRefresh) {
        return cached;
      }
      
      // Execute and cache
      const result = await originalMethod.apply(this, args);
      cache.set(cacheKey, result);
      
      return result;
    };
    
    return descriptor;
  };
}
```

**ValidateInput Decorator:**
```typescript
export function ValidateInput(options: ValidateInputOptions): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      // Validate required parameters
      if (options.required) {
        for (const param of options.required) {
          const index = options.paramNames?.indexOf(param) ?? 0;
          if (args[index] === undefined || args[index] === null) {
            throw new Error(`Parameter '${param}' is required`);
          }
        }
      }
      
      // Validate types
      if (options.types) {
        for (const [param, type] of Object.entries(options.types)) {
          const index = options.paramNames?.indexOf(param) ?? 0;
          if (typeof args[index] !== type) {
            throw new Error(`Parameter '${param}' must be of type ${type}`);
          }
        }
      }
      
      return await originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}
```

**Decorator Composition:**
```typescript
class SkillResolver {
  @LogExecution()
  @CacheResult({ ttl: 300000 }) // 5 minute cache
  @ValidateInput({ 
    required: ['trigger'],
    types: { trigger: 'string' }
  })
  async resolveSkill(trigger: string): Promise<SkillResolutionResult> {
    // Only business logic
    return await this.doResolveSkill(trigger);
  }
}
```

## Consequences

### Benefits

1. **DRY Principle:** Cross-cutting concerns implemented once
2. **Separation of Concerns:** Business logic separate from infrastructure
3. **Composability:** Multiple decorators can be combined
4. **Reusability:** Decorators can be applied to any method
5. **Readability:** Methods focus on business logic

### Trade-offs

1. **TypeScript Complexity:** Decorators require experimental features
2. **Debugging:** Stack traces include decorator frames
3. **Performance:** Small overhead from wrapper functions
4. **Implicit Behavior:** Decorators may not be obvious from method signature

### When NOT to Use

- Simple applications without cross-cutting concerns
- When decorators add more complexity than they solve
- Performance-critical code where overhead matters

## Alternatives Considered

### Higher-Order Functions
```typescript
function withLogging(fn: Function) {
  return async function (...args: any[]) {
    console.log('start');
    const result = await fn(...args);
    console.log('end');
    return result;
  };
}

const gather = withLogging(this.doGather.bind(this));
```
**Rejected because:** Less ergonomic; harder to compose multiple concerns

### Wrapper Classes
```typescript
class LoggingContextManager extends ContextManager {
  async gather(sources: string[]) {
    console.log('start');
    const result = await super.gather(sources);
    console.log('end');
    return result;
  }
}
```
**Rejected because:** Creates class explosion; doesn't compose well

### Aspect-Oriented Programming (AOP)
```typescript
// Using AOP framework
@Aspect()
class LoggingAspect {
  @Before('execution(* ContextManager.*(..))')
  logStart() { console.log('start'); }
}
```
**Rejected because:** Adds external dependency; overkill for our needs

## Implementation Details

### Decorator Order

Decorators execute bottom-to-top:

```typescript
@LogExecution()      // Executes last (outer wrapper)
@CacheResult()       // Executes second
@ValidateInput()     // Executes first (inner wrapper)
async method() {}
```

Execution order:
1. ValidateInput checks parameters
2. CacheResult checks cache
3. LogExecution logs start time
4. Original method executes
5. LogExecution logs duration
6. CacheResult saves result
7. ValidateInput (no post-processing)

### Cache Invalidation

```typescript
// Clear specific cache entry
clearCache('ContextManager', 'gather', cacheKey);

// Clear all cache for method
clearCache('ContextManager', 'gather');

// Clear all caches
clearAllCache();
```

### Usage Statistics

```typescript
// Get cache stats
const stats = getCacheStats();
console.log(`Cache hits: ${stats.hits}, misses: ${stats.misses}`);

// Get execution stats
const logStats = getLogStats();
console.log(`Methods logged: ${logStats.count}`);
```

## Related Patterns

- **Facade Pattern:** Facades use decorators on all methods (ADR-006)
- **Observer Pattern:** LogExecution decorator emits events (ADR-003)

## References

- [Decorator Pattern - Wikipedia](https://en.wikipedia.org/wiki/Decorator_pattern)
- [TypeScript Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html)
- Internal: [bin/lib/decorators/](../../bin/lib/decorators/)
