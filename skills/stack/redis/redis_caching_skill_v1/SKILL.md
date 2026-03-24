---
name: redis_caching_skill_v1
description: Redis caching strategies, data structures, pub/sub messaging, and performance optimization for high-throughput applications
version: 1.0.0
tags: [redis, caching, pubsub, database, nosql, performance, session]
stack: redis/7
category: stack
triggers:
  keywords: [redis, cache, pubsub, session, rate limit, redis cluster, redis streams]
  filePatterns: [*.ts, *.js, docker-compose.yml, redis.conf]
  commands: [redis-cli, redis-server, redis-benchmark]
  stack: redis/7
  projectArchetypes: [api-backend, realtime, saas, high-traffic]
  modes: [greenfield, optimization, scaling]
prerequisites:
  - node_18_runtime
  - database_basics
  - caching_concepts
recommended_structure:
  directories:
    - src/cache/
    - src/cache/services/
    - src/cache/keys/
    - src/pubsub/
    - src/workers/
workflow:
  setup:
    - docker run redis:7
    - npm install ioredis
    - Configure connection pool
    - Test connection
  develop:
    - Define cache key patterns
    - Implement cache-aside pattern
    - Set up pub/sub channels
    - Add cache invalidation
  deploy:
    - Configure Redis Cluster or Sentinel
    - Set up persistence (RDB/AOF)
    - Configure memory policies
    - Monitor with Redis Insights
best_practices:
  - Use meaningful key naming conventions (namespace:type:id)
  - Set appropriate TTL for all keys
  - Use appropriate data structures (hash, set, sorted set)
  - Implement cache-aside or write-through patterns
  - Use pipelines for batch operations
  - Implement circuit breaker for cache failures
  - Monitor memory usage and evictions
  - Use Redis Cluster for horizontal scaling
  - Implement proper error handling
  - Use connection pooling efficiently
anti_patterns:
  - Never use Redis as primary database without persistence strategy
  - Don't store large values (>1MB) without compression
  - Avoid KEYS command in production (use SCAN)
  - Don't skip TTL on temporary data
  - Avoid hot keys (single key with high traffic)
  - Don't ignore memory limits
  - Avoid complex operations on large data structures
  - Don't skip authentication in production
  - Never store sensitive data without encryption
  - Don't ignore replication lag in read replicas
scaling_notes: |
  For high-traffic Redis deployments:

  **Horizontal Scaling:**
  - Use Redis Cluster for sharding
  - Implement client-side sharding for simple setups
  - Use read replicas for read-heavy workloads
  - Consider Redis Enterprise for advanced features

  **Memory Management:**
  - Configure maxmemory policy (allkeys-lru, volatile-lru)
  - Monitor memory fragmentation
  - Use lazy eviction for consistent latency
  - Implement data expiration strategies

  **Performance:**
  - Use pipelines for batch operations
  - Implement connection pooling
  - Use Lua scripts for atomic operations
  - Enable lazy freeing for background deletion

  **High Availability:**
  - Use Redis Sentinel for automatic failover
  - Configure proper timeout values
  - Implement retry logic with backoff
  - Set up health checks

  **Persistence:**
  - Configure RDB snapshots for backups
  - Use AOF for durability requirements
  - Consider hybrid persistence (RDB+AOF)
  - Test restore procedures regularly

when_not_to_use: |
  Redis may not be the best choice for:

  **Complex Queries:**
  - Use PostgreSQL or Elasticsearch for complex queries
  - Redis is optimized for simple key-value lookups

  **Large Binary Data:**
  - Use S3 or object storage for large files
  - Redis is memory-based (expensive for large data)

  **Relational Data:**
  - Use RDBMS for complex relationships
  - Redis data structures are limited

  **Disk-Based Storage:**
  - Use traditional databases for disk-based needs
  - Redis is primarily in-memory

  **Full-Text Search:**
  - Use Elasticsearch or OpenSearch
  - Redis search is limited (RediSearch module)

output_template: |
  ## Redis Architecture Decision

  **Version:** Redis 7.x
  **Deployment:** Cluster with 3 masters + 3 replicas
  **Persistence:** RDB + AOF hybrid
  **Memory Policy:** allkeys-lru

  ### Key Decisions
  - **Caching:** Cache-aside pattern with TTL
  - **Sessions:** Redis with 24h expiry
  - **Rate Limiting:** Sliding window with Lua
  - **Pub/Sub:** Redis Streams for reliability

  ### Trade-offs Considered
  - Cluster vs Sentinel: Cluster for horizontal scaling
  - LRU vs LFU: LRU for access pattern
  - RDB vs AOF: Hybrid for balance

  ### Next Steps
  1. Set up Redis Cluster
  2. Implement cache layer
  3. Configure monitoring
  4. Set up backup procedures
  5. Test failover scenarios
dependencies:
  redis: ">=7"
  nodejs_packages:
    - ioredis: ^5.3 (Redis client)
    - redis: ^4.6 (Official client)
    - cache-manager: ^5.3 (Caching abstraction)
    - cache-manager-redis-yet: ^4.1 (Redis cache store)
  tools:
    - redis-cli (command-line client)
    - Redis Insights (GUI)
    - redis-benchmark (performance testing)
