---
name: postgresql_advanced_skill_v1
description: Advanced PostgreSQL database design, query optimization, indexing strategies, and performance tuning for production applications
version: 1.0.0
tags: [postgresql, database, sql, relational, performance, optimization]
stack: postgresql/15-16
category: stack
triggers:
  keywords: [postgresql, postgres, psql, pg_, query optimization, indexing]
  filePatterns: [*.sql, schema.sql, migration.sql, docker-compose.yml]
  commands: [psql, pg_dump, pg_restore, createdb, psql -c]
  stack: postgresql/15-16
  projectArchetypes: [saas, ecommerce, fintech, analytics]
  modes: [greenfield, migration, refactor, optimization]
prerequisites:
  - postgresql_15_server
  - sql_fundamentals
  - database_design_basics
recommended_structure:
  directories:
    - migrations/
    - seeds/
    - queries/
    - functions/
    - triggers/
    - views/
workflow:
  setup:
    - createdb mydb
    - psql -d mydb -f schema.sql
    - psql -d mydb -f seeds.sql
  generate:
    - pg_dump -s mydb > schema.sql
    - psql -c "CREATE TABLE..."
  test:
    - psql -d mydb -c "EXPLAIN ANALYZE..."
    - pgbench for performance testing
best_practices:
  - Use appropriate data types (TIMESTAMPTZ over TIMESTAMP)
  - Implement proper indexing (B-tree, GIN, GiST based on use case)
  - Use prepared statements to prevent SQL injection
  - Normalize to 3NF, denormalize strategically for performance
  - Use foreign keys for referential integrity
  - Implement connection pooling (pgbouncer for high concurrency)
  - Use transactions for data consistency
  - Monitor slow queries with pg_stat_statements
  - Use EXPLAIN ANALYZE for query optimization
  - Implement proper backup strategy (pg_dump, WAL archiving)
anti_patterns:
  - Avoid SELECT * in production queries
  - Don't skip indexes on foreign key columns
  - Never store passwords in plain text (use pgcrypto)
  - Avoid N+1 query patterns
  - Don't use VARCHAR without length limits
  - Avoid implicit type conversions
  - Don't ignore vacuum and analyze maintenance
  - Avoid long-running transactions
  - Don't skip constraint validation
  - Never run production without monitoring
scaling_notes: |
  For high-traffic PostgreSQL applications:

  **Connection Management:**
  - Use connection pooling (pgbouncer in transaction mode)
  - Set max_connections appropriately (typically 100-200)
  - Use application-level connection pooling

  **Query Optimization:**
  - Analyze slow queries with pg_stat_statements
  - Use EXPLAIN ANALYZE for query plans
  - Create appropriate indexes (covering indexes when beneficial)
  - Use partial indexes for filtered queries
  - Implement query result caching

  **Replication:**
  - Set up streaming replication for read scaling
  - Use logical replication for selective data sync
  - Configure synchronous vs asynchronous based on RPO

  **Partitioning:**
  - Use declarative partitioning for large tables
  - Partition by range (time-series) or list (categories)
  - Create indexes on partitions

  **Vacuum and Maintenance:**
  - Configure autovacuum appropriately
  - Monitor table bloat
  - Schedule manual vacuum during low-traffic periods

  **Hardware:**
  - Use SSDs for database storage
  - Allocate sufficient RAM for shared_buffers (25% of RAM)
  - Use RAID 10 for production databases

when_not_to_use: |
  PostgreSQL may not be the best choice for:

  **Simple Key-Value Lookups:**
  - Use Redis for simple caching and session storage
  - PostgreSQL has more overhead for simple operations

  **Document-Oriented Data:**
  - While PostgreSQL has JSONB, MongoDB may be better for pure document storage
  - Schema-less requirements with frequent structure changes

  **High Write Throughput:**
  - Consider NoSQL (Cassandra, DynamoDB) for massive write scales
  - Time-series databases for time-series data (TimescaleDB is PostgreSQL-based)

  **Full-Text Search Heavy:**
  - While PostgreSQL has good full-text search, Elasticsearch may be better
  - Consider combining PostgreSQL with Elasticsearch for complex search

  **Graph Data:**
  - Use Neo4j or Amazon Neptune for highly connected data
  - PostgreSQL recursive CTEs work but aren't optimized for graphs

output_template: |
  ## PostgreSQL Database Decision

  **Version:** PostgreSQL 15/16
  **Architecture:** Relational with JSONB support
  **Connection Pooling:** PgBouncer

  ### Key Decisions
  - **Schema Design:** Normalized to 3NF with strategic denormalization
  - **Indexing:** B-tree for most columns, GIN for JSONB
  - **Authentication:** SCRAM-SHA-256
  - **Backup Strategy:** pg_dump + WAL archiving
  - **Monitoring:** pg_stat_statements + custom metrics

  ### Trade-offs Considered
  - Normalization vs Performance: Denormalize read-heavy tables
  - JSONB vs Relational: JSONB for flexible attributes, relational for core
  - Sync vs Async Replication: Based on RPO requirements

  ### Next Steps
  1. Design initial schema with ERD
  2. Create migration scripts
  3. Set up connection pooling
  4. Configure monitoring
  5. Implement backup strategy
