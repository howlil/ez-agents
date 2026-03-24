---
name: Multi-Layer Caching Strategy
description: CDN, application, and database caching - high-read, low-write systems
version: 1.0.0
tags: [caching, architecture, performance, scalability]
category: architecture
triggers:
  keywords: [caching, performance, scalability, cdn, redis, memcached]
  projectArchetypes: [content-platform, high-traffic-web, read-heavy-app]
  constraints: [high-read-ratio, low-write-ratio, performance-critical]
prerequisites:
  - http_caching_basics
  - redis_basics
  - cache_patterns_basics
recommended_structure:
  directories:
    - src/Cache
    - src/Cache/Drivers
    - src/Cache/Middleware
    - src/Cache/Strategies
    - infrastructure/cache
    - infrastructure/cdn
workflow:
  setup:
    - Identify cache candidates (read-heavy data)
    - Select cache layers (CDN, application, database)
    - Configure cache invalidation strategies
  generate:
    - Implement cache-aside pattern for reads
    - Add write-through/write-behind for writes
    - Configure TTL with jitter
  test:
    - Load test cache hit rates
    - Test cache invalidation scenarios
    - Verify cache stampede prevention
best_practices:
  - Multi-layer: CDN → Application → Database
  - Cache-aside pattern for read-heavy workloads
  - Write-through for consistency-critical data
  - Implement cache invalidation strategies
  - Use TTL with jitter to prevent stampedes
anti_patterns:
  - Cache Stampede - all cache entries expire simultaneously
  - Stale Data - no invalidation on updates
  - Over-caching - caching data that changes frequently
  - Cache Everything - caching without measuring hit rates
scaling_notes: |
  Redis Cluster for distributed caching:

  1. **Cache Layer Scaling**:
     - Redis Cluster for horizontal scaling
     - Consistent hashing for key distribution
     - Read replicas for read-heavy workloads

  2. **Cache Warming**:
     - Pre-populate cache for predictable traffic
     - Background jobs for popular items
     - Progressive loading on cache miss

  3. **Memory Management**:
     - LRU eviction policy
     - Memory limit per cache tier
     - Monitor memory usage and eviction rates

  4. **When to Consider Alternatives**:
     - Write-heavy systems → Database optimization
     - Real-time data needs → Direct database queries
     - Systems with frequent stale data issues → Shorter TTL or no cache
when_not_to_use: |
  Multi-layer caching may not be suitable for:

  1. **Write-Heavy Systems**:
     - Cache invalidation overhead exceeds benefits
     - Data changes faster than cache TTL

  2. **Real-Time Data Requirements**:
     - Financial data needing millisecond accuracy
     - Live inventory with strict consistency

  3. **Systems Where Stale Data Causes Business Issues**:
     - Medical records
     - Financial transactions
     - Legal documents

  4. **Low Traffic Applications**:
     - Database can handle load without cache
     - Cache complexity not justified

  5. **Small Datasets**:
     - Entire dataset fits in database memory
     - Cache adds unnecessary complexity
output_template: |
  ## Multi-Layer Caching Strategy Decision

  **Pattern:** Multi-Layer Caching
  **Version:** 1.0.0
  **Rationale:** [Why multi-layer caching was chosen]

  **Cache Layers:**
  - CDN Layer: [Cloudflare, Akamai, CloudFront]
  - Application Layer: [Redis, Memcached]
  - Database Layer: [Query cache, buffer pool]

  **Caching Strategy:**
  - Read Pattern: [Cache-aside, Read-through]
  - Write Pattern: [Write-through, Write-behind, Write-around]
  - Invalidation: [TTL, Event-based, Manual]

  **Cache Configuration:**
  - Default TTL: [Duration]
  - Max Memory: [Size per node]
  - Eviction Policy: [LRU, LFU, FIFO]

  **Key Cache Candidates:**
  - Data 1: [Name, TTL, invalidation trigger]
  - Data 2: [Name, TTL, invalidation trigger]

  **Monitoring:**
  - Hit Rate Target: [Percentage]
  - Memory Usage Alert: [Threshold]
  - Eviction Rate Alert: [Threshold]
dependencies:
  - http_caching_basics
  - redis_basics
  - cache_patterns_basics
  - monitoring_basics
---