---

<role>
You are a Redis specialist with deep expertise in caching strategies, data structures, pub/sub messaging, and performance optimization. You provide structured guidance on implementing Redis solutions following industry best practices.
</role>

<execution_flow>
1. **Requirements Analysis**
   - Identify caching needs
   - Determine data access patterns
   - Assess consistency requirements
   - Plan capacity

2. **Data Model Design**
   - Design key naming conventions
   - Choose appropriate data structures
   - Plan TTL strategies
   - Design invalidation logic

3. **Implementation**
   - Set up Redis client
   - Implement cache operations
   - Add error handling
   - Configure connection pooling

4. **Optimization**
   - Implement pipelining
   - Add compression for large values
   - Configure memory policies
   - Set up monitoring

5. **High Availability**
   - Configure replication
   - Set up Sentinel or Cluster
   - Implement failover logic
   - Test recovery procedures

6. **Operations**
   - Set up backup procedures
   - Configure persistence
   - Monitor key metrics
   - Plan capacity growth
</execution_flow>

<key_naming_convention>
**Redis Key Naming Convention:**

```typescript
// Key naming pattern: {namespace}:{type}:{identifier}:{field}

// User-related keys
const UserKeys = {
  // Hash for user profile
  profile: (userId: string) => `user:${userId}:profile`,
  
  // Session storage
  session: (sessionId: string) => `session:${sessionId}`,
  userSessions: (userId: string) => `user:${userId}:sessions`,
  
  // Cache for user data
  cache: (userId: string) => `cache:user:${userId}`,
  
  // Rate limiting
  rateLimit: (userId: string, action: string) => 
    `ratelimit:${userId}:${action}`,
  
  // Lock for distributed locking
  lock: (resource: string) => `lock:${resource}`
};

// Product-related keys
const ProductKeys = {
  // Hash for product data
  detail: (productId: string) => `product:${productId}:detail`,
  
  // Sorted set for product ranking
  ranking: (category: string) => `product:ranking:${category}`,
  
  // Set for product tags
  tags: (productId: string) => `product:${productId}:tags`,
  
  // List for recent products
  recent: () => 'product:recent',
  
  // Cache for product list
  list: (filters: string) => `product:list:${filters}`
};

// Order-related keys
const OrderKeys = {
  // Hash for order data
  detail: (orderId: string) => `order:${orderId}:detail`,
  
  // Sorted set for user orders
  userOrders: (userId: string) => `user:${userId}:orders`,
  
  // Queue for order processing
  queue: () => 'order:processing:queue',
  
  // Stream for order events
  events: () => 'order:events:stream'
};

// Example usage with ioredis
import Redis from 'ioredis';

const redis = new Redis();

// Set user profile (hash)
await redis.hset(UserKeys.profile('123'), {
  name: 'John Doe',
  email: 'john@example.com',
  role: 'user'
});

// Get user profile
const profile = await redis.hgetall(UserKeys.profile('123'));

// Set with TTL
await redis.setex(
  ProductKeys.detail('456'),
  3600,  // 1 hour TTL
  JSON.stringify(productData)
);

// Increment counter with TTL
const key = UserKeys.rateLimit('123', 'login');
const count = await redis.incr(key);
if (count === 1) {
  await redis.expire(key, 300);  // 5 minutes
}
```
</key_naming_convention>

<cache_patterns>
**Redis Caching Patterns:**

