# Redis Caching Skill Versions

## v1.0.0 (2026-03-24)

**Initial Release**

**Added:**
- Redis 7.x data structures and commands
- Caching patterns (cache-aside, write-through, invalidation)
- Key naming conventions
- Distributed locking implementation
- Rate limiting with sliding window
- Pub/Sub messaging patterns
- Redis Streams for event sourcing
- Connection pooling with ioredis
- Redis Cluster configuration
- Memory management and eviction policies

**Best Practices Included:**
- SCAN instead of KEYS command
- Pipeline for batch operations
- TTL management for all keys
- Appropriate data structure selection
- Circuit breaker for cache failures
- Compression for large values
- Authentication and security

**Use Cases Covered:**
- Session management
- API response caching
- Rate limiting
- Distributed locking
- Leaderboards/rankings
- Real-time analytics
- Queue implementation
- Pub/Sub messaging

**Migration Guide:**
- N/A (initial release)
