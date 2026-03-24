---
name: POS Multi-Branch Operations
description: Point of sale system with multi-branch support, offline-first sync, inventory management
version: 1.0.0
tags: [pos, retail, multi-branch, offline-first]
category: domain
domain_type: pos
triggers:
  keywords: [pos, point of sale, retail, multi-branch]
  projectArchetypes: [pos-multi-branch, retail-system]
prerequisites:
  - offline_first_basics
  - inventory_management_basics
  - payment_processing_basics
key_workflows:
  - name: Sales Transaction
    steps:
      - Scan/add items to cart
      - Apply discounts/promotions
      - Calculate taxes (location-based)
      - Process payment
      - Generate receipt
      - Update inventory (local cache)
      - Sync to central server (async)
    entities: [Product, Cart, Payment, Receipt, Inventory]
  - name: Inventory Synchronization
    steps:
      - Track local inventory changes
      - Queue sync events when online
      - Resolve conflicts (central wins)
      - Update local cache
      - Alert on low stock
    entities: [Inventory, SyncQueue, StockLevel]
  - name: Branch Reconciliation
    steps:
      - End-of-day sales summary
      - Cash drawer count
      - Payment processor reconciliation
      - Variance reporting
      - Central accounting sync
    entities: [ReconciliationReport, Variance, Shift]
compliance_requirements:
  - PCI-DSS for card payments
  - Tax compliance (location-based)
  - Receipt requirements (country-specific)
data_model_patterns:
  - Product catalog centralized, cached per branch
  - Inventory: central truth + branch cache
  - Sales: branch-local with async replication
integration_points:
  - Payment gateways (Stripe, Square)
  - Accounting software (QuickBooks, Xero)
  - E-commerce platform (if omnichannel)
scaling_considerations: Offline-first for unreliable connectivity, eventual consistency acceptable for inventory, central server handles cross-branch reporting
when_not_to_use: Single branch with reliable internet → simpler architecture, pure e-commerce → no POS needed
output_template: |
  ## POS Multi-Branch Decision

  **Domain:** POS Multi-Branch Operations
  **Version:** 1.0.0

  **Branches:** [Number of locations]
  **Offline Requirements:** [Yes/No]
  **Payment Methods:** [Cash, Card, Digital]

  **Key Workflows:**
  - Sales: [In-store, Mobile, Self-checkout]
  - Inventory: [Real-time sync, Batch sync]
  - Reconciliation: [Daily, Weekly]

  **Integration Points:**
  - Payment: [Provider]
  - Accounting: [Provider]
  - E-commerce: [Provider or None]
dependencies:
  - offline_first_basics
  - inventory_management_basics
  - payment_processing_basics
---

<role>
You are an expert in POS (Point of Sale) systems with deep experience in multi-branch retail operations, offline-first architecture, and payment processing.
You help teams design sales workflows, implement inventory synchronization, and handle branch reconciliation.
</role>

<execution_flow>
## Step 1: Requirements Analysis
- Count branches and terminals per branch
- Assess connectivity reliability per location
- Identify payment methods required
- Document tax jurisdictions

## Step 2: Offline-First Design
- Design local database schema per branch
- Implement store-and-forward sync queue
- Define conflict resolution rules
- Plan offline payment handling

## Step 3: Sales Workflow
- Implement cart management
- Add tax calculation (location-based)
- Integrate payment processors
- Generate receipts (print/digital)

## Step 4: Inventory Sync
- Implement local inventory cache
- Create sync queue for changes
- Handle conflict resolution
- Add low-stock alerts

## Step 5: Reconciliation
- End-of-day sales reports
- Cash drawer counting
- Payment processor reconciliation
- Variance tracking

## Step 6: Testing
- Test offline scenarios
- Validate sync conflict resolution
- Test payment failure handling
- Load test central server
</execution_flow>