```typescript
// 1. Cache-Aside Pattern (Lazy Loading)
class CacheAsideCache {
  private redis: Redis;
  
  async get<T>(key: string, fetchFn: () => Promise<T>, ttl: number = 3600): Promise<T> {
    // Try to get from cache
    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
    
    // Cache miss - fetch from source
    const data = await fetchFn();
    
    // Store in cache with TTL
    await this.redis.setex(key, ttl, JSON.stringify(data));
    
    return data;
  }
  
  async invalidate(key: string): Promise<void> {
    await this.redis.del(key);
  }
}

// Usage
const cache = new CacheAsideCache(redis);

const product = await cache.get(
  `product:${productId}`,
  async () => await db.products.findById(productId),
  3600  // 1 hour TTL
);

// 2. Write-Through Pattern
class WriteThroughCache {
  private redis: Redis;
  
  async set<T>(key: string, data: T, ttl: number = 3600): Promise<void> {
    // Write to cache
    await this.redis.setex(key, ttl, JSON.stringify(data));
    
    // Write to database (async, fire and forget or await)
    await this.persistToDatabase(data);
  }
  
  private async persistToDatabase(data: any): Promise<void> {
    // Implementation depends on your data store
  }
}

// 3. Cache-Invalidation Pattern
class CacheManager {
  private redis: Redis;
  
  // Invalidate related keys using pattern
  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.scanKeys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
  
  // Safe SCAN instead of KEYS
  private async scanKeys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = 0;
    
    do {
      const result = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = Number(result[0]);
      keys.push(...result[1]);
    } while (cursor !== 0);
    
    return keys;
  }
  
  // Tag-based invalidation
  async invalidateByTag(tag: string): Promise<void> {
    const key = `cache:tags:${tag}`;
    const members = await this.redis.smembers(key);
    
    if (members.length > 0) {
      await this.redis.del(...members);
      await this.redis.del(key);
    }
  }
  
  async addToTag(tag: string, key: string): Promise<void> {
    await this.redis.sadd(`cache:tags:${tag}`, key);
  }
}

// 4. Distributed Lock Pattern
class DistributedLock {
  private redis: Redis;
  
  async acquire(
    resource: string,
    ttl: number = 10000,
    retryInterval: number = 100,
    maxRetries: number = 10
  ): Promise<string | null> {
    const lockKey = `lock:${resource}`;
    const lockValue = `${Date.now()}:${Math.random()}`;
    
    for (let i = 0; i < maxRetries; i++) {
      const acquired = await this.redis.set(lockKey, lockValue, 'PX', ttl, 'NX');
      
      if (acquired) {
        return lockValue;
      }
      
      await this.sleep(retryInterval);
    }
    
    return null;
  }
  
  async release(resource: string, lockValue: string): Promise<boolean> {
    const lockKey = `lock:${resource}`;
    
    // Use Lua script for atomic check-and-delete
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    
    const result = await this.redis.eval(script, 1, lockKey, lockValue);
    return result === 1;
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage
const lock = new DistributedLock(redis);

const lockValue = await lock.acquire('order:123:process');
if (lockValue) {
  try {
    // Critical section
    await processOrder('123');
  } finally {
    await lock.release('order:123:process', lockValue);
  }
}

// 5. Rate Limiting Pattern (Sliding Window)
class RateLimiter {
  private redis: Redis;
  
  async isAllowed(
    userId: string,
    action: string,
    limit: number,
    windowMs: number
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const key = `ratelimit:${userId}:${action}`;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Use sorted set for sliding window
    const pipeline = this.redis.pipeline();
    
    // Remove old entries
    pipeline.zremrangebyscore(key, 0, windowStart);
    
    // Add current request
    pipeline.zadd(key, now, `${now}:${Math.random()}`);
    
    // Count requests in window
    pipeline.zcard(key);
    
    // Set TTL
    pipeline.expire(key, Math.ceil(windowMs / 1000));
    
    const results = await pipeline.exec();
    const count = results[2][1] as number;
    
    const allowed = count <= limit;
    const remaining = Math.max(0, limit - count);
    const resetAt = now + windowMs;
    
    return { allowed, remaining, resetAt };
  }
}

// Usage
const rateLimiter = new RateLimiter(redis);

const { allowed, remaining } = await rateLimiter.isAllowed(
  userId,
  'login',
  5,      // 5 attempts
  300000  // per 5 minutes
);

if (!allowed) {
  throw new Error('Rate limit exceeded');
}
```
</cache_patterns>

<data_structures>
**Redis Data Structures Usage:**

```typescript
// 1. String - Simple caching
await redis.set('counter', '0');
await redis.incr('counter');
const value = await redis.get('counter');

// 2. Hash - Object storage
await redis.hset('user:123', {
  name: 'John',
  email: 'john@example.com',
  age: '30'
});

const user = await redis.hgetall('user:123');
const email = await redis.hget('user:123', 'email');

// 3. List - Queue implementation
// Push to queue
await redis.rpush('queue:emails', JSON.stringify(emailJob));

// Process from queue
const job = await redis.blpop('queue:emails', 0);

// 4. Set - Unique items
await redis.sadd('product:123:tags', 'electronics', 'sale', 'new');
const tags = await redis.smembers('product:123:tags');

// Check membership
const isOnSale = await redis.sismember('product:123:tags', 'sale');

// 5. Sorted Set - Leaderboards, rankings
await redis.zadd('leaderboard:weekly', 100, 'user:1');
await redis.zadd('leaderboard:weekly', 85, 'user:2');
await redis.zadd('leaderboard:weekly', 92, 'user:3');

// Get top 10
const top10 = await redis.zrevrange('leaderboard:weekly', 0, 9, 'WITHSCORES');

// Get user rank
const rank = await redis.zrevrank('leaderboard:weekly', 'user:1');

// 6. Bitmap - Daily active users
// Mark user as active
await redis.setbit('dau:2024-03-24', userId, 1);

// Count active users
const dau = await redis.bitcount('dau:2024-03-24');

// 7. HyperLogLog - Unique visitor counting
await redis.pfadd('visitors:2024-03-24', userId);
const uniqueVisitors = await redis.pfcount('visitors:2024-03-24');

// 8. Streams - Event sourcing
await redis.xadd('order:events', '*', 
  'orderId', '123',
  'event', 'created',
  'timestamp', Date.now().toString()
);

// Read events
const events = await redis.xrange('order:events', '-', '+');

// Consumer group
await redis.xgroupCreate('order:events', 'order-processor', '0', true);
const results = await redis.xreadgroup('GROUP', 'order-processor', 'worker-1', 
  'COUNT', 10,
  'BLOCK', 5000,
  'STREAMS', 'order:events', '>'
);
```
</data_structures>
