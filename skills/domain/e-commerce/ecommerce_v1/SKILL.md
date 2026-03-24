---
name: E-Commerce Platform
description: Online shopping platform with catalog, cart, checkout, order fulfillment
version: 1.0.0
tags: [ecommerce, retail, online-shopping, payments]
category: domain
domain_type: ecommerce
triggers:
  keywords: [ecommerce, online store, shopping cart, checkout, product catalog]
  projectArchetypes: [ecommerce, online-retail, marketplace]
  constraints: [payment-processing, inventory-management, shipping-integration]
prerequisites:
  - payment_gateway_basics
  - inventory_management_basics
  - security_basics_pci_dss
key_workflows:
  - name: Product Catalog Management
    steps:
      - Add/edit products with variants (size, color)
      - Manage categories and collections
      - Set pricing and promotions
      - Upload product images with CDN
      - SEO optimization (meta tags, URLs)
    entities: [Product, ProductVariant, Category, Price, Image, SEOTags]
  - name: Shopping Cart
    steps:
      - Add to cart with quantity
      - Update quantities or remove items
      - Apply discount codes and promotions
      - Calculate shipping estimates
      - Save cart for later (persisted across sessions)
    entities: [Cart, CartItem, Discount, ShippingRate, Coupon]
  - name: Checkout Process
    steps:
      - Guest or login checkout option
      - Enter shipping address with validation
      - Select shipping method
      - Enter payment details (PCI-compliant)
      - Review and place order
      - Generate order confirmation
    entities: [Order, ShippingAddress, Payment, OrderConfirmation]
  - name: Order Fulfillment
    steps:
      - Payment capture and verification
      - Inventory allocation
      - Pick and pack workflow
      - Ship with tracking number
      - Delivery confirmation
    entities: [Fulfillment, Shipment, TrackingNumber, InventoryAllocation]
  - name: Returns and Refunds
    steps:
      - Customer initiates return request
      - Return authorization approval
      - Receive and inspect returned item
      - Process refund or exchange
      - Restock or dispose item
    entities: [ReturnRequest, Refund, Restock, Exchange]
compliance_requirements:
  - PCI-DSS for payment processing
  - GDPR for customer data (EU customers)
  - Sales tax compliance (location-based)
  - Accessibility (WCAG 2.1 AA)
  - Consumer protection laws (refund policies)
data_model_patterns:
  - Products with variants (size, color, material)
  - Cart persisted across sessions (database or Redis)
  - Orders immutable after placement (append-only for changes)
  - Inventory reservations during checkout
  - Price history for analytics
integration_points:
  - Payment gateways (Stripe, PayPal, Square)
  - Shipping carriers (FedEx, UPS, USPS, DHL)
  - Email service (SendGrid, Postmark)
  - Analytics (Google Analytics, Mixpanel)
  - CRM (Salesforce, HubSpot)
  - ERP systems (for inventory sync)
scaling_considerations: |
  E-commerce scaling strategies:

  1. **CDN for Product Images**:
     - Use CloudFront, Cloudflare, or similar
     - Lazy loading for product galleries
     - Multiple image sizes for different views

  2. **Database Read Replicas**:
     - Catalog reads far exceed writes
     - Use read replicas for product browsing
     - Write to primary for inventory updates

  3. **Cache Cart Data**:
     - Redis for cart storage
     - Fast cart operations
     - Session-based cart recovery

  4. **Queue for Order Processing**:
     - Async order confirmation emails
     - Background inventory updates
     - Fulfillment notifications

  5. **Search Optimization**:
     - Elasticsearch or Algolia for product search
     - Faceted search with filters
     - Search analytics for recommendations
when_not_to_use: |
  E-commerce platform may not be suitable for:

  1. **B2B with Complex Pricing**:
     - Custom pricing per customer
     - Quote-based workflows
     - Consider B2B-specific platforms

  2. **Subscription-Only Models**:
     - Recurring billing focus
     - Consider subscription platforms (Recurly, Chargebee)

  3. **Digital Products Without Physical Fulfillment**:
     - No shipping needed
     - Consider digital delivery platforms (Gumroad)

  4. **Marketplace with Multiple Vendors**:
     - Need vendor management
     - Consider marketplace-specific solutions
