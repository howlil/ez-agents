---
name: supply_chain_v1
description: Supply chain management for inventory, procurement, logistics, and vendor management
version: 1.0.0
tags: [supply-chain, inventory, procurement, logistics, vendor-management, warehouse]
category: domain
triggers:
  keywords: [supply chain, inventory, procurement, logistics, warehouse, vendor]
  projectArchetypes: [supply-chain, logistics, warehouse-management]
prerequisites:
  - database_design_basics
  - inventory_basics
  - logistics_fundamentals
workflow:
  setup:
    - Product catalog
    - Warehouse locations
    - Vendor database
    - Inventory tracking
  build:
    - Procurement workflows
    - Inventory management
    - Order fulfillment
    - Shipping integration
  optimize:
    - Demand forecasting
    - Reorder points
    - Route optimization
best_practices:
  - Track inventory in real-time
  - Set reorder points automatically
  - Integrate with suppliers
  - Use barcode/RFID scanning
  - Implement FIFO/LIFO
  - Track shipment status
  - Optimize warehouse layout
  - Forecast demand
  - Monitor supplier performance
  - Generate analytics reports
anti_patterns:
  - Never allow negative inventory
  - Don't skip receiving inspection
  - Avoid manual stock counts
  - Don't ignore lead times
  - Never skip cycle counts
  - Don't overstock slow items
  - Avoid single supplier dependency
  - Don't ignore returns processing
scaling_notes: |
  Supply Chain Scaling:
  - Start with inventory tracking
  - Add procurement automation
  - Implement warehouse management
  - Add logistics optimization
when_not_to_use: |
  Not for: Digital products only, very small operations
output_template: |
  ## Supply Chain Architecture
  **Warehouses:** {single | multi | 3PL}
  **Tracking:** {barcode | RFID | manual}
  **Integration:** {suppliers, shipping carriers}
dependencies:
  - database: "PostgreSQL"
  - shipping_api: "FedEx, UPS, DHL"
---

<role>
Supply Chain Architect specializing in logistics and inventory optimization.
Focus on efficiency, visibility, and cost reduction.
</role>