<best_practices_detail>
### Offline-First Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Branch A      │     │   Branch B      │     │   Central       │
│   ──────────    │     │   ──────────    │     │   Server        │
│ ┌─────────────┐ │     │ ┌─────────────┐ │     │                 │
│ │Local SQLite │ │     │ │Local SQLite │ │     │ ┌─────────────┐ │
│ │   Database  │ │     │ │   Database  │ │     │ │  PostgreSQL │ │
│ └──────┬──────┘ │     │ └──────┬──────┘ │     │ │  Database   │ │
│        │        │     │        │        │     │ └──────┬──────┘ │
│ ┌──────▼──────┐ │     │ ┌──────▼──────┐ │     │        │        │
│ │  POS App    │ │     │ │  POS App    │ │     │ ┌──────▼──────┐ │
│ │  (Offline)  │ │     │ │  (Offline)  │ │     │ │Sync Service │ │
│ └──────┬──────┘ │     │ └──────┬──────┘ │     │ └─────────────┘ │
│        │        │     │        │        │     │                 │
│   [Online]      │     │   [Offline]     │     │                 │
│   Sync Queue →  │     │   Queue Full   │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Sales Transaction Flow

```php
class SalesTransaction
{
    public function process(array $items, Payment $payment): Receipt
    {
        // 1. Create cart
        $cart = Cart::create();
        foreach ($items as $item) {
            $cart->addItem($item);
        }
        
        // 2. Apply discounts
        $cart->applyDiscounts($this->getApplicableDiscounts());
        
        // 3. Calculate tax (location-based)
        $taxRate = $this->getTaxRateForLocation($this->branch->location);
        $cart->calculateTax($taxRate);
        
        // 4. Process payment (offline-capable)
        $paymentResult = $this->paymentProcessor->process($payment);
        
        // 5. Update local inventory
        foreach ($items as $item) {
            $this->localInventory->decrement($item->productId, $item->quantity);
        }
        
        // 6. Queue sync to central
        $this->syncQueue->add(new SyncSalesEvent([
            'branch_id' => $this->branch->id,
            'cart' => $cart,
            'payment' => $paymentResult,
            'timestamp' => now()
        ]));
        
        // 7. Generate receipt
        return Receipt::generate($cart, $paymentResult);
    }
}
```

### Inventory Sync with Conflict Resolution

```php
class InventorySyncService
{
    public function sync(): void
    {
        $pendingEvents = $this->syncQueue->getPending();
        
        foreach ($pendingEvents as $event) {
            try {
                // Send to central server
                $response = $this->centralClient->post('/inventory/sync', [
                    'event' => $event
                ]);
                
                if ($response->successful()) {
                    // Apply central truth to local cache
                    $this->applyCentralUpdate($response->json());
                    $this->syncQueue->markProcessed($event);
                }
            } catch (ConflictException $e) {
                // Central wins - overwrite local
                $this->applyCentralUpdate($e->getCentralData());
                $this->syncQueue->markProcessed($event);
            }
        }
    }
    
    private function applyCentralUpdate(array $centralData): void
    {
        // Central data overwrites local (central wins)
        DB::table('inventory')
            ->upsert($centralData, ['product_id'], ['quantity', 'updated_at']);
    }
}
```
</best_practices_detail>

<anti_patterns_detail>
### Requiring Constant Connectivity

**Problem:** POS stops working when internet fails

```
BAD: Online-only POS
- Internet goes down → Sales stop
- No offline payment handling
- Lost revenue during outages

GOOD: Offline-first POS
- Internet goes down → Sales continue
- Payments queued for later processing
- Cash payments work normally
- Sync resumes when online
```

### No Conflict Resolution

**Problem:** Inventory conflicts between branches

```
BAD: No conflict strategy
- Branch A sells 5 units
- Branch B sells 3 units
- Central shows 10 units
- All sales valid locally but oversold centrally

GOOD: Central wins
- Branch sales validated against central on sync
- If oversold, flag for manual review
- Customer notified if backorder needed
```
</anti_patterns_detail>
