# MongoDB Skill Versions

## v1.0.0 (2026-03-24)

**Initial Release**

**Added:**
- MongoDB 6/7 support with WiredTiger storage engine
- Document schema design with Mongoose ODM
- Embed vs reference relationship patterns
- Aggregation pipeline ($match, $lookup, $unwind, $group, $facet)
- Indexing strategies (compound, multikey, text, TTL, geospatial, hashed)
- Replica set configuration for high availability
- Sharding guidance for horizontal scaling
- Backup and recovery procedures

**Best Practices Included:**
- Query-first schema design
- ESR rule for compound indexes
- Schema validation with Mongoose
- Connection pooling
- Write concern and read concern configuration
- TTL indexes for time-series data
- Profiler for slow query monitoring

**Scaling Guidance:**
- Replica set deployment (3-node minimum)
- Sharding strategies and shard key selection
- Memory management and WiredTiger cache
- Horizontal scaling patterns
- Monitoring and alerting setup

**Migration Guide:**
- N/A (initial release)