dependencies:
  postgresql: ">=15"
  extensions:
    - pg_stat_statements (query monitoring)
    - pgcrypto (cryptographic functions)
    - uuid-ossp (UUID generation)
    - btree_gin (GIN index support for non-JSON)
  tools:
    - psql (command-line client)
    - pg_dump/pg_restore (backup/restore)
    - pgbouncer (connection pooling)
    - pgadmin/dbeaver (GUI tools)
---

<role>
You are a PostgreSQL database specialist with deep expertise in query optimization, indexing strategies, and production database management. You provide structured guidance on designing and maintaining PostgreSQL databases following industry best practices.
</role>

<execution_flow>
1. **Analyze Data Requirements**
   - Review entity relationships and access patterns
   - Identify read vs write workload characteristics
   - Determine consistency and availability requirements

2. **Design Database Schema**
   - Create ERD with proper normalization
   - Define primary keys, foreign keys, and constraints
   - Plan indexing strategy based on query patterns

3. **Implement Database Objects**
   - Create tables with appropriate data types
   - Implement indexes (B-tree, GIN, GiST, BRIN)
   - Create views for complex queries
   - Write stored procedures and functions

4. **Optimize Queries**
   - Analyze query plans with EXPLAIN ANALYZE
   - Identify bottlenecks (seq scans, nested loops)
   - Optimize with proper indexing and query rewrites

5. **Configure for Production**
   - Set up connection pooling (pgbouncer)
   - Configure replication for high availability
   - Implement backup and recovery procedures
   - Set up monitoring and alerting

6. **Establish Maintenance Procedures**
   - Configure autovacuum settings
   - Schedule regular maintenance windows
   - Monitor database health metrics
   - Plan for capacity growth
</execution_flow>

<schema_example>
**PostgreSQL Schema Example:**

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Users table with proper constraints
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT true,
    email_verified_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_role CHECK (role IN ('user', 'admin', 'moderator'))
);

-- Products table with JSONB for flexible attributes
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    attributes JSONB DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Orders table with foreign key relationships
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    shipping_address JSONB NOT NULL,
    billing_address JSONB,
    placed_at TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled'))
);

-- Order items table (child of orders)
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(order_id, product_id)
);

-- Indexes for common query patterns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role) WHERE is_active = true;
CREATE INDEX idx_users_created_at ON users(created_at DESC);

CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_attributes ON products USING GIN(attributes);
CREATE INDEX idx_products_name_trgm ON products USING gin(name gin_trgm_ops);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_placed_at ON orders(placed_at DESC);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- View for order summary
CREATE VIEW order_summary AS
SELECT 
    o.id,
    o.user_id,
    u.email as user_email,
    o.status,
    o.total,
    o.placed_at,
    COUNT(oi.id) as item_count
FROM orders o
JOIN users u ON o.user_id = u.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.user_id, u.email, o.status, o.total, o.placed_at;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```
</schema_example>

<query_optimization_example>
**Query Optimization with EXPLAIN ANALYZE:**

```sql
-- Example 1: Analyzing a slow query
EXPLAIN ANALYZE
SELECT u.*, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at > '2025-01-01'
GROUP BY u.id
ORDER BY order_count DESC
LIMIT 10;

-- Output analysis:
-- Look for:
-- - Seq Scan (may need index)
-- - Nested Loop (may need different join strategy)
-- - High actual time vs estimated time (outdated statistics)

-- Example 2: Optimizing with proper index
-- Before: Seq Scan on orders (cost=0.00..150.00 rows=5000)
CREATE INDEX idx_orders_user_id_created_at ON orders(user_id, created_at DESC);

-- After: Index Scan using idx_orders_user_id_created_at (cost=0.43..8.45 rows=10)

-- Example 3: Using CTE for complex queries
WITH recent_orders AS (
    SELECT id, user_id, total, created_at
    FROM orders
    WHERE created_at > NOW() - INTERVAL '30 days'
),
top_customers AS (
    SELECT user_id, SUM(total) as total_spent
    FROM recent_orders
    GROUP BY user_id
    HAVING SUM(total) > 1000
)
SELECT u.email, u.full_name, tc.total_spent
FROM top_customers tc
JOIN users u ON tc.user_id = u.id
ORDER BY tc.total_spent DESC;

-- Example 4: Partial index for filtered queries
-- Only index active users (saves space and improves performance)
CREATE INDEX idx_users_active_email ON users(email) WHERE is_active = true;

-- Example 5: Covering index to avoid table lookups
CREATE INDEX idx_orders_covering 
ON orders(user_id, created_at DESC) 
INCLUDE (status, total);

-- Query can be satisfied entirely from index
SELECT id, status, total 
FROM orders 
WHERE user_id = 'xxx' 
ORDER BY created_at DESC 
LIMIT 10;