output_template: |
  ## E-Commerce Platform Decision

  **Domain:** E-Commerce
  **Version:** 1.0.0
  **Rationale:** [Why e-commerce platform was chosen]

  **Key Workflows:**
  - Product Catalog Management
  - Shopping Cart
  - Checkout Process
  - Order Fulfillment
  - Returns and Refunds

  **Compliance:**
  - PCI-DSS for payments
  - GDPR for customer data
  - Sales tax compliance

  **Integrations:**
  - Payment gateway: [Stripe/PayPal/Square]
  - Shipping: [FedEx/UPS/USPS]
  - Email: [SendGrid/Postmark]

  **Scaling Plan:**
  - CDN for images
  - Read replicas for catalog
  - Redis for cart
  - Queue for order processing
dependencies:
  - payment_gateway_integration
  - inventory_management_basics
  - email_service_integration
  - shipping_api_integration
---

<role>
You are an expert in e-commerce platform development with deep experience in online retail, payment processing, and order fulfillment.
You help teams build scalable, secure, and user-friendly shopping experiences that convert visitors into customers.
</role>

<execution_flow>
## Step 1: Assess Business Requirements
- Identify product types (physical, digital, subscriptions)
- Understand target market and compliance needs
- Determine payment and shipping requirements
- Assess inventory complexity

## Step 2: Design Data Model
- Define product catalog structure with variants
- Design cart and order entities
- Plan inventory tracking approach
- Establish customer data model

## Step 3: Implement Core Workflows
- Build product catalog management
- Implement shopping cart with persistence
- Create checkout flow with payment integration
- Develop order fulfillment pipeline

## Step 4: Integrate External Services
- Connect payment gateway (PCI-compliant)
- Integrate shipping carriers for rates and tracking
- Set up email service for notifications
- Configure analytics and tracking

## Step 5: Implement Compliance and Security
- Ensure PCI-DSS compliance for payments
- Implement GDPR data handling
- Add sales tax calculation
- Ensure accessibility compliance
</execution_flow>

<best_practices_detail>
### Product Catalog Design

```javascript
// Product with variants
{
  id: "prod_123",
  name: "Classic T-Shirt",
  description: "Comfortable cotton t-shirt",
  basePrice: 29.99,
  variants: [
    { sku: "TSH-RED-S", size: "S", color: "Red", price: 29.99, inventory: 100 },
    { sku: "TSH-RED-M", size: "M", color: "Red", price: 29.99, inventory: 150 },
    { sku: "TSH-BLUE-L", size: "L", color: "Blue", price: 34.99, inventory: 75 }
  ],
  categories: ["clothing", "men", "sale"],
  images: [
    { url: "https://cdn.example.com/tshirt-red.jpg", alt: "Red t-shirt front" }
  ],
  seo: {
    metaTitle: "Classic T-Shirt - Comfortable Cotton",
    metaDescription: "Shop our classic cotton t-shirt...",
    slug: "classic-t-shirt"
  }
}
```

### Cart Management

```javascript
// Cart stored in Redis
{
  cartId: "cart_abc123",
  customerId: "cust_456", // null for guest
  items: [
    {
      productId: "prod_123",
      variantSku: "TSH-RED-M",
      quantity: 2,
      unitPrice: 29.99,
      addedAt: "2026-03-21T10:00:00Z"
    }
  ],
  discounts: [{ code: "SAVE10", amount: 5.99 }],
  shippingAddress: { /* address object */ },
  createdAt: "2026-03-21T10:00:00Z",
  updatedAt: "2026-03-21T10:30:00Z",
  expiresAt: "2026-03-28T10:00:00Z"
}
```

### Order Immutability

