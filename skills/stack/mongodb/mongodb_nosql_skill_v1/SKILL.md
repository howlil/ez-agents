---
name: mongodb_nosql_skill_v1
description: MongoDB NoSQL database design, aggregation pipeline, indexing strategies, and horizontal scaling for document-based applications
version: 1.0.0
tags: [mongodb, nosql, database, document, aggregation, scaling]
stack: mongodb/6-7
category: stack
triggers:
  keywords: [mongodb, mongo, nosql, document, aggregation, replica set, sharding]
  filePatterns: [*.js, *.ts, docker-compose.yml, package.json]
  commands: [mongosh, mongoimport, mongoexport, mongodump, mongorestore]
  stack: mongodb/6-7
  projectArchetypes: [content-platform, analytics, iot, catalog]
  modes: [greenfield, migration, refactor, scaling]
prerequisites:
  - mongodb_6_server
  - javascript_fundamentals
  - database_design_basics
recommended_structure:
  directories:
    - src/models/
    - src/schemas/
    - migrations/
    - seeds/
    - queries/
    - aggregations/
workflow:
  setup:
    - mongod --config mongod.conf
    - mongosh mongodb://localhost:27017/mydb
    - mongoimport --db mydb --collection users --file users.json
  generate:
    - mongosh --eval "db.createCollection('products')"
    - Use Mongoose schemas for validation
  test:
    - mongosh --eval "db.collection.explain().find(...)"
    - mongoimport for test data
best_practices:
  - Design schema based on query patterns (query-first design)
  - Embed documents for one-to-few relationships
  - Reference documents for one-to-many or many-to-many
  - Use appropriate data types (ObjectId, Date, Decimal128)
  - Create indexes on frequently queried fields
  - Use compound indexes for multi-field queries
  - Implement schema validation at application level
  - Use aggregation pipeline for complex queries
  - Monitor slow queries with database profiler
  - Implement proper backup strategy (mongodump, Ops Manager)
anti_patterns:
  - Avoid unbounded arrays (can grow indefinitely)
  - Don't create documents larger than 16MB limit
  - Never skip indexes on frequently queried fields
  - Avoid deep nesting (max 3-4 levels)
  - Don't use MongoDB as a key-value store only
  - Avoid large binary files (use GridFS or object storage)
  - Don't ignore schema validation
  - Avoid $where and $function in production queries
  - Don't skip write concern for critical operations
  - Never run without authentication in production
scaling_notes: |
  For high-traffic MongoDB applications:

  **Replica Sets:**
  - Deploy minimum 3 nodes for high availability
  - Use odd number of voting members
  - Configure read preferences (primary, secondary, nearest)
  - Set appropriate write concern (majority for critical data)

  **Sharding:**
  - Shard when dataset exceeds RAM or write throughput needed
  - Choose shard key carefully (high cardinality, low frequency)
  - Use hashed shard keys for even distribution
  - Use ranged shard keys for range queries
  - Monitor chunk distribution and balance

  **Indexing:**
  - Create indexes for all query patterns
  - Use compound indexes efficiently (ESR rule)
  - Implement TTL indexes for time-series data
  - Use text indexes for search functionality
  - Monitor index usage and remove unused indexes

  **Memory Management:**
  - Allocate sufficient RAM for working set
  - Configure WiredTiger cache size appropriately
  - Use SSDs for better I/O performance
  - Monitor page faults and memory usage

  **Query Optimization:**
  - Use projection to limit returned fields
  - Use hint() to force index usage when needed
  - Analyze query plans with explain()
  - Implement query result caching

  **Operations:**
  - Use connection pooling in applications
  - Implement proper error handling and retries
  - Monitor oplog size for replication lag
  - Schedule maintenance windows for updates

