---
name: graphql_apollo_skill_v1
description: GraphQL API design with Apollo Server, schema-first development, resolvers, and efficient data loading patterns
version: 1.0.0
tags: [graphql, apollo, api, schema, resolvers, federation]
stack: graphql/apollo-4
category: stack
triggers:
  keywords: [graphql, apollo, schema, resolver, query, mutation, subscription, federation]
  filePatterns: [*.graphql, schema.graphql, apollo.config.js]
  commands: [apollo-server, graphql-codegen, apollo federation]
  stack: graphql/apollo-4
  projectArchetypes: [api-backend, microservices, saas, mobile-backend]
  modes: [greenfield, migration, optimization]
prerequisites:
  - node_18_runtime
  - rest_api_fundamentals
  - database_basics
recommended_structure:
  directories:
    - src/
    - src/schema/
    - src/resolvers/
    - src/datasources/
    - src/middleware/
    - src/utils/
    - src/generated/
workflow:
  setup:
    - npm install @apollo/server graphql
    - Create schema.graphql
    - Implement resolvers
    - Start Apollo Server
  develop:
    - Define GraphQL types
    - Write resolvers
    - Add data sources
    - Implement authentication
  deploy:
    - Build and optimize
    - Set up caching
    - Configure rate limiting
    - Deploy to cloud
best_practices:
  - Use schema-first or code-first approach consistently
  - Implement proper error handling with Apollo errors
  - Use DataLoader for N+1 query prevention
  - Add authentication and authorization middleware
  - Implement query complexity analysis
  - Use fragments for efficient client queries
  - Add proper input validation
  - Implement rate limiting and depth limiting
  - Use persisted queries for production
  - Add comprehensive logging and monitoring
anti_patterns:
  - Avoid deep nesting in queries (max 3-4 levels)
  - Don't expose internal data structures directly
  - Never skip input validation
  - Avoid circular type references
  - Don't return large lists without pagination
  - Avoid resolver logic that's too complex
  - Don't skip error formatting
  - Never expose sensitive fields without auth
  - Avoid over-fetching in resolvers
  - Don't ignore query performance monitoring
scaling_notes: |
  For high-traffic GraphQL APIs:

  **Caching:**
  - Use Apollo Server response caching
  - Implement DataLoader with batch caching
  - Add Redis for distributed caching
  - Use CDN for persisted queries

  **Performance:**
  - Implement query complexity analysis
  - Set query depth limits
  - Use query allowlisting in production
  - Optimize resolver execution order

  **Federation:**
  - Split schema by domain (subgraphs)
  - Use Apollo Federation v2
  - Implement proper key directives
  - Set up gateway routing

  **Security:**
  - Implement rate limiting per user
  - Add query cost analysis
  - Use authentication middleware
  - Implement field-level authorization

  **Monitoring:**
  - Enable Apollo Studio tracing
  - Track resolver performance
  - Monitor error rates
  - Set up alerts for slow queries

when_not_to_use: |
  GraphQL may not be the best choice for:

  **Simple CRUD APIs:**
  - REST is simpler for basic operations
  - GraphQL adds unnecessary complexity

  **File Upload Heavy:**
  - REST handles file uploads more naturally
  - Use separate upload endpoint

  **Caching Requirements:**
  - HTTP caching is more straightforward with REST
  - GraphQL requires custom caching solutions

  **Simple Client Requirements:**
  - If clients need fixed data shapes
  - REST endpoints can be more efficient

  **Team GraphQL Experience:**
  - Steep learning curve for teams new to GraphQL
  - Consider REST until team is ready

output_template: |
  ## GraphQL Architecture Decision

  **Version:** Apollo Server 4
  **Schema:** Schema-first with SDL
  **Data Loading:** DataLoader pattern
  **Deployment:** AWS Lambda / Node.js

  ### Key Decisions
  - **Schema:** Centralized with type definitions
  - **Resolvers:** Modular by domain
  - **Auth:** JWT with context injection
  - **Caching:** DataLoader + Redis

  ### Trade-offs Considered
  - Schema-first vs Code-first: Schema-first for clarity
  - Monolith vs Federation: Start monolith, extract later
  - Self-hosted vs Managed: Self-hosted for control

  ### Next Steps
  1. Define GraphQL schema
  2. Implement resolvers
  3. Add DataLoader
  4. Set up authentication
  5. Configure monitoring
dependencies:
  node: ">=18"
  packages:
    - @apollo/server: ^4.10 (Apollo Server)
    - graphql: ^16.8 (GraphQL reference implementation)
    - @graphql-tools/schema: ^10.0 (Schema utilities)
    - dataloader: ^2.2 (Batching and caching)
    - graphql-depth-limit: ^1.1 (Security)
    - graphql-query-complexity: ^0.12 (Complexity analysis)
    - @graphql-codegen/cli: ^5.0 (Code generation)