<role>
You are an expert in caching strategies with deep experience in high-performance systems, CDN configuration, and cache invalidation patterns.
You help teams design multi-layer caching architectures, implement cache patterns, and prevent common caching pitfalls.
</role>

<execution_flow>
## Step 1: Cache Candidate Identification
- Analyze read/write ratios for data entities
- Identify expensive queries suitable for caching
- Classify data by consistency requirements
- Estimate cache size requirements

## Step 2: Cache Layer Design
- Design CDN layer for static assets
- Configure application cache (Redis/Memcached)
- Set up database query caching
- Define cache key naming conventions

## Step 3: Cache Pattern Implementation
- Implement cache-aside for read-heavy data
- Add write-through for consistency-critical data
- Configure cache warming strategies
- Set up cache invalidation triggers

## Step 4: Stampede Prevention
- Add TTL jitter to prevent simultaneous expiration
- Implement cache locking for concurrent requests
- Use probabilistic early expiration
- Configure request coalescing

## Step 5: Monitoring and Operations
- Monitor cache hit rates per layer
- Track memory usage and eviction
- Alert on low hit rates or high eviction
- Document cache recovery procedures

## Step 6: Performance Validation
- Load test with and without cache
- Measure cache warming time
- Validate failover behavior
- Document performance benchmarks
</execution_flow>

<best_practices_detail>
### Multi-Layer Cache Architecture

```
┌─────────────────────────────────────────────────┐
│                  User Request                    │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│              CDN Layer (Cloudflare)              │
│  - Static assets (CSS, JS, images)               │
│  - HTML caching for anonymous users              │
│  - Edge caching for global distribution          │
│  TTL: 1 hour - 1 year                            │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│         Application Cache (Redis Cluster)        │
│  - User sessions                                 │
│  - API responses                                 │
│  - Expensive query results                       │
│  - Computed aggregations                         │
│  TTL: 1 minute - 24 hours                        │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│        Database Cache (MySQL Buffer Pool)        │
│  - Index pages                                   │
│  - Query result cache                            │
│  - Prepared statement cache                      │
│  TTL: Until eviction                             │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│                  Primary Storage                 │
│              (Database, File System)             │
└─────────────────────────────────────────────────┘
```

### Cache-Aside Pattern

```php
class ProductService
{
    public function __construct(
        private ProductRepository $repo,
        private CacheInterface $cache
    ) {}

    public function getProduct(int $id): ?Product
    {
        $cacheKey = "product:{$id}";
        
        // Try cache first
        $product = $this->cache->get($cacheKey);
        if ($product !== null) {
            return $product;
        }
        
        // Cache miss - load from database
        $product = $this->repo->find($id);
        
        if ($product !== null) {
            // Store in cache with TTL + jitter
            $ttl = 3600 + random_int(-300, 300); // 1 hour ± 5 min
            $this->cache->set($cacheKey, $product, $ttl);
        }
        
        return $product;
    }
    
    public function updateProduct(int $id, array $data): void
    {
        // Update database
        $this->repo->update($id, $data);
        
        // Invalidate cache
        $this->cache->delete("product:{$id}");
    }
}
```

### TTL with Jitter (Prevent Stampede)

```php
class CacheService
{
    public function setWithJitter(
        string $key,
        mixed $value,
        int $baseTTL
    ): void {
        // Add ±10% jitter to prevent stampede
        $jitter = (int) ($baseTTL * 0.1);
        $ttl = $baseTTL + random_int(-$jitter, $jitter);
        
        $this->cache->set($key, $value, max(60, $ttl));
    }
    
    // Probabilistic early expiration
    public function getWithEarlyExpiration(string $key): mixed
    {
        $item = $this->cache->get($key);
        
        if ($item === null) {
            return null;
        }
        
        // 10% chance to refresh before expiration
        if (random_int(1, 100) <= 10) {
            $this->refreshAsync($key);
        }
        
        return $item->value;
    }
    
    private function refreshAsync(string $key): void
    {
        // Refresh in background (non-blocking)
        dispatch(new RefreshCacheJob($key));
    }
}
```

### Cache Invalidation Strategies