when_not_to_use: |
  MongoDB may not be the best choice for:

  **Complex Transactions:**
  - While MongoDB supports transactions, RDBMS is better
  - Multi-document transactions have performance overhead

  **Highly Relational Data:**
  - Many-to-many relationships with complex joins
  - Use PostgreSQL or other RDBMS instead

  **ACID Requirements:**
  - Financial systems requiring strict ACID compliance
  - Traditional RDBMS provides stronger guarantees

  **Complex Analytical Queries:**
  - Data warehousing and complex OLAP queries
  - Use dedicated data warehouse (Snowflake, Redshift)

  **Full-Text Search Heavy:**
  - While MongoDB has text search, Elasticsearch is better
  - Consider combining MongoDB with Elasticsearch

  **Graph Data:**
  - Highly connected data with complex relationships
  - Use Neo4j or other graph databases

output_template: |
  ## MongoDB Database Decision

  **Version:** MongoDB 6/7
  **Storage Engine:** WiredTiger
  **Deployment:** Replica Set (3 nodes minimum)

  ### Key Decisions
  - **Schema Design:** Embedded documents for read patterns
  - **Indexing:** Compound indexes following ESR rule
  - **Read Concern:** local for reads, majority for critical reads
  - **Write Concern:** majority for writes
  - **Backup Strategy:** mongodump + oplog backup

  ### Trade-offs Considered
  - Embed vs Reference: Based on access patterns
  - Consistency vs Availability: Tuned per operation
  - Manual vs Hashed Sharding: Based on query patterns

  ### Next Steps
  1. Design document schemas based on queries
  2. Set up replica set for production
  3. Create indexes for query patterns
  4. Configure monitoring and alerts
  5. Implement backup strategy
dependencies:
  mongodb: ">=6"
  nodejs_packages:
    - mongodb: ^6.3 (official driver)
    - mongoose: ^8.0 (ODM with schema validation)
  tools:
    - mongosh (shell)
    - mongodump/mongorestore (backup)
    - mongoimport/mongoexport (data import/export)
    - MongoDB Compass (GUI)
---

<role>
You are a MongoDB database specialist with deep expertise in document modeling, aggregation pipeline, and horizontal scaling. You provide structured guidance on designing and maintaining MongoDB databases following industry best practices.
</role>

<execution_flow>
1. **Analyze Data Requirements**
   - Review document relationships and access patterns
   - Identify read vs write workload characteristics
   - Determine consistency and scalability requirements

2. **Design Document Schema**
   - Model documents based on query patterns
   - Decide embed vs reference for relationships
   - Define schema validation rules

3. **Implement Collections**
   - Create collections with validation
   - Design indexes (single, compound, text, TTL)
   - Set up TTL indexes for time-series data

4. **Optimize Queries**
   - Analyze query plans with explain()
   - Create appropriate indexes
   - Optimize aggregation pipelines

5. **Configure for Production**
   - Set up replica set for high availability
   - Configure sharding for horizontal scaling
   - Implement backup and recovery procedures
   - Set up monitoring and alerting

6. **Establish Maintenance Procedures**
   - Monitor database health metrics
   - Plan for capacity growth
   - Schedule maintenance windows
   - Implement data lifecycle management
</execution_flow>

<schema_example>
**MongoDB Schema Design Example:**