```javascript
// Order is immutable after creation
{
  orderId: "ord_789",
  orderNumber: "ORD-2026-001234",
  customerId: "cust_456",
  status: "confirmed", // confirmed, processing, shipped, delivered, cancelled
  items: [/* snapshot of items at order time */],
  pricing: {
    subtotal: 59.98,
    shipping: 5.99,
    tax: 5.40,
    discount: 5.99,
    total: 65.38
  },
  shippingAddress: { /* snapshot */ },
  payment: {
    method: "card",
    last4: "4242",
    transactionId: "txn_xyz"
  },
  createdAt: "2026-03-21T11:00:00Z",
  // Changes tracked in separate timeline
  timeline: [
    { event: "order_placed", timestamp: "2026-03-21T11:00:00Z" },
    { event: "payment_captured", timestamp: "2026-03-21T11:00:05Z" },
    { event: "order_shipped", timestamp: "2026-03-22T09:00:00Z", trackingNumber: "1Z999AA10123456784" }
  ]
}
```

### PCI-Compliant Payment

```javascript
// Never touch card data - use payment gateway tokens
// Frontend (Stripe Elements)
const stripe = Stripe('pk_test_...');
const elements = stripe.elements();
const cardElement = elements.create('card');
cardElement.mount('#card-element');

// Backend - charge using token
const paymentIntent = await stripe.paymentIntents.create({
  amount: 6538, // cents
  currency: 'usd',
  payment_method: 'pm_card_visa',
  confirm: true
});
```
</best_practices_detail>

<anti_patterns_detail>
### Storing Sensitive Payment Data

**Problem:** Storing credit card numbers in your database

```javascript
// BAD: Never store card data
{
  customerId: "cust_456",
  savedCards: [
    { number: "4242424242424242", expiry: "12/26", cvv: "123" } // NEVER DO THIS
  ]
}

// GOOD: Store payment gateway customer ID and payment method tokens
{
  customerId: "cust_456",
  stripeCustomerId: "cus_stripe123",
  paymentMethods: [
    { id: "pm_visa4242", brand: "visa", last4: "4242", isDefault: true }
  ]
}
```

### Inventory Race Conditions

**Problem:** Overselling due to concurrent checkouts

```javascript
// BAD: Check then update without locking
const product = await Product.findById(productId);
if (product.inventory >= quantity) {
  await Product.update(productId, { inventory: product.inventory - quantity });
  // Two users can pass check simultaneously and oversell
}

// GOOD: Use database transactions with row locking
await db.transaction(async (trx) => {
  const product = await Product.findById(productId).forUpdate(trx);
  if (product.inventory >= quantity) {
    await product.$query(trx).patch({ inventory: product.inventory - quantity });
    await Order.create({ /* order data */ }).transacting(trx);
  } else {
    throw new Error('Out of stock');
  }
});
```

### Cart Abandonment

**Problem:** Losing cart data when user leaves

```javascript
// BAD: Cart only in memory or short-lived session
// User loses cart when closing browser

// GOOD: Persist cart to database with recovery
{
  cartId: "cart_abc123",
  customerId: "cust_456", // or null for guest with email
  guestEmail: "user@example.com", // for cart recovery emails
  persisted: true,
  expiresAt: "2026-03-28T10:00:00Z" // 7 days
}

// Send cart recovery email after 1 hour of abandonment
```
</anti_patterns_detail>

<scaling_notes_detail>
### High-Traffic Scaling Strategies

1. **Product Catalog Caching**
   ```javascript
   // Cache product pages with Redis
   async function getProductPage(slug) {
     const cached = await redis.get(`product:${slug}`);
     if (cached) return JSON.parse(cached);

     const product = await Product.findBySlug(slug);
     await redis.setex(`product:${slug}`, 3600, JSON.stringify(product));
     return product;
   }
   ```

2. **Database Sharding for Orders**
   ```javascript
   // Shard orders by customer ID or date
   // Orders from different customers go to different shards
   // Enables horizontal scaling for order writes
   ```

3. **Queue-Based Order Processing**
   ```javascript
   // Async order processing with Bull/Redis
   const orderQueue = new Queue('order-fulfillment');

   orderQueue.process(async (job) => {
     const { orderId } = job.data;
     await sendConfirmationEmail(orderId);
     await updateInventory(orderId);
     await notifyWarehouse(orderId);
   });

   // After order creation
   orderQueue.add({ orderId: order.id });
   ```

4. **CDN for Static Assets**
   ```
   Product images → CloudFront/Cloudflare
   CSS/JS bundles → CDN with cache invalidation
   User-generated content → S3 + CDN
   ```
</scaling_notes_detail>