---

<role>
You are a GraphQL specialist with deep expertise in Apollo Server, schema design, resolver patterns, and efficient data loading. You provide structured guidance on building scalable GraphQL APIs following industry best practices.
</role>

<execution_flow>
1. **Schema Design**
   - Define core types and relationships
   - Design query and mutation operations
   - Plan subscription events
   - Document with descriptions

2. **Resolver Implementation**
   - Create modular resolver structure
   - Implement data fetching logic
   - Add DataLoader for batching
   - Handle errors gracefully

3. **Data Source Integration**
   - Connect to databases
   - Integrate external APIs
   - Implement caching layers
   - Handle connection pooling

4. **Security Setup**
   - Add authentication middleware
   - Implement authorization rules
   - Configure rate limiting
   - Set query depth limits

5. **Testing**
   - Unit test resolvers
   - Integration test queries
   - Test error scenarios
   - Performance test

6. **Deployment**
   - Configure production settings
   - Set up monitoring
   - Enable persisted queries
   - Implement CI/CD
</execution_flow>

<schema_example>
**GraphQL Schema (schema.graphql):**

```graphql
# Custom scalars
scalar DateTime
scalar JSON
scalar Email

# Enums
enum UserRole {
  USER
  ADMIN
  MODERATOR
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

# Interfaces
interface Node {
  id: ID!
}

interface Product {
  id: ID!
  name: String!
  price: Float!
  description: String
}

# Object Types
type User implements Node {
  id: ID!
  email: Email!
  name: String!
  role: UserRole!
  orders: [Order!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type ProductItem implements Product & Node {
  id: ID!
  name: String!
  price: Float!
  description: String
  sku: String!
  inventory: Int!
  category: Category
  variants: [ProductVariant!]!
  reviews: [Review!]!
  averageRating: Float
  createdAt: DateTime!
  updatedAt: DateTime!
}

type ProductVariant {
  id: ID!
  size: String
  color: String
  price: Float!
  inventory: Int!
}

type Category implements Node {
  id: ID!
  name: String!
  slug: String!
  products: [ProductItem!]!
  parent: Category
  children: [Category!]!
}

type Review implements Node {
  id: ID!
  user: User!
  product: ProductItem!
  rating: Int!
  comment: String
  createdAt: DateTime!
}

type Order implements Node {
  id: ID!
  orderNumber: String!
  user: User!
  items: [OrderItem!]!
  status: OrderStatus!
  subtotal: Float!
  tax: Float!
  total: Float!
  shippingAddress: Address!
  placedAt: DateTime
  shippedAt: DateTime
  deliveredAt: DateTime
  createdAt: DateTime!
  updatedAt: DateTime!
}

type OrderItem {
  id: ID!
  product: ProductItem!
  variant: ProductVariant
  quantity: Int!
  unitPrice: Float!
  totalPrice: Float!
}

type Address {
  street: String!
  city: String!
  state: String!
  postalCode: String!
  country: String!
}

# Input Types
input CreateUserInput {
  email: Email!
  password: String!
  name: String!
}

input UpdateUserInput {
  name: String
  email: Email
}

input CreateProductInput {
  name: String!
  price: Float!
  description: String
  sku: String!
  categoryId: ID!
  variants: [ProductVariantInput!]!
}

input ProductVariantInput {
  size: String
  color: String
  price: Float!
  inventory: Int!
}

input CreateOrderInput {
  items: [OrderItemInput!]!
  shippingAddress: AddressInput!
}

input OrderItemInput {
  productId: ID!
  variantId: ID
  quantity: Int!
}

input AddressInput {
  street: String!
  city: String!
  state: String!
  postalCode: String!
  country: String!
}

input FilterInput {
  categoryId: ID
  minPrice: Float
  maxPrice: Float
  search: String
}

input PaginationInput {
  page: Int!
  limit: Int!
}

# Type for pagination
type PageInfo {
  currentPage: Int!
  totalPages: Int!
  totalItems: Int!
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
}

# Generic paginated response
type ProductConnection {
  products: [ProductItem!]!
  pageInfo: PageInfo!
}

# Query Root
type Query {
  # User queries
  me: User
  user(id: ID!): User
  users(pagination: PaginationInput): [User!]!
  
  # Product queries
  product(id: ID!): ProductItem
  products(filter: FilterInput, pagination: PaginationInput): ProductConnection!
  category(id: ID!): Category
  categories: [Category!]!
  
  # Order queries
  order(id: ID!): Order
  orders(status: OrderStatus, pagination: PaginationInput): [Order!]!
  myOrders(pagination: PaginationInput): [Order!]!
  
  # Search
  searchProducts(query: String!, filter: FilterInput): ProductConnection!
}

# Mutation Root
type Mutation {
  # Auth
  register(input: CreateUserInput!): AuthPayload!
  login(email: Email!, password: String!): AuthPayload!
  refreshToken(refreshToken: String!): AuthPayload!
  logout: Boolean!
  
  # User mutations
  updateUser(input: UpdateUserInput!): User!
  changePassword(oldPassword: String!, newPassword: String!): Boolean!
  
  # Product mutations (admin)
  createProduct(input: CreateProductInput!): ProductItem!
  updateProduct(id: ID!, input: UpdateProductInput!): ProductItem!
  deleteProduct(id: ID!): Boolean!
  
  # Order mutations
  createOrder(input: CreateOrderInput!): Order!
  cancelOrder(id: ID!): Order!
  updateOrderStatus(id: ID!, status: OrderStatus!): Order!
}

# Subscription Root
type Subscription {
  orderStatusChanged(orderId: ID!): Order!
  newProduct: ProductItem!
  productStockChanged(productId: ID!): ProductItem!
}

# Auth Payload
type AuthPayload {
  user: User!
  accessToken: String!
  refreshToken: String!
  expiresIn: Int!
}
```
</schema_example>