```javascript
// Using Mongoose for schema validation

const mongoose = require('mongoose');
const { Schema } = mongoose;

// User schema with embedded profile
const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
  },
  passwordHash: {
    type: String,
    required: true,
    select: false  // Don't return by default
  },
  profile: {
    firstName: String,
    lastName: String,
    avatar: String,
    bio: String
  },
  roles: [{
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: Date,
  preferences: {
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    language: { type: String, default: 'en' },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    }
  }
}, {
  timestamps: true,  // Adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ 'profile.lastName': 1, 'profile.firstName': 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('profile.fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Product schema with embedded variants
const productSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: String,
  basePrice: {
    type: mongoose.Types.Decimal128,
    required: true
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category'
  },
  // Embed for one-to-few (variants are part of product)
  variants: [{
    sku: String,
    size: String,
    color: String,
    price: mongoose.Types.Decimal128,
    stock: Number,
    images: [String]
  }],
  // Reference for one-to-many (reviews are separate entities)
  reviews: [{
    type: Schema.Types.ObjectId,
    ref: 'Review'
  }],
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: Schema.Types.Mixed  // Flexible attributes
}, {
  timestamps: true
});

// Indexes for common queries
productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ name: 'text', description: 'text' });  // Text search
productSchema.index({ 'variants.sku': 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ tags: 1 });

// Order schema with embedded items (snapshot of product at order time)
const orderSchema = new Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
    index: true
  },
  // Embed order items (they shouldn't change if product changes)
  items: [{
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: String,  // Snapshot
    variant: {
      sku: String,
      size: String,
      color: String
    },
    quantity: {
      type: Number,
      min: 1,
      required: true
    },
    unitPrice: mongoose.Types.Decimal128,
    totalPrice: mongoose.Types.Decimal128
  }],
  pricing: {
    subtotal: mongoose.Types.Decimal128,
    tax: mongoose.Types.Decimal128,
    shipping: mongoose.Types.Decimal128,
    discount: mongoose.Types.Decimal128,
    total: mongoose.Types.Decimal128
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  billingAddress: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'paypal', 'bank_transfer']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },
  timeline: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: String
  }]
}, {
  timestamps: true
});

// Indexes for order queries
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

// Compound index for admin order queries
orderSchema.index({ status: 1, paymentStatus: 1, createdAt: -1 });

// TTL index for cart expiration (auto-delete after 30 days)
const cartSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    unique: true
  },
  items: [{
    product: Schema.Types.ObjectId,
    variant: String,
    quantity: Number,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)  // 30 days
  }
});

cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Models
const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);
const Cart = mongoose.model('Cart', cartSchema);

module.exports = { User, Product, Order, Cart };
```
</schema_example>

<aggregation_example>
**MongoDB Aggregation Pipeline Example:**