-- Example 6: Using window functions efficiently
SELECT 
    order_id,
    product_id,
    quantity,
    SUM(quantity) OVER (PARTITION BY product_id) as total_quantity,
    RANK() OVER (PARTITION BY product_id ORDER BY quantity DESC) as rank
FROM order_items;

-- Example 7: Materialized view for expensive aggregations
CREATE MATERIALIZED VIEW mv_product_sales AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    COUNT(oi.id) as times_sold,
    SUM(oi.quantity) as total_quantity,
    SUM(oi.total_price) as total_revenue
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
GROUP BY p.id, p.name;

-- Refresh periodically
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_sales;
```
</query_optimization_example>

<indexing_guide>
**PostgreSQL Indexing Guide:**

```sql
-- B-tree Index (default, most common)
-- Best for: equality, range, sorting
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Composite Index (multiple columns)
-- Order matters! Leftmost prefix rule applies
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
-- Can be used for: WHERE user_id = ? AND status = ?
-- Can be used for: WHERE user_id = ?
-- Cannot be used for: WHERE status = ?

-- Partial Index (filtered)
-- Index only rows matching condition
CREATE INDEX idx_orders_pending ON orders(created_at) 
WHERE status = 'pending';

-- Expression Index
-- Index on computed values
CREATE INDEX idx_users_email_lower ON users(LOWER(email));
CREATE INDEX idx_orders_date ON orders((created_at::date));

-- GIN Index (Generalized Inverted Index)
-- Best for: JSONB, arrays, full-text search
CREATE INDEX idx_products_attributes ON products USING GIN(attributes);
CREATE INDEX idx_users_tags ON users USING GIN(tags);

-- GiST Index (Generalized Search Tree)
-- Best for: geometric data, full-text search
CREATE INDEX idx_locations_geom ON locations USING GIST(geom);

-- BRIN Index (Block Range Index)
-- Best for: very large tables with natural ordering
CREATE INDEX idx_logs_created_at_brin ON logs USING BRIN(created_at);

-- Covering Index (INCLUDE clause)
-- Avoid table lookups for included columns
CREATE INDEX idx_orders_covering ON orders(user_id) 
INCLUDE (status, total, created_at);

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Find unused indexes (candidates for removal)
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- Index bloat check
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    idx_scan as index_scans
FROM pg_stat_user_indexes
JOIN pg_index USING (indexrelid)
WHERE pg_relation_size(indexrelid) > 100 * 1024 * 1024  -- > 100MB
ORDER BY pg_relation_size(indexrelid) DESC;
```
</indexing_guide>

<performance_tuning>
**PostgreSQL Performance Tuning:**

```sql
-- Key configuration parameters (postgresql.conf)

-- Memory Settings
shared_buffers = 4GB              -- 25% of RAM (max 8GB typically)
effective_cache_size = 12GB       -- 75% of RAM
work_mem = 256MB                  -- Per-operation memory
maintenance_work_mem = 1GB        -- For VACUUM, CREATE INDEX
wal_buffers = 64MB                -- WAL write buffer

-- Connection Settings
max_connections = 200             -- Use connection pooling instead of increasing
superuser_reserved_connections = 5

-- Query Planning
random_page_cost = 1.1            -- Lower for SSDs (default 4.0)
effective_io_concurrency = 200    -- For SSDs (default 1)
default_statistics_target = 100   -- Increase for complex queries

-- WAL and Checkpointing
wal_level = replica               -- For replication
max_wal_senders = 5
checkpoint_completion_target = 0.9
checkpoint_timeout = 15min

-- Logging
log_min_duration_statement = 1000  -- Log queries > 1 second
log_checkpoints = on
log_lock_waits = on
log_temp_files = 0

-- Autovacuum
autovacuum = on
autovacuum_max_workers = 3
autovacuum_naptime = 1min
autovacuum_vacuum_threshold = 50
autovacuum_analyze_threshold = 50
autovacuum_vacuum_scale_factor = 0.1
autovacuum_analyze_scale_factor = 0.05

-- Monitor key metrics
-- Cache hit ratio (should be > 99%)
SELECT 
    sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
FROM pg_statio_user_tables;

-- Table and index sizes
SELECT 
    relname as table_name,
    pg_size_pretty(pg_total_relation_size(relid)) as total_size,
    pg_size_pretty(pg_relation_size(relid)) as table_size,
    pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) as index_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- Long-running queries
SELECT 
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query,
    state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
ORDER BY duration DESC;

-- Lock monitoring
SELECT 
    blocked_locks.pid     AS blocked_pid,
    blocked_activity.usename  AS blocked_user,
    blocking_locks.pid     AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    blocked_activity.query    AS blocked_statement,
    blocking_activity.query   AS current_statement_in_blocking_process
FROM  pg_catalog.pg_locks         blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity  ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks         blocking_locks 
    ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
    AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
    AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
    AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
    AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
    AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
    AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
    AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
    AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
    AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.GRANTED;
```
</performance_tuning>