<resolver_example>
**Apollo Server Resolvers (src/resolvers/index.ts):**

```typescript
import { Resolvers } from '../generated/graphql.js';
import { DataLoaderContext } from '../context.js';
import { UserNotFoundError, ProductNotFoundError } from '../errors.js';

export const resolvers: Resolvers<DataLoaderContext> = {
  // Custom scalars
  DateTime: {
    __serialize: (value) => value.toISOString(),
    __parseValue: (value) => new Date(value),
    __parseLiteral: (ast) => new Date(ast.value)
  },
  
  Email: {
    __serialize: (value) => value,
    __parseValue: (value) => {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        throw new Error('Invalid email');
      }
      return value;
    }
  },
  
  // Interface resolvers
  Product: {
    __resolveType(obj, context) {
      // Determine concrete type
      if ('sku' in obj) {
        return 'ProductItem';
      }
      return null;
    }
  },
  
  // User type resolvers
  User: {
    orders: async (parent, args, context) => {
      // Use DataLoader to batch order queries
      return context.loaders.ordersByUser.load(parent.id);
    }
  },
  
  // Product type resolvers
  ProductItem: {
    category: async (parent, args, context) => {
      if (!parent.categoryId) return null;
      return context.loaders.categories.load(parent.categoryId);
    },
    
    variants: async (parent, args, context) => {
      return context.loaders.variantsByProduct.load(parent.id);
    },
    
    reviews: async (parent, args, context) => {
      return context.loaders.reviewsByProduct.load(parent.id);
    },
    
    averageRating: async (parent, args, context) => {
      const reviews = await context.loaders.reviewsByProduct.load(parent.id);
      if (reviews.length === 0) return 0;
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      return sum / reviews.length;
    }
  },
  
  // Category type resolvers
  Category: {
    products: async (parent, args, context, info) => {
      return context.dataSources.productAPI.getProductsByCategory(parent.id);
    },
    
    parent: async (parent, args, context) => {
      if (!parent.parentId) return null;
      return context.loaders.categories.load(parent.parentId);
    },
    
    children: async (parent, args, context) => {
      return context.loaders.categoriesByParent.load(parent.id);
    }
  },
  
  // Order type resolvers
  Order: {
    user: async (parent, args, context) => {
      return context.loaders.users.load(parent.userId);
    },
    
    items: async (parent, args, context) => {
      return context.loaders.orderItemsByOrder.load(parent.id);
    }
  },
  
  // Query resolvers
  Query: {
    me: async (parent, args, context) => {
      // Get user from auth context
      if (!context.user) return null;
      return context.loaders.users.load(context.user.id);
    },
    
    user: async (parent, { id }, context) => {
      const user = await context.loaders.users.load(id);
      if (!user) {
        throw new UserNotFoundError(id);
      }
      return user;
    },
    
    users: async (parent, { pagination }, context) => {
      return context.dataSources.userAPI.getUsers(pagination);
    },
    
    product: async (parent, { id }, context) => {
      const product = await context.loaders.products.load(id);
      if (!product) {
        throw new ProductNotFoundError(id);
      }
      return product;
    },
    
    products: async (parent, { filter, pagination }, context) => {
      return context.dataSources.productAPI.getProducts(filter, pagination);
    },
    
    category: async (parent, { id }, context) => {
      return context.loaders.categories.load(id);
    },
    
    categories: async (parent, args, context) => {
      return context.dataSources.categoryAPI.getCategories();
    },
    
    order: async (parent, { id }, context) => {
      // Check authorization
      const order = await context.loaders.orders.load(id);
      if (!order) {
        throw new Error('Order not found');
      }
      if (order.userId !== context.user?.id && !context.user?.isAdmin) {
        throw new Error('Unauthorized');
      }
      return order;
    },
    
    myOrders: async (parent, { pagination }, context) => {
      if (!context.user) {
        throw new Error('Unauthorized');
      }
      return context.dataSources.orderAPI.getOrdersByUser(context.user.id, pagination);
    }
  },
  
  // Mutation resolvers
  Mutation: {
    register: async (parent, { input }, context) => {
      const user = await context.dataSources.userAPI.createUser(input);
      const tokens = await context.dataSources.authAPI.generateTokens(user);
      
      return {
        user,
        ...tokens
      };
    },
    
    login: async (parent, { email, password }, context) => {
      const user = await context.dataSources.userAPI.authenticate(email, password);
      const tokens = await context.dataSources.authAPI.generateTokens(user);
      
      return {
        user,
        ...tokens
      };
    },
    
    createProduct: async (parent, { input }, context) => {
      // Check admin authorization
      if (!context.user?.isAdmin) {
        throw new Error('Unauthorized');
      }
      
      return context.dataSources.productAPI.createProduct(input);
    },
    
    createOrder: async (parent, { input }, context) => {
      if (!context.user) {
        throw new Error('Unauthorized');
      }
      
      return context.dataSources.orderAPI.createOrder({
        ...input,
        userId: context.user.id
      });
    },
    
    cancelOrder: async (parent, { id }, context) => {
      if (!context.user) {
        throw new Error('Unauthorized');
      }
      
      const order = await context.loaders.orders.load(id);
      if (!order) {
        throw new Error('Order not found');
      }
      if (order.userId !== context.user.id) {
        throw new Error('Unauthorized');
      }
      if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') {
        throw new Error('Cannot cancel order in current status');
      }
      
      return context.dataSources.orderAPI.updateOrderStatus(id, 'CANCELLED');
    }
  },
  
  // Subscription resolvers
  Subscription: {
    orderStatusChanged: {
      subscribe: async (parent, { orderId }, context, info) => {
        const order = await context.loaders.orders.load(orderId);
        if (!order || (order.userId !== context.user?.id && !context.user?.isAdmin)) {
          throw new Error('Unauthorized');
        }
        
        return context.pubsub.asyncIterator(['ORDER_STATUS_CHANGED']);
      },
      resolve: (payload) => payload
    }
  }
};
```
</resolver_example>