```javascript
// Example 1: Sales analytics with aggregation
db.orders.aggregate([
  // Match: Filter by date range and status
  {
    $match: {
      createdAt: {
        $gte: new Date('2025-01-01'),
        $lt: new Date('2025-02-01')
      },
      status: { $in: ['delivered', 'shipped'] }
    }
  },
  
  // Unwind: Deconstruct items array
  {
    $unwind: '$items'
  },
  
  // Lookup: Join with products collection
  {
    $lookup: {
      from: 'products',
      localField: 'items.product',
      foreignField: '_id',
      as: 'product'
    }
  },
  
  // Unwind: Deconstruct product array (from lookup)
  {
    $unwind: '$product'
  },
  
  // Add fields: Calculate line totals
  {
    $addFields: {
      lineTotal: {
        $multiply: ['$items.quantity', '$items.unitPrice']
      }
    }
  },
  
  // Group: Aggregate by product
  {
    $group: {
      _id: '$product._id',
      productName: { $first: '$product.name' },
      category: { $first: '$product.category' },
      totalQuantity: { $sum: '$items.quantity' },
      totalRevenue: { $sum: '$lineTotal' },
      orderCount: { $sum: 1 }
    }
  },
  
  // Sort: By revenue descending
  {
    $sort: { totalRevenue: -1 }
  },
  
  // Limit: Top 10 products
  {
    $limit: 10
  },
  
  // Project: Format output
  {
    $project: {
      _id: 0,
      productId: '$_id',
      productName: 1,
      category: 1,
      totalQuantity: 1,
      totalRevenue: {
        $round: ['$totalRevenue', 2]
      },
      orderCount: 1
    }
  }
]);

// Example 2: User activity dashboard
db.users.aggregate([
  // Match active users
  {
    $match: { isActive: true }
  },
  
  // Lookup: Get user's orders
  {
    $lookup: {
      from: 'orders',
      let: { userId: '$_id' },
      pipeline: [
        {
          $match: {
            $expr: { $eq: ['$user', '$$userId'] },
            status: 'delivered'
          }
        }
      ],
      as: 'orders'
    }
  },
  
  // Add fields: Calculate user metrics
  {
    $addFields: {
      totalOrders: { $size: '$orders' },
      totalSpent: {
        $sum: '$orders.pricing.total'
      },
      lastOrderDate: {
        $max: '$orders.createdAt'
      }
    }
  },
  
  // Facet: Multiple aggregations in one query
  {
    $facet: {
      summary: [
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            avgOrdersPerUser: { $avg: '$totalOrders' },
            avgSpentPerUser: { $avg: '$totalSpent' }
          }
        }
      ],
      topCustomers: [
        { $sort: { totalSpent: -1 } },
        { $limit: 5 },
        {
          $project: {
            _id: 0,
            email: 1,
            profile: 1,
            totalOrders: 1,
            totalSpent: 1
          }
        }
      ],
      byRegistrationMonth: [
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            newUsers: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
      ]
    }
  }
]);

// Example 3: Product inventory analysis
db.products.aggregate([
  // Unwind variants
  { $unwind: '$variants' },
  
  // Add fields: Calculate variant value
  {
    $addFields: {
      variantValue: {
        $multiply: ['$variants.stock', '$variants.price']
      }
    }
  },
  
  // Group by category
  {
    $group: {
      _id: '$category',
      totalProducts: { $addToSet: '$_id' },
      totalVariants: { $sum: 1 },
      totalStock: { $sum: '$variants.stock' },
      totalValue: { $sum: '$variantValue' },
      avgPrice: { $avg: '$variants.price' },
      lowStockVariants: {
        $sum: {
          $cond: [{ $lt: ['$variants.stock', 10] }, 1, 0]
        }
      }
    }
  },
  
  // Convert set to count
  {
    $addFields: {
      totalProducts: { $size: '$totalProducts' }
    }
  },
  
  // Sort by total value
  { $sort: { totalValue: -1 } }
]);

// Example 4: Full-text search with scoring
db.products.aggregate([
  // Search stage (requires text index)
  {
    $search: {
      text: {
        query: 'wireless headphones',
        path: ['name', 'description', 'tags']
      }
    }
  },
  
  // Add search score
  {
    $addFields: {
      searchScore: { $meta: 'searchScore' }
    }
  },
  
  // Filter active products only
  {
    $match: { isActive: true }
  },
  
  // Sort by relevance score
  {
    $sort: { searchScore: -1 }
  },
  
  // Limit results
  { $limit: 20 }
]);

// Example 5: Time-series analysis (monthly trends)
db.orders.aggregate([
  // Match delivered orders
  {
    $match: {
      status: 'delivered',
      createdAt: { $gte: new Date('2025-01-01') }
    }
  },
  
  // Group by month
  {
    $group: {
      _id: {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' }
      },
      totalOrders: { $sum: 1 },
      totalRevenue: { $sum: '$pricing.total' },
      avgOrderValue: { $avg: '$pricing.total' },
      uniqueCustomers: { $addToSet: '$user' }
    }
  },
  
  // Add customer count
  {
    $addFields: {
      uniqueCustomerCount: { $size: '$uniqueCustomers' }
    }
  },
  
  // Sort chronologically
  {
    $sort: { '_id.year': 1, '_id.month': 1 }
  },
  
  // Add window functions for trends
  {
    $addFields: {
      prevMonthRevenue: {
        $shift: {
          output: '$totalRevenue',
          by: -1,
          default: 0
        }
      },
      growthRate: {
        $cond: [
          { $eq: [{ $shift: { output: '$totalRevenue', by: -1 } }, 0] },
          0,
          {
            $divide: [
              { $subtract: ['$totalRevenue', { $shift: { output: '$totalRevenue', by: -1 } }] },
              { $shift: { output: '$totalRevenue', by: -1 } }
            ]
          }
        ]
      }
    }
  }
]);
```
</aggregation_example>

<indexing_guide>
**MongoDB Indexing Guide:**