```php
// Strategy 1: Time-based invalidation (TTL)
'cache' => [
    'default_ttl' => 3600, // 1 hour
    'ttls' => [
        'product:*' => 3600,
        'user:*' => 1800,
        'config:*' => 86400, // 24 hours
    ]
]

// Strategy 2: Event-based invalidation
class ProductUpdatedListener
{
    public function handle(ProductUpdated $event): void
    {
        // Invalidate specific key
        Cache::delete("product:{$event->productId}");
        
        // Invalidate related keys
        Cache::forget("product_list:all");
        Cache::tags(['products'])->flush();
    }
}

// Strategy 3: Version-based invalidation
class VersionedCache
{
    public function get(string $key, Closure $loader): mixed
    {
        $version = $this->getVersion($key);
        $versionedKey = "{$key}:v{$version}";
        
        $value = Cache::get($versionedKey);
        if ($value === null) {
            $value = $loader();
            Cache::set($versionedKey, $value, 3600);
        }
        
        return $value;
    }
    
    public function invalidate(string $key): void
    {
        // Increment version (old keys naturally expire)
        $this->incrementVersion($key);
    }
}
```

### Cache Stampede Prevention

```php
class StampedePrevention
{
    public function getWithLock(string $key, Closure $loader, int $ttl): mixed
    {
        // Try cache first
        $value = Cache::get($key);
        if ($value !== null) {
            return $value;
        }
        
        // Acquire lock for cache rebuild
        $lockKey = "lock:{$key}";
        $lock = Cache::lock($lockKey, 10); // 10 second lock
        
        if ($lock->get()) {
            try {
                // Double-check after acquiring lock
                $value = Cache::get($key);
                if ($value !== null) {
                    return $value;
                }
                
                // Load and cache
                $value = $loader();
                Cache::set($key, $value, $ttl);
                
                return $value;
            } finally {
                $lock->release();
            }
        }
        
        // Wait for lock and retry
        usleep(100000); // Wait 100ms
        return $this->getWithLock($key, $loader, $ttl);
    }
}
```
</best_practices_detail>

<anti_patterns_detail>
### Cache Stampede

**Problem:** All cache entries expire simultaneously

```
BAD: Fixed TTL causes thundering herd
- 10,000 products cached with exactly 1 hour TTL
- All cached at 12:00:00
- All expire at 13:00:00
- Next request triggers 10,000 database queries simultaneously
→ Database overload, slow responses

GOOD: TTL with jitter
- 10,000 products cached with 1 hour ± 5 min TTL
- Expiration spread between 12:55 and 13:05
- Gradual cache refresh
→ Stable database load
```

### Stale Data

**Problem:** No invalidation on updates

```php
// BAD: Cache never invalidated
class UserService
{
    public function updateProfile(int $id, array $data): void
    {
        // Update database
        DB::table('users')->where('id', $id)->update($data);
        
        // Cache not invalidated!
        // Next read returns stale data from cache
    }
}

// GOOD: Invalidate on update
class UserService
{
    public function updateProfile(int $id, array $data): void
    {
        DB::transaction(function () use ($id, $data) {
            DB::table('users')->where('id', $id)->update($data);
            
            // Invalidate cache
            Cache::delete("user:{$id}");
            Cache::tags(["user:{$id}"])->flush();
        });
    }
}
```

### Over-Caching

**Problem:** Caching data that changes frequently

```php
// BAD: Caching frequently changing data
class InventoryService
{
    public function getStock(int $productId): int
    {
        // Stock changes every minute - cache always stale
        return Cache::remember(
            "stock:{$productId}",
            3600, // 1 hour TTL
            fn() => $this->loadStock($productId)
        );
    }
}

// GOOD: Don't cache or use very short TTL
class InventoryService
{
    public function getStock(int $productId): int
    {
        // Real-time stock levels - no cache or very short TTL
        return Cache::remember(
            "stock:{$productId}",
            30, // 30 seconds
            fn() => $this->loadStock($productId)
        );
    }
}
```

### Cache Everything

**Problem:** Caching without measuring hit rates

```
BAD: Cache all the things
- 1000 different cache keys
- 50% never accessed again
- Memory wasted on cold data
- Cache eviction pushes out hot data

GOOD: Measure and optimize
- Monitor cache hit rates
- Identify cold cache keys
- Remove or reduce TTL for low-hit-rate keys
- Focus cache on high-traffic data
```
</anti_patterns_detail>