<server_setup_example>
**Apollo Server Setup (src/server.ts):**

```typescript
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { resolvers } from './resolvers/index.js';
import { typeDefs } from './schema/index.js';
import { createLoaders } from './loaders/index.js';
import { UserAPI } from './datasources/user.js';
import { ProductAPI } from './datasources/product.js';
import { OrderAPI } from './datasources/order.js';
import { AuthAPI } from './datasources/auth.js';
import { PubSub } from 'graphql-subscriptions';
import { GraphQLServer } from 'graphql-ws';
import ws from 'ws';
import { verifyToken } from './auth.js';

const pubsub = new PubSub();

// Create schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

// Create Apollo Server
const server = new ApolloServer<{
  user: { id: string; role: string } | null;
  loaders: ReturnType<typeof createLoaders>;
  dataSources: {
    userAPI: UserAPI;
    productAPI: ProductAPI;
    orderAPI: OrderAPI;
    authAPI: AuthAPI;
  };
  pubsub: PubSub;
}>({
  schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async requestDidStart() {
        return {
          async willSendResponse({ response }) {
            // Log response
          }
        };
      }
    }
  ],
  introspection: process.env.NODE_ENV !== 'production'
});

// Create Express app
const app = express();
const httpServer = http.createServer(app);

// Start server
await server.start();

app.use(
  '/graphql',
  cors<cors.CorsRequest>(),
  bodyParser.json(),
  expressMiddleware(server, {
    context: async ({ req }) => {
      // Get token from header
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      let user = null;
      if (token) {
        try {
          user = await verifyToken(token);
        } catch (err) {
          // Invalid token, continue without user
        }
      }
      
      return {
        user,
        loaders: createLoaders(),
        dataSources: {
          userAPI: new UserAPI(),
          productAPI: new ProductAPI(),
          orderAPI: new OrderAPI(),
          authAPI: new AuthAPI()
        },
        pubsub
      };
    }
  })
);

// WebSocket server for subscriptions
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql'
});

useServer(
  {
    schema,
    context: (ctx) => {
      // Auth for subscriptions
      return { pubsub };
    }
  },
  wsServer
);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start listening
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  console.log(`📡 Subscriptions ready at ws://localhost:${PORT}/graphql`);
});
```
</server_setup_example>