```javascript
// Single Field Index
db.users.createIndex({ email: 1 });  // Ascending
db.orders.createIndex({ createdAt: -1 });  // Descending

// Compound Index (order matters!)
// ESR Rule: Equality, Sort, Range
db.orders.createIndex({ status: 1, createdAt: -1, total: -1 });
// Can be used for: WHERE status = ? ORDER BY createdAt DESC

// Multikey Index (array fields)
db.products.createIndex({ tags: 1 });
db.products.createIndex({ 'variants.sku': 1 });

// Text Index (full-text search)
db.products.createIndex({ name: 'text', description: 'text', tags: 'text' });

// TTL Index (auto-expire documents)
db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
db.logs.createIndex({ timestamp: 1 }, { expireAfterSeconds: 86400 });  // 24 hours

// Geospatial Index
db.locations.createIndex({ location: '2dsphere' });
db.stores.createIndex({ coordinates: '2d' });

// Hashed Index (for sharding)
db.users.createIndex({ email: 'hashed' });

// Partial Index (filtered)
db.users.createIndex(
  { email: 1 },
  { partialFilterExpression: { isActive: true } }
);

// Sparse Index (only documents with field)
db.users.createIndex({ phone: 1 }, { sparse: true });

// Unique Index
db.users.createIndex({ email: 1 }, { unique: true });

// Covering Index (include fields)
db.orders.createIndex(
  { userId: 1, createdAt: -1 },
  { include: ['status', 'total'] }
);

// Analyze index usage
db.orders.aggregate([
  { $indexStats: {} }
]);

// Find queries not using indexes (slow queries)
db.setProfile(1, { slowms: 1000 });  // Log queries > 1 second
db.system.profile.find().sort({ ts: -1 }).limit(10);

// Explain query execution
db.orders.find({ status: 'pending', userId: '123' })
  .explain('executionStats');

// Output includes:
// - winningPlan: The query plan chosen
// - executionStats: Actual execution metrics
// - totalDocsExamined vs nReturned (should be close)
// - executionTimeMillis

// Drop unused index
db.orders.dropIndex('status_1');

// List all indexes
db.orders.getIndexes();
```
</indexing_guide>

<replica_set_setup>
**MongoDB Replica Set Setup:**

```yaml
# docker-compose.yml for 3-node replica set
version: '3.8'
services:
  mongo1:
    image: mongo:7
    container_name: mongo1
    command: mongod --replSet rs0 --bind_ip_all
    ports:
      - "27017:27017"
    volumes:
      - mongo1_data:/data/db
    networks:
      - mongo-network

  mongo2:
    image: mongo:7
    container_name: mongo2
    command: mongod --replSet rs0 --bind_ip_all
    ports:
      - "27018:27017"
    volumes:
      - mongo2_data:/data/db
    networks:
      - mongo-network

  mongo3:
    image: mongo:7
    container_name: mongo3
    command: mongod --replSet rs0 --bind_ip_all
    ports:
      - "27019:27017"
    volumes:
      - mongo3_data:/data/db
    networks:
      - mongo-network

volumes:
  mongo1_data:
  mongo2_data:
  mongo3_data:

networks:
  mongo-network:
    driver: bridge
```

```javascript
// Initialize replica set (run in mongosh)
rs.initiate({
  _id: 'rs0',
  members: [
    { _id: 0, host: 'mongo1:27017', priority: 2 },
    { _id: 1, host: 'mongo2:27017', priority: 1 },
    { _id: 2, host: 'mongo3:27017', priority: 1 }
  ]
});

// Check replica set status
rs.status();

// Check replication info
rs.printReplicationInfo();
rs.printSecondaryReplicationInfo();

// Connection string with replica set
// mongodb://mongo1:27017,mongo2:27018,mongo3:27019/mydb?replicaSet=rs0

// Read preference options:
// - primary (default): Read from primary only
// - primaryPreferred: Read from primary, fallback to secondary
// - secondary: Read from secondary only
// - secondaryPreferred: Read from secondary, fallback to primary
// - nearest: Read from nearest member

// Write concern options:
// - w: 1 (acknowledged by primary)
// - w: 'majority' (acknowledged by majority)
// - w: 3 (acknowledged by 3 nodes)
// - j: true (journal write)
// - wtimeout: 5000 (timeout in ms)

// Example with read/write concern
db.orders.insertOne(
  { orderNumber: 'ORD-001', total: 100 },
  { 
    writeConcern: { w: 'majority', j: true, wtimeout: 5000 },
    readConcern: { level: 'majority' }
  }
);
```
</replica_set_setup>
